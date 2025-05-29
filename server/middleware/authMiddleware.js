const admin = require('firebase-admin');
const User = require('../models/User');

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  const serviceAccount = require('../config/sapariwar-2caf2-firebase-adminsdk-fbsvc-17d02b8cc5.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const authMiddleware = async (req, res, next) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  const guestSessionId = req.headers['x-guest-session-id']; // Custom header for guest sessions

  if (idToken) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      req.user = await User.findOne({ firebaseUid: decodedToken.uid });
      req.isAuthenticated = true;
    } catch (error) {
      console.error('Firebase auth error:', error.message);
      if (!guestSessionId) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
      }
    }
  }

  if (!req.user && guestSessionId) {
    req.guestSessionId = guestSessionId;
    req.isGuest = true;
  }

  next();
};

module.exports = authMiddleware;