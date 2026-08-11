var express = require('express');
var router = express.Router();
var User = require('../models/User');
var Post = require('../models/Post');
const { restrictToAuthenticated, restrictToAdmin } = require('../middleware/auth');
var Comment = require('../models/Comment');
const path = require('path'); // Added path import
const fs = require('fs');   // Added fs import
const mongoose = require('mongoose'); // Added mongoose import
const VideoPost = require('../models/VideoPost'); // Added VideoPost import

/* GET users listing. */
router.get('/', restrictToAdmin, async (req, res, next) => {
  try {
    const searchQuery = req.query.search || '';
    let query = {};

    if (searchQuery) {
      query.$or = [
        { username: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    const users = await User.find(query);
    res.render('admin_users', { users: users, searchQuery: searchQuery });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error fetching users');
    res.redirect('/');
  }
});

// POST /users/:id/role - Update user role (admin only)
router.post('/:id/role', restrictToAdmin, async (req, res) => {
  const { role } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/users');
    }
    if (!['user', 'admin'].includes(role)) {
      req.flash('error_msg', 'Invalid role specified');
      return res.redirect('/users');
    }
    user.role = role;
    await user.save();
    req.flash('success_msg', `User ${user.username} role updated to ${role}`);
    res.redirect('/users');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating user role');
    res.redirect('/users');
  }
});

// GET /users/posts-management - Display all posts for admin
router.get('/posts-management', restrictToAdmin, async (req, res) => {
  try {
    const searchQuery = req.query.search || '';
    let query = {};

    if (searchQuery) {
      query.$or = [
        { title: { $regex: searchQuery, $options: 'i' } },
        { caption: { $regex: searchQuery, $options: 'i' } } // Assuming 'caption' for image posts, 'description' for video posts
      ];
    }
    const posts = await Post.find(query).populate('author', 'username').sort({ createdAt: -1 });
    res.render('admin_posts', { posts: posts, searchQuery: searchQuery });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error fetching posts for management');
    res.redirect('/users');
  }
});

// POST /users/posts-management/:id/delete - Admin delete any post
router.post('/posts-management/:id/delete', restrictToAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      req.flash('error_msg', 'Post not found');
      return res.redirect('/users/posts-management');
    }
    await post.deleteOne();
    req.flash('success_msg', 'Post deleted successfully');
    res.redirect('/users/posts-management');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting post');
    res.redirect('/users/posts-management');
  }
});

// GET /users/comments-management - Display all comments for admin
router.get('/comments-management', restrictToAdmin, async (req, res) => {
  try {
    const comments = await Comment.find()
      .populate('author', 'username')
      .populate({ path: 'imagePost', model: 'Post', select: 'title' })
      .populate({ path: 'videoPost', model: 'VideoPost', select: 'title' })
      .sort({ createdAt: -1 });
    res.render('admin_comments', { comments: comments });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error fetching comments for management');
    res.redirect('/users');
  }
});

// POST /users/comments-management/:id/delete - Admin delete any comment
router.post('/comments-management/:id/delete', restrictToAdmin, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      req.flash('error_msg', 'Comment not found');
      return res.redirect('/users/comments-management');
    }
    await comment.deleteOne();
    req.flash('success_msg', 'Comment deleted successfully');
    res.redirect('/users/comments-management');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting comment');
    res.redirect('/users/comments-management');
  }
});

// GET /users/myposts - Display logged-in user's posts
router.get('/myposts', restrictToAuthenticated, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.session.userId }).populate('author', 'username').sort({ createdAt: -1 });
    res.render('user_posts', { posts: posts, user: req.session.userId });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error fetching your posts');
    res.redirect('/');
  }
});

// GET /users/:userId/posts - Display posts by a specific user (admin only)
router.get('/:userId/posts', restrictToAdmin, async (req, res) => {
  try {
    const userToManage = await User.findById(req.params.userId);
    if (!userToManage) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/users');
    }
    const posts = await Post.find({ author: req.params.userId }).populate('author', 'username').sort({ createdAt: -1 });
    res.render('admin_user_posts', { posts: posts, username: userToManage.username, userId: req.params.userId });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error fetching user posts');
    res.redirect('/users');
  }
});

