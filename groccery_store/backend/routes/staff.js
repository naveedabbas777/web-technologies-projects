// Staff Routes (admin management)
const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { verifyToken, isAdmin, isAdminOrStaff } = require('../middleware/authMiddleware');

// Specific routes first (before generic :id routes)
router.get('/stats/all', verifyToken, isAdmin, staffController.getStaffStats);
router.get('/riders/available', verifyToken, isAdminOrStaff, staffController.getDeliveryRiders);

// List and generic routes
router.get('/', verifyToken, isAdmin, staffController.getAllStaff);
router.post('/', verifyToken, isAdmin, staffController.addStaffMember);
router.get('/:id', verifyToken, isAdmin, staffController.getStaffMember);

// Update routes
router.put('/:id', verifyToken, isAdmin, staffController.updateStaffMember);
router.delete('/:id', verifyToken, isAdmin, staffController.deleteStaffMember);
router.post('/:id/activate', verifyToken, isAdmin, staffController.activateStaffMember);
router.post('/:id/deactivate', verifyToken, isAdmin, staffController.deactivateStaffMember);

module.exports = router;
