var express = require('express');
var router = express.Router();
var Post = require('../models/Post');
var User = require('../models/User');
var Comment = require('../models/Comment');

/* GET home page with endless scrolling. */
router.get('/', async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10; // Default to 10 posts per load
  const skip = (page - 1) * limit;
  const searchQuery = req.query.search || '';

  try {
    let query = {};

    if (searchQuery) {
      query.$or = [
        { title: { $regex: searchQuery, $options: 'i' } },
        { caption: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    const totalPosts = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Fetch comment counts for each post
    for (let i = 0; i < posts.length; i++) {
      posts[i].commentCount = await Comment.countDocuments({ imagePost: posts[i]._id }); // Changed from 'post'
    }

    // Check if it's an AJAX request
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      res.json({ posts, totalPages: Math.ceil(totalPosts / limit) });
    } else {
      res.render('home', { posts: posts, currentPage: page, totalPages: Math.ceil(totalPosts / limit), searchQuery: searchQuery });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

/* Simple login/signup pages */
router.get('/login', function(req, res) { res.render('auth_login'); });
router.get('/signup', function(req, res) { res.render('auth_signup'); });

/* New post page */
router.get('/posts/new', function(req, res) { res.render('post_new'); });

/* SSR view of single post */
router.get('/posts/:postId', function(req, res, next) {
  Promise.all([
    Post.findById(req.params.postId).populate('author', 'username').lean(),
    Comment.find({ imagePost: req.params.postId }).populate('author', 'username').sort({ createdAt: 1 }).lean() // Changed from 'post'
  ]).then(function ([post, comments]) {
    if (!post) return res.status(404).send('Not found');
    res.render('post', { post: post, comments: comments });
  }).catch(function (err) {
    console.error('Post page error:', err && err.message);
    res.status(400).send('Bad id');
  });
});

module.exports = router;
