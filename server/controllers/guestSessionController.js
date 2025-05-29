const crypto = require('crypto');
const FamilyTree = require('../models/FamilyTree');
const User = require('../models/User');

/**
 * Starts a new guest session by generating a unique session ID.
 */
exports.startGuestSession = (req, res) => {
  try {
    const guestSessionId = crypto.randomBytes(16).toString('hex');
    // This ID is returned to the client, which should store it (e.g., in session/local storage)
    // and send it back in the 'x-guest-session-id' header for subsequent guest requests.
    res.status(200).json({ guestSessionId });
  } catch (error) {
    console.error("Error starting guest session:", error);
    res.status(500).json({ message: "Server error while starting guest session." });
  }
};

/**
 * Allows an authenticated user to claim a tree created during a guest session.
 * The tree's ownership is transferred to the authenticated user.
 */
exports.claimGuestTree = async (req, res) => {
  // This endpoint requires an authenticated user.
  // authMiddleware should have populated req.user if a valid token was provided.
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Authentication required to claim a tree.' });
  }

  const { guestSessionId } = req.body; // Expecting guestSessionId in the request body

  if (!guestSessionId) {
    return res.status(400).json({ message: 'Guest session ID is required in the request body.' });
  }

  try {
    // Find the tree associated with the guestSessionId that has not yet been claimed (owner is null).
    const tree = await FamilyTree.findOne({ guestSessionId: guestSessionId, owner: null });

    if (!tree) {
      return res.status(404).json({ message: 'No unclaimed tree found for this guest session, or tree already claimed.' });
    }

    // req.user should be the full user document from your database, populated by authMiddleware.
    // If authMiddleware only sets req.user = { firebaseUid: ..., id: ... }, you might need to fetch the full user doc here.
    // Assuming req.user.id is the MongoDB _id of the user.
    const user = await User.findById(req.user.id);
    if (!user) {
        // This should ideally not happen if authMiddleware correctly populates req.user
        console.error(`Claim Guest Tree: User ID ${req.user.id} from token not found in User collection.`);
        return res.status(404).json({ message: 'Authenticated user not found in database.' });
    }

    // Assign ownership to the authenticated user
    tree.owner = user._id; // or req.user.id
    tree.guestSessionId = null; // Clear the guest session ID as the tree is now owned.
    
    // The 'updatedAt' field will be automatically updated due to {timestamps: true} in the schema.
    await tree.save();

    // Add this tree to the user's list of familyTrees (if your User model has such a field)
    if (user.familyTrees && !user.familyTrees.includes(tree._id)) {
      user.familyTrees.push(tree._id);
      await user.save();
    }

    res.status(200).json({ message: 'Tree claimed successfully.', treeId: tree._id, treeName: tree.name });

  } catch (error)
  {
    console.error('Error claiming guest tree:', error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while claiming tree.' });
  }
};