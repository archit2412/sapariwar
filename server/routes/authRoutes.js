const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/auth/me
// @desc    Get current logged-in user's details from MongoDB (after Firebase auth)
// @access  Private
router.get('/me', authMiddleware, authController.getMe);

// @route   POST /api/auth/sync-user
// @desc    Explicitly sync Firebase user with MongoDB (after Firebase auth)
// @access  Private
router.post('/sync-user', authMiddleware, authController.syncUser);


module.exports = router;