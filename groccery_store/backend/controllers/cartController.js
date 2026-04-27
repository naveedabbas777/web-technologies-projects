// Cart Controller
const Cart = require('../models/CartMongo');
const Product = require('../models/ProductMongo');
const config = require('../config');

// Get user cart
exports.getCart = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Unauthorized'
            });
        }

        let cart = await Cart.findOne({ user_id: userId }).populate('items.product_id');
        
        if (!cart) {
            cart = new Cart({ user_id: userId, items: [] });
            await cart.save();
        }

        // Calculate totals
        let subtotal = 0;
        cart.items.forEach(item => {
            subtotal += item.price * item.quantity;
        });

        const tax = subtotal * config.TAX_RATE;
        const total = subtotal + tax;

        res.status(200).json({
            status: 'success',
            cart: {
                ...cart.toObject(),
                subtotal,
                tax,
                total,
                itemCount: cart.items.length
            }
        });
    } catch (error) {
        console.error('Get Cart Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to get cart'
        });
    }
};

// Add item to cart
exports.addToCart = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { product_id, quantity } = req.body;

        if (!userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Unauthorized'
            });
        }

        if (!product_id || !quantity) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide product_id and quantity'
            });
        }

        // Verify product exists
        const product = await Product.findById(product_id);
        if (!product) {
            return res.status(404).json({
                status: 'error',
                message: 'Product not found'
            });
        }

        if (product.stock_quantity < quantity) {
            return res.status(400).json({
                status: 'error',
                message: 'Insufficient stock'
            });
        }

        let cart = await Cart.findOne({ user_id: userId });
        if (!cart) {
            cart = new Cart({ user_id: userId, items: [] });
        }

        // Check if product already in cart
        const existingItem = cart.items.find(item => item.product_id.toString() === product_id);
        
        if (existingItem) {
            existingItem.quantity += parseInt(quantity);
        } else {
            cart.items.push({
                product_id,
                product_name: product.name,
                price: product.price,
                quantity: parseInt(quantity)
            });
        }

        cart.updated_at = new Date();
        await cart.save();

        const populatedCart = await Cart.findById(cart._id).populate('items.product_id');

        res.status(200).json({
            status: 'success',
            message: 'Item added to cart',
            cart: populatedCart
        });
    } catch (error) {
        console.error('Add to Cart Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to add item to cart'
        });
    }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { product_id, quantity } = req.body;

        if (!userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Unauthorized'
            });
        }

        if (!product_id || quantity === undefined) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide product_id and quantity'
            });
        }

        const cart = await Cart.findOne({ user_id: userId });
        if (!cart) {
            return res.status(404).json({
                status: 'error',
                message: 'Cart not found'
            });
        }

        const item = cart.items.find(item => item.product_id.toString() === product_id);
        if (!item) {
            return res.status(404).json({
                status: 'error',
                message: 'Product not in cart'
            });
        }

        // Verify stock
        const product = await Product.findById(product_id);
        if (product.stock_quantity < quantity) {
            return res.status(400).json({
                status: 'error',
                message: 'Insufficient stock'
            });
        }

        if (quantity <= 0) {
            // Remove item if quantity is 0
            cart.items = cart.items.filter(item => item.product_id.toString() !== product_id);
        } else {
            item.quantity = parseInt(quantity);
        }

        cart.updated_at = new Date();
        await cart.save();

        const populatedCart = await Cart.findById(cart._id).populate('items.product_id');

        res.status(200).json({
            status: 'success',
            message: 'Cart updated successfully',
            cart: populatedCart
        });
    } catch (error) {
        console.error('Update Cart Item Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to update cart'
        });
    }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { product_id } = req.body;

        if (!userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Unauthorized'
            });
        }

        if (!product_id) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide product_id'
            });
        }

        const cart = await Cart.findOne({ user_id: userId });
        if (!cart) {
            return res.status(404).json({
                status: 'error',
                message: 'Cart not found'
            });
        }

        cart.items = cart.items.filter(item => item.product_id.toString() !== product_id);
        cart.updated_at = new Date();
        await cart.save();

        const populatedCart = await Cart.findById(cart._id).populate('items.product_id');

        res.status(200).json({
            status: 'success',
            message: 'Item removed from cart',
            cart: populatedCart
        });
    } catch (error) {
        console.error('Remove from Cart Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to remove item from cart'
        });
    }
};

// Clear cart
exports.clearCart = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Unauthorized'
            });
        }

        const cart = await Cart.findOneAndUpdate(
            { user_id: userId },
            { items: [], updated_at: new Date() },
            { new: true }
        );

        if (!cart) {
            return res.status(404).json({
                status: 'error',
                message: 'Cart not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Cart cleared successfully',
            cart
        });
    } catch (error) {
        console.error('Clear Cart Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to clear cart'
        });
    }
};

// Get cart summary
exports.getCartSummary = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Unauthorized'
            });
        }

        const cart = await Cart.findOne({ user_id: userId }).populate('items.product_id');
        
        if (!cart) {
            return res.status(200).json({
                status: 'success',
                summary: {
                    itemCount: 0,
                    subtotal: 0,
                    tax: 0,
                    total: 0
                }
            });
        }

        let subtotal = 0;
        cart.items.forEach(item => {
            subtotal += item.price * item.quantity;
        });

        const tax = subtotal * 0.1;
        const total = subtotal + tax;

        res.status(200).json({
            status: 'success',
            summary: {
                itemCount: cart.items.length,
                subtotal,
                tax,
                total
            }
        });
    } catch (error) {
        console.error('Get Cart Summary Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to get cart summary'
        });
    }
};
