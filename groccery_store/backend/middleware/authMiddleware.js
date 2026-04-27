// Authentication Middleware
const jwt = require('jsonwebtoken');
const config = require('../config');

// Verify JWT Token
exports.verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'error',
                message: 'Token expired'
            });
        }
        res.status(401).json({
            status: 'error',
            message: 'Invalid token'
        });
    }
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({
            status: 'error',
            message: 'Forbidden - Admin access required'
        });
    }
    next();
};

// Check if user is delivery rider
exports.isDeliveryRider = (req, res, next) => {
    if (req.user?.role !== 'delivery_rider') {
        return res.status(403).json({
            status: 'error',
            message: 'Forbidden - Delivery Rider access required'
        });
    }
    next();
};

// Check if user is staff
exports.isStaff = (req, res, next) => {
    if (req.user?.role !== 'staff') {
        return res.status(403).json({
            status: 'error',
            message: 'Forbidden - Staff access required'
        });
    }
    next();
};

// Check if user is admin or delivery rider
exports.isAdminOrRider = (req, res, next) => {
    if (!['admin', 'delivery_rider'].includes(req.user?.role)) {
        return res.status(403).json({
            status: 'error',
            message: 'Forbidden - Admin or Delivery Rider access required'
        });
    }
    next();
};

// Check if user is admin or staff
exports.isAdminOrStaff = (req, res, next) => {
    if (!['admin', 'staff'].includes(req.user?.role)) {
        return res.status(403).json({
            status: 'error',
            message: 'Forbidden - Admin or Staff access required'
        });
    }
    next();
};

// Check if user is admin, staff, or delivery rider
exports.isAdminOrStaffOrRider = (req, res, next) => {
    if (!['admin', 'staff', 'delivery_rider'].includes(req.user?.role)) {
        return res.status(403).json({
            status: 'error',
            message: 'Forbidden - Admin, Staff, or Delivery Rider access required'
        });
    }
    next();
};

// Check if user is owner or admin
exports.isOwnerOrAdmin = (fieldName = 'userId') => {
    return (req, res, next) => {
        const targetUserId = req.params[fieldName] || req.body[fieldName];
        const currentUserId = req.user?.id;
        const isAdmin = req.user?.role === 'admin';

        if (currentUserId !== targetUserId && !isAdmin) {
            return res.status(403).json({
                status: 'error',
                message: 'Forbidden'
            });
        }
        next();
    };
};

// Optional token verification (doesn't require token but decodes if provided)
exports.optionalToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, config.JWT_SECRET);
            req.user = decoded;
        }
    } catch (error) {
        console.log('Optional token verification failed:', error.message);
    }
    next();
};
