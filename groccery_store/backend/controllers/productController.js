// Product Controller
const Product = require('../models/ProductMongo');
const { uploadImageToCloudinary } = require('../utils/cloudinary');
const fs = require('fs/promises');
const { invalidateByPrefix } = require('../utils/cacheStore');

const normalizeCategoryKey = Product.normalizeCategory || ((value = '') =>
    String(value)
        .trim()
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[\s_]+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-'));

const parsePositiveNumber = (value, fallback = null) => {
    if (value === undefined || value === null || value === '') return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const sanitizeProductInput = (body = {}) => {
    const payload = { ...body };
    if (payload.name !== undefined) payload.name = String(payload.name).trim();
    if (payload.description !== undefined) payload.description = String(payload.description).trim();
    if (payload.category !== undefined) payload.category = normalizeCategoryKey(payload.category);
    if (payload.price !== undefined) payload.price = parsePositiveNumber(payload.price);
    if (payload.stock_quantity !== undefined) payload.stock_quantity = parsePositiveNumber(payload.stock_quantity, 0);
    if (payload.rating !== undefined) payload.rating = parsePositiveNumber(payload.rating, 4.5);
    if (payload.expiry_date !== undefined) payload.expiry_date = payload.expiry_date ? new Date(payload.expiry_date) : null;
    if (payload.is_active !== undefined) payload.is_active = payload.is_active === true || payload.is_active === 'true';
    if (payload.featured !== undefined) payload.featured = payload.featured === true || payload.featured === 'true';
    return payload;
};

const emitProductsChanged = (req, payload = {}) => {
    const io = req.app?.get('io');
    if (io) {
        io.emit('products:changed', payload);
    }
};

const buildCategoryFilter = (value = '') => {
    const normalized = normalizeCategoryKey(value);

    if (!normalized) {
        return null;
    }

    if (normalized === 'meat-dairy' || normalized === 'meatanddairy') {
        return { $regex: '(meat|dairy)', $options: 'i' };
    }

    if (normalized === 'fruits' || normalized === 'fruit') {
        return { $regex: '^fruits?$', $options: 'i' };
    }

    if (normalized === 'vegetables' || normalized === 'vegetable' || normalized === 'veggies') {
        return { $regex: '^vegetables?$', $options: 'i' };
    }

    // Fallback: category exact match, case-insensitive.
    return { $regex: `^${normalized.replace(/-/g, '[\\s-]')}$`, $options: 'i' };
};

const buildProductProjection = () => '-__v';

// Get all products
exports.getAllProducts = async (req, res) => {
    try {
        const { category, search, sort = '-created_at', page = 1, limit = 10, offset, minPrice, maxPrice, expired, expiringMonths, lowStock } = req.query;
        
        let query = { is_active: true };

        // Filter by category
        if (category) {
            const categoryFilter = buildCategoryFilter(category);
            if (categoryFilter) {
                query.category = categoryFilter;
            }
        }

        // Filter by search
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

            // Filter by featured flag
            if (req.query.featured === 'true' || req.query.featured === true) {
                query.featured = true;
            }

        // Filter by price range
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        if (expired === 'true') {
            query.expiry_date = { $lte: new Date(), $ne: null };
        } else if (expiringMonths) {
            const months = parseInt(expiringMonths, 10);
            if (!Number.isNaN(months)) {
                const now = new Date();
                const future = new Date(now);
                future.setMonth(future.getMonth() + months);
                query.expiry_date = { $gte: now, $lte: future, $ne: null };
            }
        }

        if (lowStock) {
            const threshold = parseInt(lowStock, 10);
            if (!Number.isNaN(threshold)) {
                query.stock_quantity = { $lte: threshold };
            }
        }

        const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
        const parsedOffset = offset !== undefined ? parseInt(offset, 10) || 0 : null;
        const parsedPage = parseInt(page, 10) || 1;
        const skip = parsedOffset !== null ? parsedOffset : (parsedPage - 1) * parsedLimit;
        const safeSort = typeof sort === 'string' && sort.trim() ? sort : '-created_at';
        const products = await Product.find(query)
            .select(buildProductProjection())
            .sort(safeSort)
            .skip(skip)
            .limit(parsedLimit)
            .lean();

        const total = await Product.countDocuments(query);

        return res.paginated(200, products, {
            page: parsedPage,
            limit: parsedLimit,
            offset: skip,
            total,
            pages: Math.ceil(total / parsedLimit)
        }, 'products', {
            data: products
        });
    } catch (error) {
        console.error('Get Products Error:', error);
        return res.error(500, error.message || 'Failed to get products', 'PRODUCTS_FETCH_FAILED');
    }
};

// Frontend compatibility: GET /products/category/:category
exports.getProductsByCategory = async (req, res) => {
    req.query.category = req.params.category;
    return exports.getAllProducts(req, res);
};

// Frontend compatibility: GET /products/search/:query
exports.searchProducts = async (req, res) => {
    req.query.search = req.params.query;
    return exports.getAllProducts(req, res);
};

// Get single product
exports.getProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id);
        if (!product) {
            return res.error(404, 'Product not found', 'PRODUCT_NOT_FOUND');
        }

        return res.success(200, null, null, { product });
    } catch (error) {
        console.error('Get Product Error:', error);
        return res.error(500, error.message || 'Failed to get product', 'PRODUCT_FETCH_FAILED');
    }
};

