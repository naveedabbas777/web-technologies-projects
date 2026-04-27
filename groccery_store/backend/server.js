// Main Server File - Online Grocery Delivery Management System
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { connectMongoDB } = require('./models/mongodb');
const requestContextMiddleware = require('./middleware/requestContextMiddleware');
const responseMiddleware = require('./middleware/responseMiddleware');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

if (config.NODE_ENV === 'production' && config.JWT_SECRET === 'your-secret-key-change-in-production') {
    throw new Error('JWT_SECRET must be set in production environment');
}

const allowedOrigins = new Set(config.CORS_ORIGINS);
const corsOriginHandler = (origin, callback) => {
    if (!origin) {
        return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
        return callback(null, true);
    }

    return callback(new Error('CORS policy blocked this origin'));
};

// Initialize Express App
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: corsOriginHandler,
        credentials: true
    }
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${config.PORT} is already in use. Stop the other process or set a different PORT.`);
        process.exit(1);
    }

    console.error('❌ Server startup error:', error);
    process.exit(1);
});

app.set('io', io);

io.on('connection', (socket) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, config.JWT_SECRET);
            socket.user = decoded;
            socket.join(`user:${decoded.id}`);

            const normalizedRole = decoded.role === 'delivery_rider' ? 'delivery_rider' : decoded.role;
            socket.join(`role:${normalizedRole}`);
        } catch (error) {
            console.log('Socket auth failed:', error.message);
        }
    }

    console.log('🟢 Socket connected:', socket.id, socket.user ? `(${socket.user.id})` : '');
    socket.on('disconnect', () => {
        console.log('🔴 Socket disconnected:', socket.id);
    });
});

// Security Middleware
app.use(requestContextMiddleware);
app.use(responseMiddleware);

app.use(helmet());
app.use(cors({
    origin: corsOriginHandler,
    credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
    windowMs: config.LOCK_TIME,
    max: config.MAX_LOGIN_ATTEMPTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        message: 'Too many authentication attempts. Please try again in 1 minute.'
    }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body Parser Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Static Files
app.use(express.static('public'));

// Database Connection Test Route
app.get('/api/health', (req, res) => {
    res.success(200, 'Server is running', null, {
        timestamp: new Date(),
        database: {
            type: config.DATABASE_TYPE,
            mongodb_name: config.MONGODB_NAME,
            mongodb_host: config.MONGODB_HOST,
            mongodb_port: config.MONGODB_PORT
        }
    });
});

// Home Route
app.get('/', (req, res) => {
    res.success(200, 'Welcome to Online Grocery Delivery Management System', null, {
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            products: '/api/products',
            cart: '/api/cart',
            orders: '/api/orders',
            customers: '/api/customers',
            staff: '/api/staff',
            contact: '/api/contact',
            settings: '/api/settings',
            categories: '/api/categories'
        }
    });
});

// Import and Use Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/categories', require('./routes/categories'));

// 404 and Global Error Handler
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server with MongoDB Connection
const PORT = config.PORT;

// Connect to MongoDB and start server
connectMongoDB()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
            console.log(`Environment: ${config.NODE_ENV}`);
            console.log(`Database: MongoDB - ${config.MONGODB_NAME}`);
            console.log(`\nAPI Endpoints:`);
            console.log(`  Auth: http://localhost:${PORT}/api/auth`);
            console.log(`  Products: http://localhost:${PORT}/api/products`);
            console.log(`  Orders: http://localhost:${PORT}/api/orders`);
            console.log(`  Cart: http://localhost:${PORT}/api/cart`);
            console.log(`  Customers: http://localhost:${PORT}/api/customers`);
            console.log(`  Staff: http://localhost:${PORT}/api/staff`);
            console.log(`  Contact: http://localhost:${PORT}/api/contact`);
            console.log(`  Settings: http://localhost:${PORT}/api/settings`);
        });
    })
    .catch(error => {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    });

module.exports = app;

