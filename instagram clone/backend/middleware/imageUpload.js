const path = require('path');

const validateImage = (req, res, next) => {
  // If no file is provided for 'image' (for posts), and a new post is being created/edited, this is an error
  if (!req.files || !req.files.image) {
    if (req.method === 'POST' && (req.originalUrl === '/posts/new' || req.originalUrl.includes('/posts/') && req.originalUrl.includes('/edit'))) {
      req.flash('error_msg', 'An image is required for a post.');
      return res.redirect(req.originalUrl); // Redirect back to the same page
    }
    return next(); // For other cases, proceed (e.g., profile picture, or if image is optional)
  }

  const image = req.files.image;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(image.mimetype)) {
    req.flash('error_msg', 'Only JPEG, PNG, and GIF images are allowed');
    return res.redirect(req.originalUrl); // Redirect back to the same page
  }

  if (image.size > maxSize) {
    req.flash('error_msg', 'Image size must be less than 5MB');
    return res.redirect(req.originalUrl); // Redirect back to the same page
  }

  next();
};

module.exports = { validateImage };
