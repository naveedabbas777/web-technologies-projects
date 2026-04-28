const { body, param, validationResult } = require('express-validator');

const PASSWORD_POLICY_MESSAGE = 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character';

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }

    return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array().map((error) => ({
            field: error.path,
            message: error.msg
        }))
    });
};

const validateObjectId = (fieldName) => [
    param(fieldName)
        .isMongoId()
        .withMessage(`Invalid ${fieldName}`),
    handleValidationErrors
];

const validateRegister = [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
    body('email')
        .trim()
        .isLength({ max: 120 }).withMessage('Email must be 120 characters or fewer')
        .isEmail().withMessage('Valid email is required')
        .normalizeEmail(),
    body('password')
        .isStrongPassword({
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
        })
        .withMessage(PASSWORD_POLICY_MESSAGE),
    body('phone').trim().isLength({ min: 7, max: 20 }).withMessage('Phone is required'),
    handleValidationErrors
];

const validateLogin = [
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
];

const validateCreateOrder = [
    body('delivery_address')
        .optional()
        .trim()
        .isLength({ min: 5, max: 240 })
        .withMessage('Delivery address must be 5-240 characters'),
    body('address')
        .optional()
        .trim()
        .isLength({ min: 5, max: 240 })
        .withMessage('Address must be 5-240 characters'),
    body('payment_method').optional().isIn(['cash', 'card', 'easypaisa', 'jazzcash']).withMessage('Invalid payment method'),
    body('items').optional().isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
    body('items.*.quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.product_id').optional().isString().withMessage('product_id must be a string'),
    body('total').optional().isFloat({ min: 0 }).withMessage('Total must be greater than or equal to 0'),
    body().custom((payload) => {
        if (!payload.delivery_address && !payload.address) {
            throw new Error('Please provide delivery address');
        }
        return true;
    }),
    handleValidationErrors
];

const validateCreateProduct = [
    body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Product name must be 2-120 characters'),
    body('category').trim().isLength({ min: 2, max: 50 }).withMessage('Category is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be greater than or equal to 0'),
    body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be greater than or equal to 0'),
    body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
    handleValidationErrors
];

const validateUpdateProduct = [
    body('name').optional().trim().isLength({ min: 2, max: 120 }).withMessage('Product name must be 2-120 characters'),
    body('category').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Category must be 2-50 characters'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be greater than or equal to 0'),
    body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be greater than or equal to 0'),
    body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
    handleValidationErrors
];

const validateStockUpdate = [
    body('stock_quantity').isInt({ min: 0 }).withMessage('stock_quantity must be a non-negative integer'),
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateObjectId,
    validateRegister,
    validateLogin,
    validateCreateOrder,
    validateCreateProduct,
    validateUpdateProduct,
    validateStockUpdate
};