// Create product (admin only)
exports.createProduct = async (req, res) => {
    try {
        const { name, description, category, price, stock_quantity, image_url, rating, expiry_date, featured } = sanitizeProductInput(req.body);

        console.log('📝 Create Product Request:');
        console.log('  Name:', name);
        console.log('  Category:', category);
        console.log('  Price:', price);
        console.log('  Stock:', stock_quantity);
        console.log('  File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');

        // Validation
        if (!name || !category || price === null || price === undefined || Number.isNaN(price)) {
            return res.error(400, 'Please provide name, category, and price', 'VALIDATION_ERROR');
        }

        if (stock_quantity !== null && stock_quantity < 0) {
            return res.error(400, 'Stock quantity cannot be negative', 'VALIDATION_ERROR');
        }

        // Determine image_url: uploaded file takes precedence over body parameter
        let finalImageUrl = null;
        try {
            if (req.file) {
                console.log(`🔄 Uploading image to Cloudinary...`);
                const cloudinaryResult = await uploadImageToCloudinary(req.file.path, 'grocery/products');
                finalImageUrl = cloudinaryResult.secure_url;
                console.log(`✅ Image uploaded: ${finalImageUrl}`);
                await fs.unlink(req.file.path).catch(() => {
                    console.log('⚠️  Could not delete temp file');
                });
            } else if (image_url) {
                finalImageUrl = image_url;
                console.log('✓ Using provided image URL');
            } else {
                console.log('⚠️  No image provided');
            }
        } catch (uploadError) {
            console.error('❌ Image upload failed:', uploadError.message);
            return res.error(400, `Image upload failed: ${uploadError.message}`, 'IMAGE_UPLOAD_FAILED');
        }

        const product = new Product({
            name,
            description: description || '',
            category,
            price,
            stock_quantity: stock_quantity || 0,
            image_url: finalImageUrl,
            rating: rating ?? 4.5,
            expiry_date,
            featured: featured ?? false,
            is_active: true
        });

        await product.save();
        console.log(`✅ Product saved to database with ID: ${product._id}`);

        emitProductsChanged(req, { productId: product._id, type: 'created' });
        invalidateByPrefix('cache:products:list:').catch(() => {});
        invalidateByPrefix('cache:products:categories:').catch(() => {});

        return res.success(201, 'Product created successfully', null, { product });
    } catch (error) {
        console.error('❌ Create Product Error:', error.message);
        console.error(error.stack);
        return res.error(500, error.message || 'Failed to create product', 'PRODUCT_CREATE_FAILED');
    }
};

// Update product (admin only)
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, category, price, stock_quantity, image_url, rating, is_active, expiry_date } = sanitizeProductInput(req.body);

        console.log('📝 Update Product Request:');
        console.log('  Product ID:', id);
        console.log('  File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');

        const product = await Product.findById(id);
        if (!product) {
            return res.error(404, 'Product not found', 'PRODUCT_NOT_FOUND');
        }

        // Update allowed fields
        if (name) product.name = name;
        if (description !== undefined) product.description = description;
        if (category) product.category = category;
        if (price !== null && price !== undefined) product.price = price;
        if (stock_quantity !== null && stock_quantity !== undefined) product.stock_quantity = stock_quantity;
        
        // Handle image: uploaded file takes precedence, then explicit image_url, then keep existing
        try {
            if (req.file) {
                console.log(`🔄 Uploading new image to Cloudinary...`);
                const cloudinaryResult = await uploadImageToCloudinary(req.file.path, 'grocery/products');
                product.image_url = cloudinaryResult.secure_url;
                console.log(`✅ New image uploaded: ${product.image_url}`);
                await fs.unlink(req.file.path).catch(() => {
                    console.log('⚠️  Could not delete temp file');
                });
            } else if (image_url !== undefined) {
                product.image_url = image_url;
                console.log('✓ Image URL updated');
            }
        } catch (uploadError) {
            console.error('❌ Image upload failed:', uploadError.message);
            return res.error(400, `Image upload failed: ${uploadError.message}`, 'IMAGE_UPLOAD_FAILED');
        }
        
        if (rating !== null && rating !== undefined) product.rating = rating;
        if (expiry_date !== undefined) {
            product.expiry_date = expiry_date;
        }
        if (is_active !== undefined) product.is_active = is_active;
        product.updated_at = new Date();

        await product.save();
        console.log(`✅ Product updated with ID: ${product._id}`);

        emitProductsChanged(req, { productId: product._id, type: 'updated' });
        invalidateByPrefix('cache:products:list:').catch(() => {});
        invalidateByPrefix('cache:products:categories:').catch(() => {});

        return res.success(200, 'Product updated successfully', null, { product });
    } catch (error) {
        console.error('❌ Update Product Error:', error.message);
        console.error(error.stack);
        return res.error(500, error.message || 'Failed to update product', 'PRODUCT_UPDATE_FAILED');
    }
};

