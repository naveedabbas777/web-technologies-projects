const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send('Authorization header is missing');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).send('Token is missing from header');
  }

  try {
    const decoded = jwt.verify(token, 'your_secret_key');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).send('Invalid token');
  }
}

function adminMiddleware(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).send('Access denied. Admins only.');
    }
    next();
}

module.exports = { authMiddleware, adminMiddleware };