// POST /users/:userId/posts/:postId/delete - Admin delete a specific user's post
router.post('/:userId/posts/:postId/delete', restrictToAdmin, async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({ _id: req.params.postId, author: req.params.userId });
    if (!post) {
      req.flash('error_msg', 'Post not found or not by this user');
      return res.redirect(`/users/${req.params.userId}/posts`);
    }
    req.flash('success_msg', 'Post deleted successfully');
    res.redirect(`/users/${req.params.userId}/posts`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting post');
    res.redirect(`/users/${req.params.userId}/posts`);
  }
});

// GET /users/:userId/comments - Display comments by a specific user (admin only)
router.get('/:userId/comments', restrictToAdmin, async (req, res) => {
  try {
    const userToManage = await User.findById(req.params.userId);
    if (!userToManage) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/users');
    }
    const comments = await Comment.find({ author: req.params.userId })
      .populate('author', 'username')
      .populate({ path: 'imagePost', model: 'Post', select: 'title' })
      .populate({ path: 'videoPost', model: 'VideoPost', select: 'title' })
      .sort({ createdAt: -1 });
    res.render('admin_user_comments', { comments: comments, username: userToManage.username, userId: req.params.userId });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error fetching user comments');
    res.redirect('/users');
  }
});

// POST /users/:userId/comments/:commentId/delete - Admin delete a specific user's comment
router.post('/:userId/comments/:commentId/delete', restrictToAdmin, async (req, res) => {
  try {
    const comment = await Comment.findOneAndDelete({ _id: req.params.commentId, author: req.params.userId });
    if (!comment) {
      req.flash('error_msg', 'Comment not found or not by this user');
      return res.redirect(`/users/${req.params.userId}/comments`);
    }
    req.flash('success_msg', 'Comment deleted successfully');
    res.redirect(`/users/${req.params.userId}/comments`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting comment');
    res.redirect(`/users/${req.params.userId}/comments`);
  }
});

// GET /users/profile - Display logged-in user's profile
router.get('/profile', restrictToAuthenticated, async (req, res) => {
  try {
    console.log('Accessing /users/profile for userId:', req.session.userId);
    const profileUser = await User.findById(req.session.userId);
    if (!profileUser) {
      req.flash('error_msg', 'User profile not found');
      return res.redirect('/auth/login');
    }
    console.log('Profile user found:', profileUser.username);

    const imagePosts = await Post.find({ author: req.session.userId }).populate('author', 'username').sort({ createdAt: -1 }).lean();
    console.log('Fetched image posts count:', imagePosts.length);
    for (let i = 0; i < imagePosts.length; i++) {
      imagePosts[i].commentCount = await Comment.countDocuments({ imagePost: imagePosts[i]._id });
      console.log(`Image post ${imagePosts[i]._id} comment count:`, imagePosts[i].commentCount);
    }

    const videoPosts = await VideoPost.find({ author: req.session.userId }).populate('author', 'username').sort({ createdAt: -1 }).lean();
    console.log('Fetched video posts count:', videoPosts.length);

    res.render('user_profile', {
      profileUser: profileUser,
      posts: imagePosts,
      videoPosts: videoPosts,
      user: req.session.userId ? new mongoose.Types.ObjectId(req.session.userId) : null
    });
  } catch (err) {
    console.error('Error fetching your profile:', err);
    req.flash('error_msg', 'Error fetching your profile');
    res.redirect('/');
  }
});

// GET /users/profile/edit - Render edit profile form
router.get('/profile/edit', restrictToAuthenticated, async (req, res) => {
  try {
    const profileUser = await User.findById(req.session.userId);
    if (!profileUser) {
      req.flash('error_msg', 'User profile not found');
      return res.redirect('/auth/login');
    }
    res.render('user_profile_edit', { profileUser: profileUser, errors: [], formData: profileUser });
  } catch (err) {
    console.error('Error fetching profile for editing:', err);
    req.flash('error_msg', 'Error fetching profile for editing');
    res.redirect('/users/profile');
  }
});

// POST /users/profile/edit - Update user profile
router.post('/profile/edit', restrictToAuthenticated, async (req, res) => {
  const { bio } = req.body;
  let profilePicturePath = null;

  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/auth/login');
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
          req.flash('error_msg', 'Error uploading profile picture');
          return res.redirect('/users/profile/edit');
        }
      });
    } else if (user.profilePicture) {
      // If no new picture is uploaded, retain the old one
      profilePicturePath = user.profilePicture;
    }

    user.bio = bio;
    if (profilePicturePath) {
      user.profilePicture = profilePicturePath;
    }
    await user.save();
    req.flash('success_msg', 'Profile updated successfully');
    res.redirect('/users/profile');
  } catch (err) {
    console.error('Error updating profile:', err);
    req.flash('error_msg', 'Error updating profile');
    res.render('user_profile_edit', { profileUser: req.body, errors: [{ msg: 'Error updating profile' }], formData: req.body });
  }
});

