const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Use conditional fields for image posts or video posts
  imagePost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: false // Not required if it's a video comment
  },
  videoPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VideoPost',
    required: false // Not required if it's an image comment
  }
}, { timestamps: true });

// Add a pre-save hook to ensure only one type of post reference is set
CommentSchema.pre('save', function(next) {
  if (this.imagePost && this.videoPost) {
    return next(new Error('A comment cannot be associated with both an image post and a video post.'));
  }
  if (!this.imagePost && !this.videoPost) {
    return next(new Error('A comment must be associated with either an image post or a video post.'));
  }
  next();
});

module.exports = mongoose.model('Comment', CommentSchema);


