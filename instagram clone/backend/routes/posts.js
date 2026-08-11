const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const { restrictToAuthenticated } = require('../middleware/auth');
const { validateImage } = require('../middleware/imageUpload');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Comment = require('../models/Comment');
const mongoose = require('mongoose');
const fs = require('fs'); // Added fs import for file deletion

// Utility function to delete a file
const deleteFile = (filePath) => {
  const fullPath = path.join(__dirname, '..', 'public', filePath);
  fs.unlink(fullPath, (err) => {
    if (err) console.error('Failed to delete file:', filePath, err);
  });
};

// GET /posts/:id - Display single post
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username');
    const comments = await Comment.find({ imagePost: req.params.id }).populate('author', 'username').sort({ createdAt: 1 }); // Use imagePost
    if (!post) {
      req.flash('error_msg', 'Post not found');
      return res.redirect('/');
    }
    res.render('post', { post: post, comments: comments });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error fetching post');
    res.redirect('/');
  }
});

// GET /posts/new - Render new post form
router.get('/new', restrictToAuthenticated, (req, res) => {
  res.render('post_new', { errors: [], formData: {} });
});

// POST /posts - Create new post
router.post('/new', restrictToAuthenticated, validateImage, async (req, res) => {
  const { title, caption } = req.body;
  let imagePath = null;

  if (req.files && req.files.image) {
    const image = req.files.image;
    const imageName = `${uuidv4()}${path.extname(image.name)}`;
    imagePath = `/images/${imageName}`;
    image.mv(path.join(__dirname, '../public/images', imageName), err => {
      if (err) {
        console.error(err);
        req.flash('error_msg', 'Error uploading image');
        return res.redirect('/posts/new');
      }
    });
  }

  try {
    const newPost = new Post({
      title,
      caption,
      author: req.session.userId,
      image: imagePath
    });
    await newPost.save();
    req.flash('success_msg', 'Post created successfully');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error creating post');
    res.render('post_new', { errors: [{ msg: 'Error creating post' }], formData: req.body });
  }
});

// GET /posts/:id/edit - Render edit post form
router.get('/:id/edit', restrictToAuthenticated, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username');
    if (!post) {
      req.flash('error_msg', 'Post not found');
      return res.redirect('/');
    }
    if (post.author._id.toString() !== req.session.userId) {
      req.flash('error_msg', 'You are not authorized to edit this post');
      return res.redirect('/');
    }
    res.render('post_edit', { post: post, errors: [], formData: post });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error fetching post for editing');
    res.redirect('/');
  }
});

// POST /posts/:id/edit - Update post
router.post('/:id/edit', restrictToAuthenticated, validateImage, async (req, res) => {
  const { title, caption } = req.body;
  let imagePath = null;

  try {
    let post = await Post.findById(req.params.id);
    if (!post) {
      req.flash('error_msg', 'Post not found');
      return res.redirect('/');
    }
    if (post.author.toString() !== req.session.userId) {
      req.flash('error_msg', 'You are not authorized to edit this post');
      return res.redirect('/');
    }

    // Only update imagePath if a new image is uploaded
    if (req.files && req.files.image) {
      const image = req.files.image;
      const imageName = `${uuidv4()}${path.extname(image.name)}`;
      imagePath = `/images/${imageName}`;
      image.mv(path.join(__dirname, '../public/images', imageName), async err => {
        if (err) {
          console.error(err);
          req.flash('error_msg', 'Error uploading image');
          return res.redirect(`/posts/${req.params.id}/edit`);
        }
        post.image = imagePath;
      });
    } else {
      imagePath = post.image;
    }

    post.title = title;
    post.caption = caption;
    if (imagePath) {
      post.image = imagePath;
    }

    await post.save();
    req.flash('success_msg', 'Post updated successfully');
    res.redirect(`/posts/${req.params.id}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating post');
    res.render('post_edit', { post: req.body, errors: [{ msg: 'Error updating post' }], formData: req.body });
  }
});

// POST /posts/:id/delete - Delete post
router.post('/:id/delete', restrictToAuthenticated, async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post) {
      req.flash('error_msg', 'Post not found');
      return res.redirect('/');
    }
    if (post.author.toString() !== req.session.userId) {
      req.flash('error_msg', 'You are not authorized to delete this post');
      return res.redirect('/');
    }

    await post.deleteOne();
    req.flash('success_msg', 'Post deleted successfully');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting post');
    res.redirect('/');
  }
});

// POST /posts/:id/like - Like a post
router.post('/:id/like', restrictToAuthenticated, async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post) {
      req.flash('error_msg', 'Post not found');
      return res.status(404).json({ message: 'Post not found' }); // Send JSON response
    }

    const userId = new mongoose.Types.ObjectId(req.session.userId);

    // Check if the user has already liked the post
    if (post.likes.includes(userId)) {
      // If already liked, unlike it
      post.likes = post.likes.filter(id => !id.equals(userId));
    } else {
      // If not liked, like it
      post.likes.push(userId);
      // If user disliked it previously, remove from dislikes
      post.dislikes = post.dislikes.filter(id => !id.equals(userId));
    }

    await post.save();
    res.json({ success: true, likes: post.likes.length, dislikes: post.dislikes.length }); // Send JSON response
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error liking post' }); // Send JSON error
  }
});

// POST /posts/:id/dislike - Dislike a post
router.post('/:id/dislike', restrictToAuthenticated, async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post) {
      req.flash('error_msg', 'Post not found');
      return res.status(404).json({ message: 'Post not found' }); // Send JSON response
    }

    const userId = new mongoose.Types.ObjectId(req.session.userId);

    // Check if the user has already disliked the post
    if (post.dislikes.includes(userId)) {
      // If already disliked, undislike it
      post.dislikes = post.dislikes.filter(id => !id.equals(userId));
    } else {
      // If not disliked, dislike it
      post.dislikes.push(userId);
      // If user liked it previously, remove from likes
      post.likes = post.likes.filter(id => !id.equals(userId));
    }

    await post.save();
    res.json({ success: true, likes: post.likes.length, dislikes: post.dislikes.length }); // Send JSON response
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error disliking post' }); // Send JSON error
  }
});

module.exports = router;