const sendSuccess = (res, {
    statusCode = 200,
    message,
    data,
    meta,
    ...extra
} = {}) => {
    const payload = {
        status: 'success',
        ...(message ? { message } : {}),
        ...(data !== undefined ? { data } : {}),
        ...(meta ? { meta } : {}),
        ...extra
    };

    return res.status(statusCode).json(payload);
};

const sendError = (res, {
    statusCode = 500,
    message = 'Internal Server Error',
    code,
    details,
    ...extra
} = {}) => {
    const payload = {
        status: 'error',
        message,
        ...(code ? { code } : {}),
        ...(details !== undefined ? { details } : {}),
        ...(res?.locals?.requestId ? { requestId: res.locals.requestId } : {}),
        ...extra
    };

    return res.status(statusCode).json(payload);
};

const sendPaginated = (res, {
    statusCode = 200,
    message,
    items,
    pagination,
    dataKey = 'data',
    ...extra
} = {}) => {
    return sendSuccess(res, {
        statusCode,
        ...(message ? { message } : {}),
        [dataKey]: items,
        pagination,
        ...extra
    });
};

module.exports = {
    sendSuccess,
    sendError,
    sendPaginated
};
