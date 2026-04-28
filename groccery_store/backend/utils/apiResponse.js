const sendSuccess = (res, a, b, c, d) => {
    let statusCode = 200;
    let message = null;
    let data = null;
    let meta = null;

    if (typeof a === 'object' && a !== null && !Array.isArray(a)) {
        ({ statusCode = 200, message = null, data = null, meta = null } = a);
    } else {
        statusCode = a || 200;
        message = b || null;
        data = c || null;
        meta = d || null;
    }

    const payload = {
        status: 'success',
        ...(message ? { message } : {}),
        ...(data !== undefined ? { data } : {}),
        ...(meta !== undefined ? { meta } : {}),
        timestamp: new Date().toISOString()
    };

    return res.status(statusCode).json(payload);
};

const sendError = (res, a = {}) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let code = 'INTERNAL_ERROR';
    let details = null;

    if (typeof a === 'object' && a !== null && !Array.isArray(a)) {
        ({ statusCode = 500, message = 'Internal Server Error', code = 'INTERNAL_ERROR', details = null } = a);
    } else {
        statusCode = a || 500;
        message = arguments[2] || 'Internal Server Error';
        code = arguments[3] || 'INTERNAL_ERROR';
        details = arguments[4] || null;
    }

    const payload = {
        status: 'error',
        message,
        ...(code ? { code } : {}),
        ...(details !== undefined && details !== null ? { details } : {}),
        ...(res?.locals?.requestId ? { requestId: res.locals.requestId } : {}),
        timestamp: new Date().toISOString()
    };

    return res.status(statusCode).json(payload);
};

const sendPaginated = (res, a = {}, b = {}, c = {}) => {
    let statusCode = 200;
    let items = [];
    let pagination = {};
    let dataKey = 'data';

    if (typeof a === 'object' && a !== null && !Array.isArray(a)) {
        ({ statusCode = 200, items = [], pagination = {}, dataKey = 'data' } = a);
    } else {
        statusCode = a || 200;
        items = b || [];
        pagination = c || {};
    }

    const payload = {
        status: 'success',
        [dataKey]: items,
        pagination: {
            page: pagination.page || 1,
            limit: pagination.limit || items.length || 0,
            total: pagination.total || 0,
            pages: pagination.pages || Math.ceil((pagination.total || 0) / (pagination.limit || items.length || 1))
        },
        timestamp: new Date().toISOString()
    };

    return res.status(statusCode).json(payload);
};

module.exports = {
    sendSuccess,
    sendError,
    sendPaginated
};
