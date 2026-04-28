const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');

const responseMiddleware = (req, res, next) => {
    res.success = (statusCode, message, data, extra = {}) => {
        return sendSuccess(res, { statusCode, message, data, ...extra });
    };

    res.error = (statusCode, message, code, details, extra = {}) => {
        return sendError(res, { statusCode, message, code, details, ...extra });
    };

    res.paginated = (statusCode, items, pagination, dataKey = 'data', extra = {}) => {
        return sendPaginated(res, { statusCode, items, pagination, dataKey, ...extra });
    };

    next();
};

module.exports = responseMiddleware;
