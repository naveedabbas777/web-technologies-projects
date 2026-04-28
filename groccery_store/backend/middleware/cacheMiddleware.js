const { get, set } = require('../utils/cacheStore');
const config = require('../config');

const buildCacheKey = (req, keyPrefix, perUser = false) => {
    const userPart = perUser ? `:u:${req.user?.id || 'guest'}` : '';
    return `${keyPrefix}${userPart}:${req.originalUrl}`;
};

exports.cacheGet = ({ keyPrefix, ttlSeconds = config.CACHE_TTL_SECONDS, perUser = false }) => async (req, res, next) => {
    if (req.method !== 'GET') {
        return next();
    }

    try {
        const cacheKey = buildCacheKey(req, keyPrefix, perUser);
        const cached = await get(cacheKey);

        if (cached) {
            return res.status(200).json(cached);
        }

        const originalJson = res.json.bind(res);
        res.json = (payload) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                set(cacheKey, payload, ttlSeconds).catch((error) => {
                    console.warn('Cache set failed:', error.message);
                });
            }
            return originalJson(payload);
        };

        return next();
    } catch (error) {
        console.warn('Cache middleware bypassed:', error.message);
        return next();
    }
};
