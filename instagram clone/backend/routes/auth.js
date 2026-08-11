const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

// GET /auth/login and /auth/signup - render server-side login/signup pages
router.get('/login', (req, res) => { res.render('auth_login'); });
router.get('/signup', (req, res) => { res.render('auth_signup'); });

// @route   POST /auth/signup
// @desc    Register new user & return token
// @access  Public
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

      await user.save(); // This will hash the password via pre-save hook

      const token = user.getSignedJwtToken();
      res.status(201).json({ success: true, token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST /auth/login
// @desc    Authenticate user & return token
// @access  Public
router.post('/login',
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

      const token = user.getSignedJwtToken();
      res.status(200).json({ success: true, token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET /auth/logout
// @desc    Log user out / clear cookie
// @access  Private (client-side token removal is primary)
router.get('/logout', (req, res) => {
  // For JWT, logout is primarily handled client-side by deleting the token.
  // If a cookie was used to store the token (e.g., httpOnly cookie), you might clear it here.
  // For now, just send a success message.
  res.status(200).json({ success: true, msg: 'Logged out successfully' });
});

module.exports = router;
