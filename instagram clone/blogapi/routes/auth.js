const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

// GET /auth/signup - Render signup form
router.get('/signup', (req, res) => {
  res.render('auth_signup', { errors: [], formData: {} });
});

// POST /auth/signup - Register new user
router.post('/signup',
  [
    body('username', 'Username is required').trim().notEmpty(),
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    body('password2', 'Passwords do not match').custom((value, { req }) => value === req.body.password)
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('auth_signup', { errors: errors.array(), formData: req.body });
    }

    const { username, email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (user) {
        return res.render('auth_signup', { errors: [{ msg: 'User already exists' }], formData: req.body });
      }

      user = new User({
        username,
        email,
        password
      });

      await user.save();
      req.session.userId = user.id;
      req.session.role = user.role;
      console.log('Signup successful. Session userId:', req.session.userId, 'role:', req.session.role);
      res.redirect('/');
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// GET /auth/login - Render login form
router.get('/login', (req, res) => {
  res.render('auth_login', { errors: [], formData: {} });
});

// POST /auth/login - Authenticate user
router.post('/login',
  [
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password is required').notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('auth_login', { errors: errors.array(), formData: req.body });
    }

    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res.render('auth_login', { errors: [{ msg: 'Invalid Credentials' }], formData: req.body });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.render('auth_login', { errors: [{ msg: 'Invalid Credentials' }], formData: req.body });
      }

      req.session.userId = user.id;
      req.session.role = user.role; // Store user role in session
      console.log('Login successful. Session userId:', req.session.userId, 'role:', req.session.role);
      res.redirect('/');
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// GET /auth/logout - Logout user
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/');
    }
    res.clearCookie('connect.sid');
    res.redirect('/auth/login');
  });
});

module.exports = router;
