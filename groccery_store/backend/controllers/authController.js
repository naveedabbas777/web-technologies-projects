// Authentication Controller
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs/promises');
const User = require('../models/UserMongo');
const config = require('../config');
const { uploadImageToCloudinary } = require('../utils/cloudinary');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

// Generate JWT Token
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRY }
    );
};

// Register User
exports.register = async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;
        const normalizedEmail = String(email || '').trim().toLowerCase();
        const normalizedName = String(name || '').trim();

        // Validation
        if (!normalizedName || !normalizedEmail || !password || !phone) {
            return res.error(400, 'Please provide all required fields: name, email, password, phone', 'VALIDATION_ERROR');
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.error(409, 'User already exists with this email', 'USER_EXISTS');
        }

        // Create new user
        const user = new User({
            name: normalizedName,
            email: normalizedEmail,
            password,
            phone,
            address: address || '',
            role: 'customer'
        });

        // Save user (password will be hashed by schema pre-save hook)
        await user.save();

        // Generate token
        const token = generateToken(user);

        // Return user data without password
        const userResponse = user.toObject();
        delete userResponse.password;

        return res.success(201, 'User registered successfully', {
            token,
            user: userResponse
        });
    } catch (error) {
        console.error('Registration Error:', error);
        return res.error(500, error.message || 'Registration failed', 'REGISTRATION_FAILED');
    }
};

// Login User
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = String(email || '').trim().toLowerCase();

        // Validation
        if (!normalizedEmail || !password) {
            return res.error(400, 'Please provide email and password', 'VALIDATION_ERROR');
        }

        // Find user
        const user = await User.findOne({ email: normalizedEmail }).select('+password');
        
        if (!user) {
            return res.error(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.error(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
        }

        // Check if user is active
        if (!user.is_active) {
            return res.error(403, 'User account is inactive', 'USER_INACTIVE');
        }

        // Generate token
        const token = generateToken(user);

        // Return user data without password
        const userResponse = user.toObject();
        delete userResponse.password;

        return res.success(200, 'Login successful', {
            token,
            user: userResponse
        });
    } catch (error) {
        console.error('Login Error:', error);
        return res.error(500, error.message || 'Login failed', 'LOGIN_FAILED');
    }
};

// Get User Profile
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.error(401, 'Unauthorized', 'UNAUTHORIZED');
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.error(404, 'User not found', 'USER_NOT_FOUND');
        }

        const userResponse = user.toObject();
        delete userResponse.password;

        return res.success(200, null, null, { user: userResponse });
    } catch (error) {
        console.error('Get Profile Error:', error);
        return res.error(500, error.message || 'Failed to get profile', 'PROFILE_FETCH_FAILED');
    }
};

// Update User Profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { name, phone, address, avatar } = req.body;

        if (!userId) {
            return res.error(401, 'Unauthorized', 'UNAUTHORIZED');
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.error(404, 'User not found', 'USER_NOT_FOUND');
        }

        // Update allowed fields
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (address) user.address = address;
        if (avatar) user.avatar = avatar;
        user.updated_at = new Date();

        await user.save();

        const userResponse = user.toObject();
        delete userResponse.password;

        return res.success(200, 'Profile updated successfully', null, { user: userResponse });
    } catch (error) {
        console.error('Update Profile Error:', error);
        return res.error(500, error.message || 'Failed to update profile', 'PROFILE_UPDATE_FAILED');
    }
};

// Change Password
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { oldPassword, newPassword } = req.body;

        if (!userId) {
            return res.error(401, 'Unauthorized', 'UNAUTHORIZED');
        }

        if (!oldPassword || !newPassword) {
            return res.error(400, 'Please provide old and new password', 'VALIDATION_ERROR');
        }

        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.error(404, 'User not found', 'USER_NOT_FOUND');
        }

        // Verify old password
        const isPasswordValid = await user.comparePassword(oldPassword);
        if (!isPasswordValid) {
            return res.error(401, 'Current password is incorrect', 'INVALID_CREDENTIALS');
        }

        // Update password
        user.password = newPassword;
        user.updated_at = new Date();
        await user.save();

        return res.success(200, 'Password changed successfully');
    } catch (error) {
        console.error('Change Password Error:', error);
        return res.error(500, error.message || 'Failed to change password', 'PASSWORD_CHANGE_FAILED');
    }
};

// Logout (typically just for frontend to clear token)
exports.logout = async (req, res) => {
    try {
        return res.success(200, 'Logout successful');
    } catch (error) {
        return res.error(500, 'Logout failed', 'LOGOUT_FAILED');
    }
};

// Upload User Avatar/Profile Image
exports.uploadAvatar = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Unauthorized'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'No image file provided'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        const cloudinaryResult = await uploadImageToCloudinary(req.file.path, 'grocery/profiles');
        const avatarUrl = cloudinaryResult.secure_url;
        user.avatar = avatarUrl;
        user.updated_at = new Date();

        await user.save();
        await fs.unlink(req.file.path).catch(() => {});

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json({
            status: 'success',
            message: 'Avatar uploaded successfully',
            user: userResponse
        });
    } catch (error) {
        console.error('Upload Avatar Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to upload avatar'
        });
    }
};

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;
        const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 200 });
        
        let query = {};
        if (role) {
            query.role = role;
        }

        const users = await User.find(query)
            .skip(skip)
            .limit(limit)
            .select('-password');

        const total = await User.countDocuments(query);

        res.status(200).json({
            status: 'success',
            users,
            pagination: buildPaginationMeta({ page, limit, total })
        });
    } catch (error) {
        console.error('Get All Users Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to get users'
        });
    }
};

// Update user role (admin only)
exports.updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!['customer', 'admin', 'staff', 'delivery_rider'].includes(role)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid role'
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { role, updated_at: new Date() },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'User role updated successfully',
            user
        });
    } catch (error) {
        console.error('Update User Role Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to update user role'
        });
    }
};

// Deactivate user (admin only)
exports.deactivateUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndUpdate(
            userId,
            { is_active: false, updated_at: new Date() },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'User deactivated successfully',
            user
        });
    } catch (error) {
        console.error('Deactivate User Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to deactivate user'
        });
    }
};

// Activate user (admin only)
exports.activateUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndUpdate(
            userId,
            { is_active: true, updated_at: new Date() },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'User activated successfully',
            user
        });
    } catch (error) {
        console.error('Activate User Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to activate user'
        });
    }
};
