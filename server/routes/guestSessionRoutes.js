const express = require('express');
const router = express.Router();
const guestSessionController = require('../controllers/guestSessionController');
const authMiddleware = require('../middleware/authMiddleware'); // To ensure req.user is populated for claim

/**
 * @route   POST /api/guest-sessions/start
 * @desc    Start a new guest session and get a guestSessionId
 * @access  Public
 */
router.post('/start', guestSessionController.startGuestSession);

/**
 * @route   POST /api/guest-sessions/claim
 * @desc    Authenticated user claims a tree created during a guest session
 * @access  Private (Requires authentication token)
 */
router.post('/claim', authMiddleware, guestSessionController.claimGuestTree);
// Note: authMiddleware is applied here.
// It ensures that req.user is populated if a valid token is sent.
// The claimGuestTree controller function then checks for req.user.

module.exports = router;