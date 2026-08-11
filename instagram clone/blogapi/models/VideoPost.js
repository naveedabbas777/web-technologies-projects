const mongoose = require('mongoose');

const VideoPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false // Description can be optional
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  videoPath: {
    type: String,
    required: true // Video file is required
  },
  thumbnailPath: {
    type: String,
    required: false // Thumbnail can be generated or optional
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

module.exports = mongoose.model('VideoPost', VideoPostSchema);
