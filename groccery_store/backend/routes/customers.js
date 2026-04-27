// Customer Routes (admin management)
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { verifyToken, isAdmin, isAdminOrStaff } = require('../middleware/authMiddleware');

// Specific routes first (before generic :id routes)
router.get('/stats/all', verifyToken, isAdminOrStaff, customerController.getCustomerStats);

// List and generic routes
router.get('/', verifyToken, isAdminOrStaff, customerController.getAllCustomers);
router.get('/:id', verifyToken, isAdminOrStaff, customerController.getCustomer);
router.get('/:id/orders', verifyToken, isAdminOrStaff, customerController.getCustomerOrders);

// Update routes
router.put('/:id', verifyToken, isAdmin, customerController.updateCustomer);
router.post('/:id/deactivate', verifyToken, isAdmin, customerController.deactivateCustomer);
router.post('/:id/activate', verifyToken, isAdmin, customerController.activateCustomer);
router.delete('/:id', verifyToken, isAdmin, customerController.deleteCustomer);

module.exports = router;
