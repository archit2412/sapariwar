const User = require('../models/User.js'); // Import the User model

// @route   GET /api/auth/me
// @desc    Get current logged-in user's details from MongoDB
// @access  Private (requires Firebase token)
exports.getMe = async (req, res) => {
  try {
    // The authMiddleware has already verified the Firebase token
    // and attempted to find or create the user in MongoDB.
    // The MongoDB user object (if found/created) is attached as req.user.
    // The Firebase decoded token is attached as req.firebaseUser.

    if (!req.user) {
      // This case should ideally be handled by the middleware creating the user.
      // However, if for some reason req.user is not populated but req.firebaseUser is,
      // it might indicate a user that exists in Firebase but not yet in our DB
      // (though the middleware attempts to create it).
      // Or, it could mean the user was just created by the middleware and we want to fetch it fresh.

      const user = await User.findOne({ firebaseUid: req.firebaseUser.uid }).populate('familyTrees');
      if (!user) {
        return res.status(404).json({ msg: 'User not found in database, though Firebase token is valid.' });
      }
      return res.json(user);
    }

    // If req.user is already populated by the middleware, we can use it.
    // For consistency and to ensure we have the latest data including populated fields:
    const freshUser = await User.findById(req.user._id).populate('familyTrees');
    if (!freshUser) {
        // Should not happen if req.user was valid
        return res.status(404).json({ msg: 'User not found with ID from token.' });
    }

    res.json(freshUser);
  } catch (err) {
    console.error('Error in authController.getMe:', err.message);
    res.status(500).send('Server Error');
  }
};

// @route   POST /api/auth/sync-user (Alternative or additional endpoint)
// @desc    Explicitly syncs Firebase user with MongoDB. Middleware usually handles this.
// @access  Private
exports.syncUser = async (req, res) => {
    try {
        // authMiddleware already ensures user exists or creates them.
        // req.user is the user from MongoDB.
        if (!req.user) {
            // This should ideally not be reached if middleware is working correctly
            return res.status(404).json({ msg: 'User not found or could not be created.' });
        }
        
        // Optionally, update displayName or profilePicture if they changed in Firebase
        // and you want to re-sync them on this explicit call.
        const firebaseUser = req.firebaseUser;
        let updated = false;

        if (firebaseUser.name && req.user.displayName !== firebaseUser.name) {
            req.user.displayName = firebaseUser.name;
            updated = true;
        }
        if (firebaseUser.picture && req.user.profilePicture !== firebaseUser.picture) {
            req.user.profilePicture = firebaseUser.picture;
            updated = true;
        }

        if (updated) {
            await req.user.save();
        }
        
        const userToReturn = await User.findById(req.user._id).populate('familyTrees');
        res.json(userToReturn);

    } catch (err) {
        console.error('Error in authController.syncUser:', err.message);
        res.status(500).send('Server Error');
    }
};