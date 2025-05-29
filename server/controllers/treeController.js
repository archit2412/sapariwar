const FamilyTree = require('../models/FamilyTree');
const User = require('../models/User'); // Assuming your User model is correctly set up
const FamilyMember = require('../models/FamilyMember'); // For deleting members when a tree is deleted
const { checkTreeAccess } = require('../utils/checkTreeAccess'); // Import the utility
const mongoose = require('mongoose'); // Needed for ObjectId validation if not done in checkTreeAccess

// Create a new family tree (can be by an authenticated user or a guest)
exports.createFamilyTree = async (req, res) => {
  const { name, description, privacy } = req.body;

  try {
    let newTreeData = {
      name,
      description,
      privacy: privacy || 'private', // Default to private if not specified
    };
    let userToUpdate = null; // For associating tree with an authenticated user

    if (req.user && req.user.id) { // Case: Authenticated user is creating the tree
      newTreeData.owner = req.user.id;
      userToUpdate = await User.findById(req.user.id); // Fetch user to update their list of trees
      if (!userToUpdate) {
        // This should ideally not happen if authMiddleware works correctly and user exists
        return res.status(404).json({ message: "Authenticated user not found in database." });
      }
    } else if (req.guestSessionId) { // Case: Guest is creating the tree
      newTreeData.guestSessionId = req.guestSessionId;
      // No owner for guest-created trees at this point
    } else {
      // Neither authenticated user nor guest session ID provided
      return res.status(401).json({ message: 'Authentication or guest session ID required to create a tree.' });
    }

    const newTree = new FamilyTree(newTreeData);
    await newTree.save();

    // If an authenticated user created it, add tree to their list
    if (userToUpdate && newTree.owner) { // Check newTree.owner to be sure
      if (!userToUpdate.familyTrees.includes(newTree._id)) {
        userToUpdate.familyTrees.push(newTree._id);
        await userToUpdate.save();
      }
    }

    res.status(201).json(newTree);
  } catch (error) {
    console.error("Error creating family tree:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message, errors: error.errors });
    }
    res.status(500).json({ message: 'Server error while creating family tree.' });
  }
};

// Get a specific family tree by ID (accessible by owner or matching guest)
exports.getFamilyTreeById = async (req, res) => {
  const { treeId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(treeId)) {
      return res.status(400).json({ message: 'Invalid tree ID format.' });
  }

  try {
    // checkTreeAccess will return the tree if access is allowed, or null otherwise
    const tree = await checkTreeAccess(treeId, req);

    if (!tree) {
      return res.status(404).json({ message: 'Family tree not found or access denied.' });
    }

    // If you need to populate members when fetching a single tree:
    // await tree.populate('members'); // Or select specific fields: .populate({ path: 'members', select: 'firstName lastName' });
    res.status(200).json(tree);
  } catch (error) {
    console.error(`Error fetching family tree ${treeId}:`, error);
    res.status(500).json({ message: 'Server error while fetching family tree.' });
  }
};

// Get all family trees for the *authenticated* user
exports.getAllFamilyTreesForUser = async (req, res) => {
  // This endpoint is specifically for authenticated users to get their list of owned trees.
  // Guest trees are ephemeral and not "listed" in the same way until claimed.
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Authentication required to view your family trees.' });
  }

  try {
    // Fetch the user and populate their familyTrees array.
    // Ensure your User model has a 'familyTrees' path that references 'FamilyTree'
    const userWithTrees = await User.findById(req.user.id).populate('familyTrees');

    if (!userWithTrees) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json(userWithTrees.familyTrees || []); // Send empty array if no trees
  } catch (error) {
    console.error("Error fetching user's family trees:", error);
    res.status(500).json({ message: "Server error while fetching user's family trees." });
  }
};

// Update a family tree (accessible by owner or matching guest)
exports.updateFamilyTree = async (req, res) => {
  const { treeId } = req.params;
  const { name, description, privacy } = req.body; // Fields that can be updated

  if (!mongoose.Types.ObjectId.isValid(treeId)) {
    return res.status(400).json({ message: 'Invalid tree ID format.' });
  }

  try {
    // checkTreeAccess ensures user/guest has write permission (currently, any access is write access for owner/guest)
    const tree = await checkTreeAccess(treeId, req, true); // Passing true for writeAccessRequired

    if (!tree) {
      return res.status(404).json({ message: 'Family tree not found or access denied for updates.' });
    }

    // Update allowed fields
    if (name !== undefined) tree.name = name;
    if (description !== undefined) tree.description = description;
    if (privacy !== undefined) tree.privacy = privacy;
    // tree.updatedAt is handled by {timestamps: true} in the schema

    await tree.save();
    res.status(200).json(tree);
  } catch (error) {
    console.error(`Error updating family tree ${treeId}:`, error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message, errors: error.errors });
    }
    res.status(500).json({ message: 'Server error while updating family tree.' });
  }
};

// Delete a family tree (accessible by owner or matching guest)
exports.deleteFamilyTree = async (req, res) => {
  const { treeId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(treeId)) {
    return res.status(400).json({ message: 'Invalid tree ID format.' });
  }

  try {
    const tree = await checkTreeAccess(treeId, req, true); // true for writeAccessRequired

    if (!tree) {
      return res.status(404).json({ message: 'Family tree not found or access denied for deletion.' });
    }

    // 1. Delete all members associated with this tree
    await FamilyMember.deleteMany({ treeId: tree._id });

    // 2. If the tree has an owner, remove the tree reference from the user's list
    if (tree.owner) {
      await User.updateOne(
        { _id: tree.owner },
        { $pull: { familyTrees: tree._id } }
      );
    }

    // 3. Delete the tree itself
    // await tree.remove(); // .remove() is deprecated in Mongoose 7+
    await FamilyTree.deleteOne({ _id: tree._id });


    res.status(200).json({ message: 'Family tree and associated members deleted successfully.' });
  } catch (error) {
    console.error(`Error deleting family tree ${treeId}:`, error);
    res.status(500).json({ message: 'Server error while deleting family tree.' });
  }
};