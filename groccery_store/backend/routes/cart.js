// Cart Routes
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { verifyToken } = require('../middleware/authMiddleware');

// All cart routes require authentication
router.get('/', verifyToken, cartController.getCart);
router.post('/add', verifyToken, cartController.addToCart);
router.put('/update', verifyToken, cartController.updateCartItem);
router.post('/remove', verifyToken, cartController.removeFromCart);
router.delete('/clear', verifyToken, cartController.clearCart);
router.get('/summary', verifyToken, cartController.getCartSummary);

module.exports = router;
