// Products Routes
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, isAdmin, isAdminOrStaff, optionalToken } = require('../middleware/authMiddleware');
const { validateObjectId, validateCreateProduct, validateUpdateProduct, validateStockUpdate } = require('../middleware/validationMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { cacheGet } = require('../middleware/cacheMiddleware');

// Specific GET routes (must come BEFORE generic :id route)
router.get('/categories', cacheGet({ keyPrefix: 'cache:products:categories:', ttlSeconds: 300 }), productController.getCategories);
router.get('/categories/all', cacheGet({ keyPrefix: 'cache:products:categories:', ttlSeconds: 300 }), productController.getCategories);
router.get('/category/:category', cacheGet({ keyPrefix: 'cache:products:list:', ttlSeconds: 120 }), productController.getProductsByCategory);
router.get('/search/:query', cacheGet({ keyPrefix: 'cache:products:list:', ttlSeconds: 120 }), productController.searchProducts);
router.get('/stats/all', verifyToken, isAdmin, productController.getStats);
router.get('/admin/alerts', verifyToken, isAdmin, productController.getAlerts);

// Public Routes
router.get('/', optionalToken, cacheGet({ keyPrefix: 'cache:products:list:', ttlSeconds: 120 }), productController.getAllProducts);
router.get('/:id', productController.getProduct);

// Creation & modification routes
// POST /products - create with optional image
router.post('/',
    verifyToken,
    isAdminOrStaff,
    upload.single('image'),
    (err, req, res, next) => {
        // Multer error handling
        if (err instanceof require('multer').MulterError) {
            console.error('Multer error:', err.code);
            return res.status(400).json({
                status: 'error',
                message: err.code === 'LIMIT_FILE_SIZE' ? 'File size exceeds 5MB limit' : err.message
            });
        } else if (err) {
            console.error('Upload error:', err.message);
            return res.status(400).json({
                status: 'error',
                message: err.message || 'File upload failed'
            });
        }
        next();
    },
    validateCreateProduct,
    productController.createProduct
);

// PUT /products/:id - update with optional image
router.put('/:id',
    verifyToken,
    isAdminOrStaff,
    upload.single('image'),
    (err, req, res, next) => {
        // Multer error handling
        if (err instanceof require('multer').MulterError) {
            console.error('Multer error:', err.code);
            return res.status(400).json({
                status: 'error',
                message: err.code === 'LIMIT_FILE_SIZE' ? 'File size exceeds 5MB limit' : err.message
            });
        } else if (err) {
            console.error('Upload error:', err.message);
            return res.status(400).json({
                status: 'error',
                message: err.message || 'File upload failed'
            });
        }
        next();
    },
    validateObjectId('id'),
    validateUpdateProduct,
    productController.updateProduct
);

// DELETE /products/:id
router.delete('/:id', verifyToken, isAdmin, validateObjectId('id'), productController.deleteProduct);

// PUT /products/:id/stock
router.put('/:id/stock', verifyToken, isAdminOrStaff, validateObjectId('id'), validateStockUpdate, productController.updateStock);

module.exports = router;

