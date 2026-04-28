const config = require('../config');

const memoryCache = new Map();
let redisClient = null;
let redisAvailable = false;

const redisEnabled = String(config.REDIS_ENABLED || '').toLowerCase() === 'true';
const redisUrl = config.REDIS_URL;

if (redisEnabled && redisUrl) {
    try {
        // Optional dependency: app still works without Redis.
        // eslint-disable-next-line global-require, import/no-extraneous-dependencies
        const Redis = require('ioredis');
        redisClient = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });

        redisClient.on('error', (error) => {
            redisAvailable = false;
            console.warn('Redis unavailable, falling back to in-memory cache:', error.message);
        });

        redisClient.connect()
            .then(() => {
                redisAvailable = true;
                console.log('Redis cache connected');
            })
            .catch((error) => {
                redisAvailable = false;
                console.warn('Redis connect failed, using in-memory cache:', error.message);
            });
    } catch (error) {
        console.warn('ioredis not installed, using in-memory cache');
    }
}

const now = () => Date.now();

const getMemory = (key) => {
    const value = memoryCache.get(key);
    if (!value) {
        return null;
    }

    if (value.expiresAt <= now()) {
        memoryCache.delete(key);
        return null;
    }

    return value.payload;
};

const setMemory = (key, payload, ttlSeconds) => {
    memoryCache.set(key, {
        payload,
        expiresAt: now() + (ttlSeconds * 1000)
    });
};

const normalizeKey = (key) => String(key || '').trim();

exports.get = async (key) => {
    const normalizedKey = normalizeKey(key);
    if (!normalizedKey) {
        return null;
    }

    if (redisClient && redisAvailable) {
        const value = await redisClient.get(normalizedKey);
        return value ? JSON.parse(value) : null;
    }

    return getMemory(normalizedKey);
};

exports.set = async (key, payload, ttlSeconds = config.CACHE_TTL_SECONDS) => {
    const normalizedKey = normalizeKey(key);
    if (!normalizedKey) {
        return;
    }

    const ttl = Math.max(Number(ttlSeconds) || 60, 1);

    if (redisClient && redisAvailable) {
        await redisClient.set(normalizedKey, JSON.stringify(payload), 'EX', ttl);
        return;
    }

    setMemory(normalizedKey, payload, ttl);
};

exports.invalidateByPrefix = async (prefix) => {
    const normalizedPrefix = normalizeKey(prefix);
    if (!normalizedPrefix) {
        return;
    }

    if (redisClient && redisAvailable) {
        const stream = redisClient.scanStream({ match: `${normalizedPrefix}*`, count: 100 });
        const deleteJobs = [];

        await new Promise((resolve, reject) => {
            stream.on('data', (keys = []) => {
                if (keys.length) {
                    deleteJobs.push(redisClient.del(...keys));
                }
            });
            stream.on('end', resolve);
            stream.on('error', reject);
        });

        await Promise.all(deleteJobs);
        return;
    }

    for (const key of memoryCache.keys()) {
        if (key.startsWith(normalizedPrefix)) {
            memoryCache.delete(key);
        }
    }
};
