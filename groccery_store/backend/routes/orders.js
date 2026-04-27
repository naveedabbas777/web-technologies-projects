// Orders Routes
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, isAdmin, isAdminOrRider, isDeliveryRider, isAdminOrStaff, isAdminOrStaffOrRider } = require('../middleware/authMiddleware');
const { validateCreateOrder, validateObjectId } = require('../middleware/validationMiddleware');

// Specific routes first (before generic :id routes)
router.get('/user/my-orders', verifyToken, orderController.getUserOrders);
router.get('/my-orders', verifyToken, orderController.getUserOrders);
router.get('/admin/stats/all', verifyToken, isAdminOrStaff, orderController.getOrderStats);
router.get('/rider/available', verifyToken, isDeliveryRider, orderController.getRiderAvailableOrders);
router.get('/rider/my-orders', verifyToken, isDeliveryRider, orderController.getRiderOrders);
router.post('/:id/claim', verifyToken, isDeliveryRider, validateObjectId('id'), orderController.claimOrder);

// User Routes
router.post('/', verifyToken, validateCreateOrder, orderController.createOrder);
router.get('/:id', verifyToken, validateObjectId('id'), orderController.getOrder);
router.post('/:id/cancel', verifyToken, validateObjectId('id'), orderController.cancelOrder);

// Admin Routes
router.get('/', verifyToken, isAdminOrStaff, orderController.getAllOrders);
router.put('/:id/status', verifyToken, isAdminOrStaffOrRider, validateObjectId('id'), orderController.updateOrderStatus);
router.put('/:id', verifyToken, isAdminOrStaffOrRider, validateObjectId('id'), orderController.updateOrderStatus);
router.put('/:id/payment', verifyToken, isAdmin, validateObjectId('id'), orderController.updatePaymentStatus);
router.post('/:orderId/assign-rider', verifyToken, isAdminOrStaff, validateObjectId('orderId'), orderController.assignRider);

module.exports = router;

