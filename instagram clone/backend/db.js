const mongoose = require('mongoose');
const appLogger = require('./utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect('mongodb://127.0.0.1:27017/instagram-clone', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    appLogger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    appLogger.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
