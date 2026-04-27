// MongoDB Connection Module
const mongoose = require('mongoose');
const config = require('../config');

// Connection options
const mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
};

let connection = null;

async function connectMongoDB() {
    try {
        if (connection && connection.readyState === 1) {
            console.log('✅ MongoDB already connected');
            return connection;
        }

        const mongoUri = config.MONGODB_URI || `mongodb://${config.MONGODB_HOST}:${config.MONGODB_PORT}/${config.MONGODB_NAME}`;

        connection = await mongoose.connect(mongoUri, mongooseOptions);

        const db = connection.connection;
        console.log('✅ MongoDB connected successfully');
        console.log(`   Host: ${db.host || config.MONGODB_HOST}:${db.port || config.MONGODB_PORT}`);
        console.log(`   Database: ${db.name || config.MONGODB_NAME}`);

        return connection;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        throw error;
    }
}

async function disconnectMongoDB() {
    try {
        if (connection) {
            await mongoose.disconnect();
            connection = null;
            console.log('✅ MongoDB disconnected');
        }
    } catch (error) {
        console.error('❌ MongoDB disconnection failed:', error);
        throw error;
    }
}

function getConnection() {
    return connection;
}

async function testConnection() {
    try {
        await connectMongoDB();
        return true;
    } catch (error) {
        console.error('❌ MongoDB test connection failed:', error);
        return false;
    }
}

module.exports = {
    connectMongoDB,
    disconnectMongoDB,
    getConnection,
    testConnection,
    mongoose
};
