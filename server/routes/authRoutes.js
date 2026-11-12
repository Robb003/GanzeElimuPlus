const express = require('express');
const router = express.Router();

const {
  registerUser,
  loginUser,
  getUserProfile
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

const {
  loginLimiter,
  registrationLimiter
} = require('../middleware/rateLimitMiddleware');

// PUBLIC REGISTRATION
router.post('/register', registrationLimiter, registerUser);

// PUBLIC LOGIN
router.post('/login', loginLimiter, loginUser);

// PROTECTED USER PROFILE
router.get('/profile', protect, getUserProfile);

module.exports = router;