// Get expiring/low stock products (admin only)
exports.getAlerts = async (req, res) => {
    try {
        const { expiringMonths, expired, lowStock, noExpiry, notExpiringMonths } = req.query;
        const now = new Date();
        const query = { is_active: true };

        if (noExpiry === 'true') {
            query.expiry_date = null;
        } else if (expired === 'true') {
            query.expiry_date = { $lte: now, $ne: null };
        } else if (notExpiringMonths) {
            const months = parseInt(notExpiringMonths, 10);
            if (!Number.isNaN(months)) {
                const future = new Date(now);
                future.setMonth(future.getMonth() + months);
                query.expiry_date = { $gt: future, $ne: null };
            }
        } else if (expiringMonths) {
            const months = parseInt(expiringMonths, 10);
            if (!Number.isNaN(months)) {
                const future = new Date(now);
                future.setMonth(future.getMonth() + months);
                query.expiry_date = { $gte: now, $lte: future, $ne: null };
            }
        }

        if (lowStock) {
            const threshold = parseInt(lowStock, 10);
            if (!Number.isNaN(threshold)) {
                query.stock_quantity = { $lte: threshold };
            }
        }

        const products = await Product.find(query).sort('expiry_date');
        const withExpiryInfo = products.map((product) => {
            const expiry = product.expiry_date ? new Date(product.expiry_date) : null;
            const diffDays = expiry ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) : null;
            return {
                ...product.toObject(),
                days_until_expiry: diffDays
            };
        });

        return res.success(200, null, null, { products: withExpiryInfo });
    } catch (error) {
        console.error('Get Alerts Error:', error);
        return res.error(500, error.message || 'Failed to get alerts', 'PRODUCT_ALERTS_FAILED');
    }
};

// Delete product (admin only)
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByIdAndUpdate(
            id,
            { is_active: false, updated_at: new Date() },
            { new: true }
        );

        if (!product) {
            return res.error(404, 'Product not found', 'PRODUCT_NOT_FOUND');
        }

        res.success(200, 'Product deleted successfully', null, { product });

        emitProductsChanged(req, { productId: product._id, type: 'deleted' });
        invalidateByPrefix('cache:products:list:').catch(() => {});
        invalidateByPrefix('cache:products:categories:').catch(() => {});
    } catch (error) {
        console.error('Delete Product Error:', error);
        return res.error(500, error.message || 'Failed to delete product', 'PRODUCT_DELETE_FAILED');
    }
};

// Get product categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await Product.find({ is_active: true })
            .distinct('category');

        categories.sort();

        return res.success(200, 'Categories fetched successfully', null, { categories });
    } catch (error) {
        console.error('Get Categories Error:', error);
        return res.error(500, error.message || 'Failed to get categories', 'CATEGORIES_FETCH_FAILED');
    }
};

// Get product stats (admin only)
exports.getStats = async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const activeProducts = await Product.countDocuments({ is_active: true });
        const inactiveProducts = await Product.countDocuments({ is_active: false });
        
        const lowStockProducts = await Product.find({ stock_quantity: { $lt: 5 }, is_active: true }).lean();

        const stats = await Product.aggregate([
            { $match: { is_active: true } },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    avgPrice: { $avg: '$price' },
                    maxPrice: { $max: '$price' },
                    minPrice: { $min: '$price' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        return res.success(200, 'Product stats fetched successfully', null, {
            stats: {
                totalProducts,
                activeProducts,
                inactiveProducts,
                lowStockProducts: lowStockProducts.length,
                byCategory: stats
            }
        });
    } catch (error) {
        console.error('Get Stats Error:', error);
        return res.error(500, error.message || 'Failed to get stats', 'PRODUCT_STATS_FAILED');
    }
};

// Update product stock
exports.updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { stock_quantity } = req.body;

        if (stock_quantity === undefined) {
            return res.error(400, 'Please provide stock_quantity', 'VALIDATION_ERROR');
        }

        const product = await Product.findByIdAndUpdate(
            id,
            { stock_quantity: parseInt(stock_quantity), updated_at: new Date() },
            { new: true }
        );

        if (!product) {
            return res.error(404, 'Product not found', 'PRODUCT_NOT_FOUND');
        }

        emitProductsChanged(req, { productId: product._id, type: 'stock' });
        invalidateByPrefix('cache:products:list:').catch(() => {});

        return res.success(200, 'Stock updated successfully', null, { product });
    } catch (error) {
        console.error('Update Stock Error:', error);
        return res.error(500, error.message || 'Failed to update stock', 'STOCK_UPDATE_FAILED');
    }
};
