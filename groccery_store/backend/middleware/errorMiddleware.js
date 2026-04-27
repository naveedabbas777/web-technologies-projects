const config = require('../config');
const { sendError } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

const notFoundHandler = (req, res, next) => {
    next(new AppError('Route not found', 404, 'ROUTE_NOT_FOUND'));
};

const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const code = err.code || 'INTERNAL_ERROR';
    const message = err.message || 'Internal Server Error';

    if (statusCode >= 500) {
        const logPayload = {
            requestId: req.requestId || res.locals?.requestId,
            method: req.method,
            path: req.originalUrl,
            message,
            stack: err.stack
        };
        console.error(JSON.stringify(logPayload));
    }

    return sendError(res, {
        statusCode,
        code,
        message,
        ...(config.NODE_ENV === 'development' && statusCode >= 500 ? { details: err.stack } : {})
    });
};

module.exports = {
    notFoundHandler,
    errorHandler
};
