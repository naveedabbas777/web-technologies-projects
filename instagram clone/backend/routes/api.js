const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt =require('jsonwebtoken')
const { body, validationResult } = require('express-validator');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const mongoose = require('mongoose');

// POST /api/auth/signup - Register new user and return JWT
router.post('/auth/signup',
  [
    body('username', 'Username is required').trim().notEmpty(),
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      user = new User({
        username,
        email,
        password
      });

      await user.save();

      const payload = {
          user: {
              id: user.id,
              role: user.role
          }
      }

      jwt.sign(payload, 'your_secret_key', {expiresIn: 36000}, (err, token) => {
          if(err) throw err;
          res.json({token})
      })

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// POST /api/auth/login - Authenticate user and return JWT
router.post('/auth/login',
  [
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password is required').notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      const payload = {
        user: {
            id: user.id,
            role: user.role
        }
    }

    jwt.sign(payload, 'your_secret_key', {expiresIn: 36000}, (err, token) => {
        if(err) throw err;
        res.json({token})
    })

    } catch (err) {
      const appLogger = require('../utils/logger');
      appLogger.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

const Post = require('../models/Post');
const { authMiddleware, adminMiddleware } = require('../middleware/authJwt');
const { validateImage } = require('../middleware/imageUpload');
const { validateVideo } = require('../middleware/videoUpload');

// GET /api/posts - Get all posts (public access)
router.get('/posts', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10; // Default limit of 10 posts
        const searchQuery = req.query.search;

        const skip = (page - 1) * limit;

        let query = { image: { $exists: true, $ne: null } };
        if (searchQuery) {
            query.$or = [
                { title: { $regex: searchQuery, $options: 'i' } },
                { caption: { $regex: searchQuery, $options: 'i' } },
                // Potentially search by author username, requires populate and then match
            ];
        }

        const posts = await Post.find(query)
            .populate('author', 'username profilePicture') // Also populate profilePicture
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCount = await Post.countDocuments({ image: { $exists: true, $ne: null }, ...query });
        const totalPages = Math.ceil(totalCount / limit);

        console.log(`Posts feed: page ${page}, limit ${limit}, found ${posts.length} posts, total ${totalCount}`);

        // Clean up corrupted post entries (run once to fix existing data)
        if (page === 1) {
            const corruptedCount = await Post.countDocuments({ image: null });
            if (corruptedCount > 0) {
                console.log(`Found ${corruptedCount} corrupted post entries, cleaning up...`);
                await Post.deleteMany({ image: null });
                console.log('Corrupted post entries cleaned up');
            }
        }

        res.json({
            posts,
            currentPage: page,
            totalPages,
            totalCount,
        });
    } catch (err) {
        const appLogger = require('../utils/logger');
        appLogger.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/posts - Create new post
router.post('/posts', [authMiddleware, validateImage], async (req, res) => {
  const { title, caption } = req.body;

  if (!req.files || !req.files.image) {
    return res.status(400).json({ msg: 'Image file is required' });
  }

  const image = req.files.image;
  const imageName = `${uuidv4()}${path.extname(image.name)}`;
  const imagePath = `/images/${imageName}`;

  try {
    // Move the image file
    await new Promise((resolve, reject) => {
      image.mv(path.join(__dirname, '../public/images', imageName), err => {
        if (err) {
          console.error('Error uploading image file:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    const newPost = new Post({
      title,
      caption,
      author: req.user.id,
      image: imagePath
    });
    const post = await newPost.save();
    console.log('Post created:', post._id, 'by user:', req.user.id, 'imagePath:', imagePath);
    res.json(post);
  } catch (err) {
    console.error('Error creating post:', err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/posts/:id - Get a single post (public access)
router.get('/posts/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('author', 'username');
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.json(post);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
});

// PUT /api/posts/:id - Update a post
router.put('/posts/:id', [authMiddleware, validateImage], async (req, res) => {
  const { title, caption } = req.body;
  let imagePath = null;

  try {
    let post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    if (post.author.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    if (req.files && req.files.image) {
      const image = req.files.image;
      const imageName = `${uuidv4()}${path.extname(image.name)}`;
      imagePath = `/images/${imageName}`;
      image.mv(path.join(__dirname, '../public/images', imageName), err => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error uploading image');
        }
      });
      // Delete old image
      if (post.image) {
        fs.unlink(path.join(__dirname, '../public', post.image), err => {
          if (err) console.error(err);
        });
      }
    }

    post.title = title;
    post.caption = caption;
    if (imagePath) {
      post.image = imagePath;
    }

    await post.save();
    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE /api/posts/:id - Delete a post
router.delete('/posts/:id', authMiddleware, async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    if (post.author.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Delete image
    if (post.image) {
      fs.unlink(path.join(__dirname, '../public', post.image), err => {
        if (err) console.error(err);
      });
    }

    await post.deleteOne();
    res.json({ msg: 'Post removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/posts/:id/like - Like a post
router.post('/posts/:id/like', authMiddleware, async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);

    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter(id => !id.equals(userId));
    } else {
      post.likes.push(userId);
      post.dislikes = post.dislikes.filter(id => !id.equals(userId));
    }

    await post.save();
        res.json({ likes: post.likes, dislikes: post.dislikes });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/posts/:id/dislike - Dislike a post
router.post('/posts/:id/dislike', authMiddleware, async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);

    if (post.dislikes.includes(userId)) {
      post.dislikes = post.dislikes.filter(id => !id.equals(userId));
    } else {
      post.dislikes.push(userId);
      post.likes = post.likes.filter(id => !id.equals(userId));
    }

    await post.save();
        res.json({ likes: post.likes, dislikes: post.dislikes });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


const Comment = require('../models/Comment');
const VideoPost = require('../models/VideoPost');

// POST /api/posts/:id/comments - Create a comment on a post
router.post('/posts/:id/comments', authMiddleware, [
    body('content', 'Content is required').not().isEmpty(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        const newComment = new Comment({
            content: req.body.content,
            author: req.user.id,
            imagePost: req.params.id
        });

        const comment = await newComment.save();
        // Populate author information for the response
        const populatedComment = await Comment.findById(comment._id).populate('author', '_id username profilePicture');
        res.json(populatedComment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/posts/:id/comments - Get all comments for a post
router.get('/posts/:id/comments', authMiddleware, async (req, res) => {
    try {
        const comments = await Comment.find({ imagePost: req.params.id }).populate('author', '_id username profilePicture').sort({ createdAt: 1 });
        res.json(comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/videos/:id/comments - Create a comment on a video
router.post('/videos/:id/comments', authMiddleware, [
    body('content', 'Content is required').not().isEmpty(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const video = await VideoPost.findById(req.params.id);
        if (!video) {
            return res.status(404).json({ msg: 'Video not found' });
        }

        const newComment = new Comment({
            content: req.body.content,
            author: req.user.id,
            videoPost: req.params.id
        });

        const comment = await newComment.save();
        // Populate author information for the response
        const populatedComment = await Comment.findById(comment._id).populate('author', '_id username profilePicture');
        res.json(populatedComment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/videos/:id/comments - Get all comments for a video
router.get('/videos/:id/comments', authMiddleware, async (req, res) => {
    try {
        const comments = await Comment.find({ videoPost: req.params.id }).populate('author', '_id username profilePicture').sort({ createdAt: 1 });
        res.json(comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE /api/comments/:id - Delete a comment
router.delete('/comments/:id', authMiddleware, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }
        if (comment.author.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }
        await comment.deleteOne();
        res.json({ msg: 'Comment removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/users/:id - Get a user's profile
router.get('/users/:id', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('followers', '_id username profilePicture')
            .populate('following', '_id username profilePicture');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(500).send('Server Error');
    }
});

// PUT /api/users/profile - Update user profile
router.put('/users/profile', authMiddleware, async (req, res) => {
  const { bio } = req.body;
  let profilePicturePath = null;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (req.files && req.files.profilePicture) {
      const profilePicture = req.files.profilePicture;
      const imageName = `${user._id}-${Date.now()}${path.extname(profilePicture.name)}`;
      profilePicturePath = `/images/profile_pictures/${imageName}`;

      const uploadPath = path.join(__dirname, '../public/images/profile_pictures');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      profilePicture.mv(path.join(uploadPath, imageName), err => {
        if (err) {
          console.error('Error uploading profile picture:', err);
          return res.status(500).send('Error uploading profile picture');
        }
      });
    }

    user.bio = bio;
    if (profilePicturePath) {
      user.profilePicture = profilePicturePath;
    }
    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


// GET /api/users/:id/posts - Get all posts for a user
router.get('/users/:id/posts', authMiddleware, async (req, res) => {
    try {
        const posts = await Post.find({ author: req.params.id }).populate('author', 'username').sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/users/:id/videos - Get all videos for a user
router.get('/users/:id/videos', authMiddleware, async (req, res) => {
    try {
        const videos = await VideoPost.find({ author: req.params.id }).populate('author', 'username').sort({ createdAt: -1 });
        res.json(videos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/users/:id/follow - Follow a user
router.post('/users/:id/follow', authMiddleware, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (userToFollow._id.equals(currentUser._id)) {
      return res.status(400).json({ msg: 'You cannot follow yourself' });
    }

    if (!userToFollow.followers.includes(currentUser._id)) {
      userToFollow.followers.push(currentUser._id);
      await userToFollow.save();
    }

    if (!currentUser.following.includes(userToFollow._id)) {
      currentUser.following.push(userToFollow._id);
      await currentUser.save();
    }

    res.json({ msg: `You are now following ${userToFollow.username}` });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/users/:id/unfollow - Unfollow a user
router.post('/users/:id/unfollow', authMiddleware, async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    userToUnfollow.followers = userToUnfollow.followers.filter(
      (followerId) => !followerId.equals(currentUser._id)
    );
    await userToUnfollow.save();

    currentUser.following = currentUser.following.filter(
      (followingId) => !followingId.equals(userToUnfollow._id)
    );
    await currentUser.save();

    res.json({ msg: `You have unfollowed ${userToUnfollow.username}` });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/users/:id/followers - Get a user's followers
router.get('/users/:id/followers', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('followers', '_id username profilePicture');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user.followers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/users/:id/following - Get a user's following list
router.get('/users/:id/following', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('following', '_id username profilePicture');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user.following);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// GET /api/videos - Get all video posts (public access)
router.get('/videos', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10; // Default limit of 10 videos
        const searchQuery = req.query.search;

        const skip = (page - 1) * limit;

        let query = { videoPath: { $exists: true, $ne: null } };
        if (searchQuery) {
            query.$or = [
                { title: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
                // Potentially search by author username, requires populate and then match
            ];
        }

        const videoPosts = await VideoPost.find(query)
            .populate('author', 'username profilePicture') // Also populate profilePicture
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCount = await VideoPost.countDocuments({ videoPath: { $exists: true, $ne: null }, ...query });
        const totalPages = Math.ceil(totalCount / limit);

        console.log(`Video feed: page ${page}, limit ${limit}, found ${videoPosts.length} videos, total ${totalCount}`);

        // Clean up corrupted video entries (run once to fix existing data)
        if (page === 1) {
            const corruptedCount = await VideoPost.countDocuments({ videoPath: null });
            if (corruptedCount > 0) {
                console.log(`Found ${corruptedCount} corrupted video entries, cleaning up...`);
                await VideoPost.deleteMany({ videoPath: null });
                console.log('Corrupted video entries cleaned up');
            }
        }

        res.json({
            videoPosts,
            currentPage: page,
            totalPages,
            totalCount,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/videos/:id - Get a single video post (public access)
router.get('/videos/:id', async (req, res) => {
    try {
        const video = await VideoPost.findById(req.params.id).populate('author', 'username');
        if (!video) {
            return res.status(404).json({ msg: 'Video not found' });
        }
        res.json(video);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Video not found' });
        }
        res.status(500).send('Server Error');
    }
});

// POST /api/videos - Create new video post
router.post('/videos', [authMiddleware, validateVideo], async (req, res) => {
  const { title, description } = req.body;
  let videoPath = null;

  if (!req.files || !req.files.video) {
    return res.status(400).json({ msg: 'Video file is required' });
  }

  const video = req.files.video;
  const videoName = `${uuidv4()}${path.extname(video.name)}`;
  videoPath = `/videos/${videoName}`;

  try {
    // Move the video file
    await new Promise((resolve, reject) => {
      video.mv(path.join(__dirname, '../public/videos', videoName), err => {
        if (err) {
          console.error('Error uploading video file:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    const newVideoPost = new VideoPost({
      title,
      description,
      author: req.user.id,
      videoPath: videoPath
    });
    const videoPost = await newVideoPost.save();
    console.log('Video post created:', videoPost._id, 'by user:', req.user.id, 'videoPath:', videoPath);
    res.json(videoPost);

  } catch (err) {
    console.error('❌ Error creating video post:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack
    });

    // Clean up uploaded file if it exists
    if (videoPath && require('fs').existsSync(fullVideoPath)) {
      try {
        require('fs').unlinkSync(fullVideoPath);
        console.log('🧹 Cleaned up uploaded file due to error');
      } catch (cleanupErr) {
        console.error('❌ Failed to cleanup uploaded file:', cleanupErr);
      }
    }

    res.status(500).json({
      msg: 'Failed to upload video. Please try again.',
      error: err.message
    });
  }
});

// PUT /api/videos/:id - Update a video post
router.put('/videos/:id', [authMiddleware, validateVideo], async (req, res) => {
  const { title, description } = req.body;
  let videoPath = null;

  try {
    let videoPost = await VideoPost.findById(req.params.id);
    if (!videoPost) {
      return res.status(404).json({ msg: 'Video post not found' });
    }
    if (videoPost.author.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    if (req.files && req.files.video) {
      const video = req.files.video;
      const videoName = `${uuidv4()}${path.extname(video.name)}`;
      videoPath = `/videos/${videoName}`;
      video.mv(path.join(__dirname, '../public/videos', videoName), err => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error uploading video');
        }
      });
      if (videoPost.videoPath) {
        fs.unlink(path.join(__dirname, '../public', videoPost.videoPath), err => {
          if (err) console.error(err);
        });
      }
    }

    videoPost.title = title;
    videoPost.description = description;
    if (videoPath) {
      videoPost.videoPath = videoPath;
    }

    await videoPost.save();
    res.json(videoPost);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE /api/videos/:id - Delete a video post
router.delete('/videos/:id', authMiddleware, async (req, res) => {
  try {
    let videoPost = await VideoPost.findById(req.params.id);
    if (!videoPost) {
      return res.status(404).json({ msg: 'Video post not found' });
    }
    if (videoPost.author.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    if (videoPost.videoPath) {
      fs.unlink(path.join(__dirname, '../public', videoPost.videoPath), err => {
        if (err) console.error(err);
      });
    }

    await videoPost.deleteOne();
    res.json({ msg: 'Video post removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/videos/:id/like - Like a video post
router.post('/videos/:id/like', authMiddleware, async (req, res) => {
  try {
    let videoPost = await VideoPost.findById(req.params.id);
    if (!videoPost) {
      return res.status(404).json({ msg: 'Video post not found' });
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);

    if (videoPost.likes.includes(userId)) {
      videoPost.likes = videoPost.likes.filter(id => !id.equals(userId));
    } else {
      videoPost.likes.push(userId);
      videoPost.dislikes = videoPost.dislikes.filter(id => !id.equals(userId));
    }

    await videoPost.save();
        res.json({ likes: videoPost.likes, dislikes: videoPost.dislikes });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/videos/:id/dislike - Dislike a video post
router.post('/videos/:id/dislike', authMiddleware, async (req, res) => {
  try {
    let videoPost = await VideoPost.findById(req.params.id);
    if (!videoPost) {
      return res.status(404).json({ msg: 'Video post not found' });
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);

    if (videoPost.dislikes.includes(userId)) {
      videoPost.dislikes = videoPost.dislikes.filter(id => !id.equals(userId));
    } else {
      videoPost.dislikes.push(userId);
      videoPost.likes = videoPost.likes.filter(id => !id.equals(userId));
    }

    await videoPost.save();
        res.json({ likes: videoPost.likes, dislikes: videoPost.dislikes });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Admin routes
router.get('/admin/users', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const searchQuery = req.query.search;
        let query = {};

        if (searchQuery) {
            query = {
                $or: [
                    { username: { $regex: searchQuery, $options: 'i' } },
                    { email: { $regex: searchQuery, $options: 'i' } }
                ]
            };
        }

        const users = await User.find(query).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.put('/admin/users/:id/role', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        user.role = req.body.role;
        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.delete('/admin/users/:id', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ msg: 'Cannot delete your own account' });
        }

        // Delete user's profile picture if it exists
        if (user.profilePicture) {
            const fs = require('fs');
            const path = require('path');
            const profilePicPath = path.join(__dirname, '../public', user.profilePicture);
            if (fs.existsSync(profilePicPath)) {
                fs.unlinkSync(profilePicPath);
            }
        }

        // Delete all posts by this user
        await Post.deleteMany({ author: user._id });

        // Delete all videos by this user
        await VideoPost.deleteMany({ author: user._id });

        // Delete all comments by this user
        await Comment.deleteMany({ author: user._id });

        // Finally delete the user
        await user.deleteOne();

        res.json({ msg: 'User and all associated data deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/admin/posts', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const posts = await Post.find().populate('author', 'username').sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.delete('/admin/posts/:id', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }
        if (post.image) {
            fs.unlink(path.join(__dirname, '../public', post.image), err => {
                if (err) console.error(err);
            });
        }
        await post.deleteOne();
        res.json({ msg: 'Post removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/admin/comments', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const comments = await Comment.find().populate('author', 'username').sort({ createdAt: -1 });
        res.json(comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.delete('/admin/comments/:id', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }
        await comment.deleteOne();
        res.json({ msg: 'Comment removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;