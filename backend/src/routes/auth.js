const express = require('express');
const authService = require('../services/auth.service');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, companyName, fullName } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const result = await authService.register({
      email,
      password,
      companyName,
      fullName
    });
    
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// Logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // Delete session
    await require('../config/database').query(
      'DELETE FROM sessions WHERE token = $1',
      [token]
    );
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;