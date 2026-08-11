var express = require('express');
var router = express.Router();
const { restrictToAuthenticated } = require('../middleware/auth');
var Comment = require('../models/Comment');
var Post = require('../models/Post'); // For image posts
var VideoPost = require('../models/VideoPost'); // For video posts
var User = require('../models/User');
const mongoose = require('mongoose'); // Add mongoose import

// Create comment for an image post (auth)
router.post('/image/:postId', restrictToAuthenticated, async (req, res) => {
  const { content } = req.body;
  try {
    const newComment = new Comment({
      content,
      author: new mongoose.Types.ObjectId(req.session.userId),
      imagePost: req.params.postId // Associate with image post
    });
    await newComment.save();
    req.flash('success_msg', 'Comment added successfully');
    res.redirect(`/posts/${req.params.postId}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error adding comment');
    res.redirect(`/posts/${req.params.postId}`);
  }
});

// Create comment for a video post (auth)
router.post('/video/:videoId', restrictToAuthenticated, async (req, res) => {
  const { content } = req.body;
  try {
    const newComment = new Comment({
      content,
      author: new mongoose.Types.ObjectId(req.session.userId),
      videoPost: req.params.videoId // Associate with video post
    });
    await newComment.save();
    req.flash('success_msg', 'Comment added successfully');
    res.redirect(`/videos/${req.params.videoId}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error adding comment');
    res.redirect(`/videos/${req.params.videoId}`);
  }
});

// Delete comment
router.post('/:id/delete', restrictToAuthenticated, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      req.flash('error_msg', 'Comment not found');
      return res.redirect('/');
    }
    if (!comment.author.equals(new mongoose.Types.ObjectId(req.session.userId))) {
      req.flash('error_msg', 'You are not authorized to delete this comment');
      return res.redirect('/');
    }

    let redirectPath = '/';
    if (comment.imagePost) {
      redirectPath = `/posts/${comment.imagePost}`;
    } else if (comment.videoPost) {
      redirectPath = `/videos/${comment.videoPost}`;
    }

    await comment.deleteOne();
    req.flash('success_msg', 'Comment deleted successfully');
    res.redirect(redirectPath);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting comment');
    res.redirect('/');
  }
});

module.exports = router;
