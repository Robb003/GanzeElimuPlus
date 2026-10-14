const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public Registration Gate
// Endpoint: POST /api/auth/register
router.post('/register', registerUser);

// Public Login Gate
// Endpoint: POST /api/auth/login
router.post('/login', loginUser);

// Secure Profile Entry (Requires a valid JWT token log)
// Endpoint: GET /api/auth/profile
router.get('/profile', protect, getUserProfile);

module.exports = router;
