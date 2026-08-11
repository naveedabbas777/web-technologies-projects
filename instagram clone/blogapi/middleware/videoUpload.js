const path = require('path');

const validateVideo = (req, res, next) => {
  if (!req.files || !req.files.video) {
    // If no video is provided, and a new video post is being created/edited, this is an error
    if (req.method === 'POST' && (req.originalUrl === '/videos/new' || req.originalUrl.includes('/videos/') && req.originalUrl.includes('/edit'))) {
      req.flash('error_msg', 'A video file is required for a video post.');
      return res.redirect(req.originalUrl); // Redirect back to the same page
    }
    return next(); // For other cases, proceed (e.g., if video is optional or not part of this request)
  }

  const video = req.files.video;
  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  const maxSize = 50 * 1024 * 1024; // 50MB (adjust as needed)

  if (!allowedTypes.includes(video.mimetype)) {
    req.flash('error_msg', 'Only MP4, WebM, and Ogg video formats are allowed.');
    return res.redirect(req.originalUrl);
  }

  if (video.size > maxSize) {
    req.flash('error_msg', 'Video file size must be less than 50MB.');
    return res.redirect(req.originalUrl);
  }

  next();
};

module.exports = { validateVideo };