// GET /users/:userId/profile - Display any user's profile
router.get('/:userId/profile', async (req, res) => {
  try {
    console.log('Accessing /users/:userId/profile for userId:', req.params.userId);
    const profileUser = await User.findById(req.params.userId);
    if (!profileUser) {
      req.flash('error_msg', 'User profile not found');
      return res.redirect('/');
    }
    console.log('Profile user found:', profileUser.username);

    const imagePosts = await Post.find({ author: req.params.userId }).populate('author', 'username').sort({ createdAt: -1 }).lean();
    console.log('Fetched image posts count:', imagePosts.length);
    for (let i = 0; i < imagePosts.length; i++) {
      imagePosts[i].commentCount = await Comment.countDocuments({ imagePost: imagePosts[i]._id });
      console.log(`Image post ${imagePosts[i]._id} comment count:`, imagePosts[i].commentCount);
    }

    const videoPosts = await VideoPost.find({ author: req.params.userId }).populate('author', 'username').sort({ createdAt: -1 }).lean();
    console.log('Fetched video posts count:', videoPosts.length);

    res.render('user_profile', {
      profileUser: profileUser,
      posts: imagePosts,
      videoPosts: videoPosts,
      user: req.session.userId ? new mongoose.Types.ObjectId(req.session.userId) : null
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    req.flash('error_msg', 'Error fetching user profile');
    res.redirect('/');
  }
});

module.exports = router;

// POST /users/:id/follow - Follow a user
router.post('/:id/follow', restrictToAuthenticated, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.session.userId);

    if (!userToFollow || !currentUser) {
      req.flash('error_msg', 'User not found.');
      return res.redirect('back');
    }

    // Prevent following self
    if (userToFollow._id.equals(currentUser._id)) {
      req.flash('error_msg', 'You cannot follow yourself.');
      return res.redirect('back');
    }

    // Add to followers of the user being followed
    if (!userToFollow.followers.includes(currentUser._id)) {
      userToFollow.followers.push(currentUser._id);
      await userToFollow.save();
    }

    // Add to following of the current user
    if (!currentUser.following.includes(userToFollow._id)) {
      currentUser.following.push(userToFollow._id);
      await currentUser.save();
    }

    req.flash('success_msg', `You are now following ${userToFollow.username}`);
    res.redirect('back');
  } catch (err) {
    console.error('Error following user:', err);
    req.flash('error_msg', 'Error following user');
    res.redirect('back');
  }
});

// POST /users/:id/unfollow - Unfollow a user
router.post('/:id/unfollow', restrictToAuthenticated, async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.session.userId);

    if (!userToUnfollow || !currentUser) {
      req.flash('error_msg', 'User not found.');
      return res.redirect('back');
    }

    // Remove from followers of the user being unfollowed
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (followerId) => !followerId.equals(currentUser._id)
    );
    await userToUnfollow.save();

    // Remove from following of the current user
    currentUser.following = currentUser.following.filter(
      (followingId) => !followingId.equals(userToUnfollow._id)
    );
    await currentUser.save();

    req.flash('success_msg', `You have unfollowed ${userToUnfollow.username}`);
    res.redirect('back');
  } catch (err) {
    console.error('Error unfollowing user:', err);
    req.flash('error_msg', 'Error unfollowing user');
    res.redirect('back');
  }
});
