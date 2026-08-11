const appLogger = require('../utils/logger');

const logger = (req, res, next) => {
  // Skip noisy preflight requests and only log if request-level logging enabled
  if (req.method === 'OPTIONS') return next();
  appLogger.request(req);
  next();
};

module.exports = logger;
