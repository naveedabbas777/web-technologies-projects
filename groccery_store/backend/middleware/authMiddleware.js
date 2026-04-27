// Authentication Middleware
const jwt = require('jsonwebtoken');
const config = require('../config');

// Verify JWT Token
exports.verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.error(401, 'No token provided', 'AUTH_MISSING_TOKEN');
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.error(401, 'Token expired', 'AUTH_TOKEN_EXPIRED');
        }
        res.error(401, 'Invalid token', 'AUTH_INVALID_TOKEN');
    }
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.error(403, 'Forbidden - Admin access required', 'AUTH_FORBIDDEN');
    }
    next();
};

// Check if user is delivery rider
exports.isDeliveryRider = (req, res, next) => {
    if (req.user?.role !== 'delivery_rider') {
        return res.error(403, 'Forbidden - Delivery Rider access required', 'AUTH_FORBIDDEN');
    }
    next();
};

// Check if user is staff
exports.isStaff = (req, res, next) => {
    if (req.user?.role !== 'staff') {
        return res.error(403, 'Forbidden - Staff access required', 'AUTH_FORBIDDEN');
    }
    next();
};

// Check if user is admin or delivery rider
exports.isAdminOrRider = (req, res, next) => {
    if (!['admin', 'delivery_rider'].includes(req.user?.role)) {
        return res.error(403, 'Forbidden - Admin or Delivery Rider access required', 'AUTH_FORBIDDEN');
    }
    next();
};

// Check if user is admin or staff
exports.isAdminOrStaff = (req, res, next) => {
    if (!['admin', 'staff'].includes(req.user?.role)) {
        return res.error(403, 'Forbidden - Admin or Staff access required', 'AUTH_FORBIDDEN');
    }
    next();
};

// Check if user is admin, staff, or delivery rider
exports.isAdminOrStaffOrRider = (req, res, next) => {
    if (!['admin', 'staff', 'delivery_rider'].includes(req.user?.role)) {
        return res.error(403, 'Forbidden - Admin, Staff, or Delivery Rider access required', 'AUTH_FORBIDDEN');
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
            return res.error(403, 'Forbidden', 'AUTH_FORBIDDEN');
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
