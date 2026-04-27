const { randomUUID } = require('crypto');

const requestContextMiddleware = (req, res, next) => {
    const requestId = randomUUID();
    const start = Date.now();

    req.requestId = requestId;
    res.locals.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    res.on('finish', () => {
        const durationMs = Date.now() - start;
        const payload = {
            requestId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs
        };

        const line = JSON.stringify(payload);
        if (res.statusCode >= 500) {
            console.error(line);
            return;
        }

        console.log(line);
    });

    next();
};

module.exports = requestContextMiddleware;
