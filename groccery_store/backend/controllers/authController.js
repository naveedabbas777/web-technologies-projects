// Authentication Controller
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs/promises');
const User = require('../models/UserMongo');
const config = require('../config');
const { uploadImageToCloudinary } = require('../utils/cloudinary');

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

        // Validation
        if (!name || !email || !password || !phone) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide all required fields: name, email, password, phone'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                status: 'error',
                message: 'User already exists with this email'
            });
        }

        // Create new user
        const user = new User({
            name,
            email: email.toLowerCase(),
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

        res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            token,
            user: userResponse
        });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Registration failed'
        });
    }
};

// Login User
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide email and password'
            });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.is_active) {
            return res.status(403).json({
                status: 'error',
                message: 'User account is inactive'
            });
        }

        // Generate token
        const token = generateToken(user);

        // Return user data without password
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            token,
            user: userResponse
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Login failed'
        });
    }
};

// Get User Profile
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Unauthorized'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json({
            status: 'success',
            user: userResponse
        });
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to get profile'
        });
    }
};

// Update User Profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { name, phone, address, avatar } = req.body;

        if (!userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Unauthorized'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
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

        res.status(200).json({
            status: 'success',
            message: 'Profile updated successfully',
            user: userResponse
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to update profile'
        });
    }
};

// Change Password
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { oldPassword, newPassword } = req.body;

        if (!userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Unauthorized'
            });
        }

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide old and new password'
            });
        }

        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Verify old password
        const isPasswordValid = await user.comparePassword(oldPassword);
        if (!isPasswordValid) {
            return res.status(401).json({
                status: 'error',
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        user.updated_at = new Date();
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to change password'
        });
    }
};

// Logout (typically just for frontend to clear token)
exports.logout = async (req, res) => {
    try {
        res.status(200).json({
            status: 'success',
            message: 'Logout successful'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Logout failed'
        });
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
        const { role, page = 1, limit = 10 } = req.query;
        
        let query = {};
        if (role) {
            query.role = role;
        }

        const skip = (page - 1) * limit;
        const users = await User.find(query)
            .skip(skip)
            .limit(parseInt(limit))
            .select('-password');

        const total = await User.countDocuments(query);

        res.status(200).json({
            status: 'success',
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
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
