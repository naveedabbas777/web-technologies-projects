// Backend Configuration
require('dotenv').config();

const parseCorsOrigins = (value) => {
    if (!value) {
        return ['http://localhost:3000', 'http://localhost:5173'];
    }

    return value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
};

module.exports = {
    // Server Configuration
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',

    // Database Type Selection: 'mysql' or 'mongodb'
    DATABASE_TYPE: process.env.DATABASE_TYPE || 'mongodb',

    // MySQL Configuration
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_USER: process.env.DB_USER || 'root',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_NAME: process.env.DB_NAME || 'grocery_delivery_db',
    DB_PORT: process.env.DB_PORT || 3306,

    // MongoDB Configuration
    MONGODB_URI: process.env.MONGODB_URI || null,
    MONGODB_HOST: process.env.MONGODB_HOST || 'localhost',
    MONGODB_PORT: process.env.MONGODB_PORT || 27017,
    MONGODB_NAME: process.env.MONGODB_NAME || 'grocery_delivery_db',
    MONGODB_USER: process.env.MONGODB_USER || null,
    MONGODB_PASSWORD: process.env.MONGODB_PASSWORD || null,

    // JWT Configuration
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    JWT_EXPIRY: process.env.JWT_EXPIRY || '7d',

    // Pricing configuration
    TAX_RATE: parseFloat(process.env.TAX_RATE || '0.15'),
    DELIVERY_CHARGE: parseFloat(process.env.DELIVERY_CHARGE || '150'),

    // Application Configuration
    SALT_ROUNDS: 10,
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],

    // API Configuration
    API_URL: process.env.API_URL || 'http://localhost:5000',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    CORS_ORIGINS: parseCorsOrigins(process.env.CORS_ORIGINS),
    REDIS_ENABLED: process.env.REDIS_ENABLED || 'false',
    REDIS_URL: process.env.REDIS_URL || '',
    CACHE_TTL_SECONDS: parseInt(process.env.CACHE_TTL_SECONDS || '120', 10),

    // Email Configuration (Optional)
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: process.env.SMTP_PORT || 587,
    SMTP_USER: process.env.SMTP_USER || 'your-email@gmail.com',
    SMTP_PASS: process.env.SMTP_PASS || 'your-password',

    // Payment Gateway (Optional)
    PAYMENT_GATEWAY: process.env.PAYMENT_GATEWAY || 'stripe',
    STRIPE_KEY: process.env.STRIPE_KEY || '',

    // Cloudinary Configuration
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

    // Other Settings
    ITEMS_PER_PAGE: 12,
    MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    LOCK_TIME: parseInt(process.env.LOCK_TIME || '60000', 10), // 1 minute
};
