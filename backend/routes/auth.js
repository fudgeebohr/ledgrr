const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

function signToken(user) {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are all required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const user = new User({ name: name.trim(), email: email.toLowerCase().trim() });
    await user.setPassword(password);
    await user.save();

    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/auth/me -> whoami, used to validate a stored token on app load
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
