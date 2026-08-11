const path = require('path');

const validateVideo = (req, res, next) => {
  // Check if this is an API request (JSON response expected)
  const isApiRequest = req.originalUrl.startsWith('/api/');

  if (!req.files || !req.files.video) {
    if (isApiRequest) {
      return res.status(400).json({ msg: 'Video file is required' });
    } else {
      // Legacy EJS route handling
      if (req.method === 'POST' && (req.originalUrl === '/videos/new' || req.originalUrl.includes('/videos/') && req.originalUrl.includes('/edit'))) {
        req.flash('error_msg', 'A video file is required for a video post.');
        return res.redirect(req.originalUrl);
      }
      return next();
    }
  }

  const video = req.files.video;
  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
  const maxSize = 100 * 1024 * 1024; // 100MB for API (increased from 50MB)

  if (!allowedTypes.includes(video.mimetype)) {
    if (isApiRequest) {
      return res.status(400).json({ msg: 'Only MP4, WebM, Ogg, MOV, and AVI video formats are allowed' });
    } else {
      req.flash('error_msg', 'Only MP4, WebM, and Ogg video formats are allowed.');
      return res.redirect(req.originalUrl);
    }
  }

  if (video.size > maxSize) {
    if (isApiRequest) {
      return res.status(400).json({ msg: 'Video file size must be less than 100MB' });
    } else {
      req.flash('error_msg', 'Video file size must be less than 50MB.');
      return res.redirect(req.originalUrl);
    }
  }

  next();
};

module.exports = { validateVideo };
