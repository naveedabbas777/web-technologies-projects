const express = require('express');
const router = express.Router();
const VideoPost = require('../models/VideoPost');
const User = require('../models/User');
const { restrictToAuthenticated } = require('../middleware/auth');
const { validateVideo } = require('../middleware/videoUpload');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const fs = require('fs');
const Comment = require('../models/Comment'); // Import Comment model

// Utility function to delete a file
const deleteFile = (filePath) => {
  const fullPath = path.join(__dirname, '..', 'public', filePath);
  fs.unlink(fullPath, (err) => {
    if (err) console.error('Failed to delete file:', filePath, err);
  });
};

// GET /videos - Display all video posts (feed)
router.get('/', async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const searchQuery = req.query.search || '';

  try {
    let query = {};

    if (searchQuery) {
      query.$or = [
        { title: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    const totalVideoPosts = await VideoPost.countDocuments(query);
    const videoPosts = await VideoPost.find(query)
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Fetch comment counts for each video post
    for (let i = 0; i < videoPosts.length; i++) {
      videoPosts[i].commentCount = await Comment.countDocuments({ videoPost: videoPosts[i]._id });
    }

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      res.json({ videoPosts, totalPages: Math.ceil(totalVideoPosts / limit) });
    } else {
      res.render('video_feed', { videoPosts: videoPosts, currentPage: page, totalPages: Math.ceil(totalVideoPosts / limit), searchQuery: searchQuery });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// GET /videos/new - Render new video post form
router.get('/new', restrictToAuthenticated, (req, res) => {
  res.render('video_new', { errors: [], formData: {} });
});

// POST /videos - Create new video post
router.post('/new', restrictToAuthenticated, validateVideo, async (req, res) => {
  const { title, description } = req.body;
  let videoPath = null;

  if (req.files && req.files.video) {
    const video = req.files.video;
    const videoName = `${uuidv4()}${path.extname(video.name)}`;
    videoPath = `/videos/${videoName}`;
    const uploadPath = path.join(__dirname, '../public/videos');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    video.mv(path.join(uploadPath, videoName), err => {
      if (err) {
        console.error(err);
        req.flash('error_msg', 'Error uploading video');
        return res.redirect('/videos/new');
      }
    });
  }

  try {
    const newVideoPost = new VideoPost({
      title,
      description,
      author: req.session.userId,
      videoPath: videoPath
    });
    await newVideoPost.save();
    req.flash('success_msg', 'Video post created successfully');
    res.redirect('/videos');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error creating video post');
    res.render('video_new', { errors: [{ msg: 'Error creating video post' }], formData: req.body });
  }
});

// GET /videos/:id - Display single video post
router.get('/:id', async (req, res) => {
  try {
    const videoPost = await VideoPost.findById(req.params.id).populate('author', 'username').lean();
    const comments = await Comment.find({ videoPost: req.params.id }).populate('author', 'username').sort({ createdAt: 1 }).lean();
    if (!videoPost) {
      req.flash('error_msg', 'Video post not found');
      return res.redirect('/videos');
    }
    res.render('video', { videoPost: videoPost, comments: comments });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error fetching video post');
    res.redirect('/videos');
  }
});

// GET /videos/:id/edit - Render edit video post form
router.get('/:id/edit', restrictToAuthenticated, async (req, res) => {
  try {
    const videoPost = await VideoPost.findById(req.params.id).populate('author', 'username').lean();
    if (!videoPost) {
      req.flash('error_msg', 'Video post not found');
      return res.redirect('/videos');
    }
    if (videoPost.author._id.toString() !== req.session.userId) {
      req.flash('error_msg', 'You are not authorized to edit this video post');
      return res.redirect('/videos');
    }
    res.render('video_edit', { videoPost: videoPost, errors: [], formData: videoPost });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error fetching video post for editing');
    res.redirect('/videos');
  }
});

// POST /videos/:id/edit - Update video post
router.post('/:id/edit', restrictToAuthenticated, validateVideo, async (req, res) => {
  const { title, description } = req.body;
  let videoPath = null;

  try {
    let videoPost = await VideoPost.findById(req.params.id);
    if (!videoPost) {
      req.flash('error_msg', 'Video post not found');
      return res.redirect('/videos');
    }
    if (videoPost.author.toString() !== req.session.userId) {
      req.flash('error_msg', 'You are not authorized to edit this video post');
      return res.redirect('/videos');
    }

    // Handle video file upload
    if (req.files && req.files.video) {
      // Delete old video file if it exists
      if (videoPost.videoPath) {
        deleteFile(videoPost.videoPath);
      }
      const video = req.files.video;
      const videoName = `${uuidv4()}${path.extname(video.name)}`;
      videoPath = `/videos/${videoName}`;
      const uploadPath = path.join(__dirname, '../public/videos');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      video.mv(path.join(uploadPath, videoName), err => {
        if (err) {
          console.error(err);
          req.flash('error_msg', 'Error uploading video');
          return res.redirect(`/videos/${req.params.id}/edit`);
        }
        videoPost.videoPath = videoPath;
      });
    } else {
      // If no new video is uploaded, retain the existing video path
      videoPath = videoPost.videoPath;
    }

    videoPost.title = title;
    videoPost.description = description;
    if (videoPath) {
      videoPost.videoPath = videoPath;
    }

    await videoPost.save();
    req.flash('success_msg', 'Video post updated successfully');
    res.redirect(`/videos/${req.params.id}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating video post');
    res.render('video_edit', { videoPost: req.body, errors: [{ msg: 'Error updating video post' }], formData: req.body });
  }
});

// POST /videos/:id/delete - Delete video post
router.post('/:id/delete', restrictToAuthenticated, async (req, res) => {
  try {
    let videoPost = await VideoPost.findById(req.params.id);
    if (!videoPost) {
      req.flash('error_msg', 'Video post not found');
      return res.redirect('/videos');
    }
    if (videoPost.author.toString() !== req.session.userId) {
      req.flash('error_msg', 'You are not authorized to delete this video post');
      return res.redirect('/videos');
    }

    // Delete video file from server
    if (videoPost.videoPath) {
      deleteFile(videoPost.videoPath);
    }

    await videoPost.deleteOne();
    req.flash('success_msg', 'Video post deleted successfully');
    res.redirect('/videos');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting video post');
    res.redirect('/videos');
  }
});

// POST /videos/:id/like - Like a video post
router.post('/:id/like', restrictToAuthenticated, async (req, res) => {
  try {
    let videoPost = await VideoPost.findById(req.params.id);
    if (!videoPost) {
      req.flash('error_msg', 'Video post not found');
      return res.redirect('/videos');
    }

    const userId = new mongoose.Types.ObjectId(req.session.userId);

    if (videoPost.likes.includes(userId)) {
      videoPost.likes = videoPost.likes.filter(id => !id.equals(userId));
    } else {
      videoPost.likes.push(userId);
      videoPost.dislikes = videoPost.dislikes.filter(id => !id.equals(userId));
    }

    await videoPost.save();
    res.json({ success: true, likes: videoPost.likes.length, dislikes: videoPost.dislikes.length }); // Send JSON response
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error liking video post' }); // Send JSON error
  }
});

// POST /videos/:id/dislike - Dislike a video post
router.post('/:id/dislike', restrictToAuthenticated, async (req, res) => {
  try {
    let videoPost = await VideoPost.findById(req.params.id);
    if (!videoPost) {
      req.flash('error_msg', 'Video post not found');
      return res.status(404).json({ message: 'Video post not found' }); // Send JSON response
    }

    const userId = new mongoose.Types.ObjectId(req.session.userId);

    if (videoPost.dislikes.includes(userId)) {
      videoPost.dislikes = videoPost.dislikes.filter(id => !id.equals(userId));
    } else {
      videoPost.dislikes.push(userId);
      videoPost.likes = videoPost.likes.filter(id => !id.equals(userId));
    }

    await videoPost.save();
    res.json({ success: true, likes: videoPost.likes.length, dislikes: videoPost.dislikes.length }); // Send JSON response
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error disliking video post' }); // Send JSON error
  }
});

module.exports = router;
