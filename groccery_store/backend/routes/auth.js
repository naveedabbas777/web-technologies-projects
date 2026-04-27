// Authentication Routes
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin } = require('../middleware/validationMiddleware');
const uploadProfile = require('../middleware/uploadProfileMiddleware');

// Public Routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/logout', authController.logout);

// Protected Routes
router.get('/me', verifyToken, authController.getProfile);
router.get('/profile', verifyToken, authController.getProfile);
router.put('/profile', verifyToken, authController.updateProfile);
router.post('/upload-avatar', verifyToken, uploadProfile.single('avatar'), authController.uploadAvatar);
router.post('/change-password', verifyToken, authController.changePassword);

// Admin Routes
router.get('/users', verifyToken, isAdmin, authController.getAllUsers);
router.put('/users/:userId/role', verifyToken, isAdmin, authController.updateUserRole);
router.put('/users/:userId/deactivate', verifyToken, isAdmin, authController.deactivateUser);
router.put('/users/:userId/activate', verifyToken, isAdmin, authController.activateUser);

module.exports = router;
