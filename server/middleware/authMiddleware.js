const admin = require('firebase-admin');
const User = require('../models/User'); // Adjust path as necessary

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'Unauthorized. No token provided or token format is incorrect.' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.firebaseUser = decodedToken; // Attach Firebase decoded token

    // Find or create user in MongoDB
    let user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      // If user does not exist, create a new one
      // You might want to ensure all necessary fields are present or have defaults
      user = new User({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name || '', // Firebase 'name' maps to 'displayName'
        profilePicture: decodedToken.picture || '', // Firebase 'picture' maps to 'profilePicture'
        // familyTrees will be empty by default for a new user
      });
      await user.save();
      console.log('New user created in MongoDB:', user.email);
    }

    // Populate familyTrees for the user
    // It's often better to populate where needed rather than in middleware for every request
    // However, if req.user is consistently expected to have familyTrees populated, do it here.
    // For now, let's attach the user without populating here to keep middleware lean.
    // The controller can .populate('familyTrees') if needed.
    req.user = user; // Attach MongoDB user object

    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ msg: 'Unauthorized. Token expired.' });
    }
    if (error.code === 'auth/argument-error' || error.code === 'auth/id-token-revoked') {
        return res.status(401).json({ msg: 'Unauthorized. Invalid token.' });
    }
    return res.status(403).json({ msg: 'Forbidden. Token verification failed.' });
  }
};

module.exports = authMiddleware;
