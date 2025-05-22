const FamilyTree = require('../models/FamilyTree');
const User = require('../models/User.js'); // Corrected path
const FamilyMember = require('../models/FamilyMember'); // Needed for deleting members when tree is deleted
const mongoose = require('mongoose');

// @route   POST /api/trees
// @desc    Create a new family tree
// @access  Private
exports.createFamilyTree = async (req, res) => {
  const { name, description, privacy } = req.body;

  if (!name) {
    return res.status(400).json({ msg: 'Family tree name is required.' });
  }

  try {
    const newTree = new FamilyTree({
      name,
      description,
      privacy: privacy || 'private', // Default to private if not specified
      owner: req.user._id, // req.user is populated by authMiddleware
      members: [], // Initially empty
    });

    const tree = await newTree.save();

    // Add this tree to the user's list of familyTrees
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { familyTrees: tree._id } },
      { new: true }
    );

    res.status(201).json(tree);
  } catch (err) {
    console.error('Error creating family tree:', err.message);
    res.status(500).send('Server Error');
  }
};

// @route   GET /api/trees
// @desc    Get all family trees for the logged-in user
// @access  Private
exports.getMyFamilyTrees = async (req, res) => {
  try {
    // req.user._id comes from authMiddleware
    const trees = await FamilyTree.find({ owner: req.user._id })
                                  .sort({ createdAt: -1 }) // Sort by most recent
                                  .populate('owner', 'displayName email') // Optionally populate owner details
                                  // .populate('members', 'firstName lastName'); // Optionally populate some member details
    res.json(trees);
  } catch (err) {
    console.error('Error fetching user family trees:', err.message);
    res.status(500).send('Server Error');
  }
};

// @route   GET /api/trees/:treeId
// @desc    Get a specific family tree by ID
// @access  Private (ensures user owns the tree or tree is public/shared - for now, owner only)
exports.getFamilyTreeById = async (req, res) => {
  try {
    const { treeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(treeId)) {
        return res.status(400).json({ msg: 'Invalid Tree ID format.' });
    }

    const tree = await FamilyTree.findById(treeId)
                                .populate('owner', 'displayName email')
                                .populate({
                                    path: 'members',
                                    // select: 'firstName lastName dateOfBirth', // Choose which fields to populate
                                    // populate: { // Further populate if needed, e.g., relationships within members
                                    //   path: 'parents spouses children',
                                    //   select: 'firstName lastName'
                                    // }
                                  });

    if (!tree) {
      return res.status(404).json({ msg: 'Family tree not found.' });
    }

    // Ensure the logged-in user is the owner of the tree
    // Later, we can add logic for public/shared trees
    if (tree.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'User not authorized to access this tree.' });
    }

    res.json(tree);
  } catch (err) {
    console.error('Error fetching family tree by ID:', err.message);
    if (err.kind === 'ObjectId') { // Handle invalid ObjectId format for treeId specifically
        return res.status(404).json({ msg: 'Family tree not found (invalid ID format).' });
    }
    res.status(500).send('Server Error');
  }
};

// @route   PUT /api/trees/:treeId
// @desc    Update a family tree's details (name, description, privacy)
// @access  Private (owner only)
exports.updateFamilyTree = async (req, res) => {
  const { treeId } = req.params;
  const { name, description, privacy } = req.body;

  if (!mongoose.Types.ObjectId.isValid(treeId)) {
    return res.status(400).json({ msg: 'Invalid Tree ID format.' });
  }

  try {
    let tree = await FamilyTree.findById(treeId);

    if (!tree) {
      return res.status(404).json({ msg: 'Family tree not found.' });
    }

    // Check ownership
    if (tree.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'User not authorized to update this tree.' });
    }

    // Build update object
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (privacy !== undefined) updateFields.privacy = privacy;
    // Add logic for shareableLink if privacy changes to 'public_link'

    if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ msg: 'No update fields provided.' });
    }
    updateFields.updatedAt = Date.now();


    tree = await FamilyTree.findByIdAndUpdate(
      treeId,
      { $set: updateFields },
      { new: true, runValidators: true } // new: true returns the modified document
    ).populate('owner', 'displayName email');

    res.json(tree);
  } catch (err) {
    console.error('Error updating family tree:', err.message);
    res.status(500).send('Server Error');
  }
};

// @route   DELETE /api/trees/:treeId
// @desc    Delete a family tree and all its members
// @access  Private (owner only)
exports.deleteFamilyTree = async (req, res) => {
  const { treeId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(treeId)) {
    return res.status(400).json({ msg: 'Invalid Tree ID format.' });
  }

  try {
    const tree = await FamilyTree.findById(treeId);

    if (!tree) {
      return res.status(404).json({ msg: 'Family tree not found.' });
    }

    // Check ownership
    if (tree.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'User not authorized to delete this tree.' });
    }

    // Transaction recommended here for atomicity if your DB supports it (MongoDB >= 4.0 for replica sets)
    // For simplicity, we'll do sequential operations. Ensure error handling is robust.
    // const session = await mongoose.startSession(); // For transactions
    // session.startTransaction();

    try {
        // 1. Delete all FamilyMember documents associated with this tree
        await FamilyMember.deleteMany({ treeId: tree._id } /*, { session }*/);

        // 2. Remove the tree reference from the User's familyTrees array
        await User.findByIdAndUpdate(
            req.user._id,
            { $pull: { familyTrees: tree._id } }
            // { session }
        );

        // 3. Delete the FamilyTree document itself
        await FamilyTree.findByIdAndDelete(treeId /*, { session }*/);

        // await session.commitTransaction();
        res.json({ msg: 'Family tree and all associated members successfully deleted.' });
    } catch (innerErr) {
        // await session.abortTransaction();
        console.error('Error during tree deletion process:', innerErr.message);
        throw innerErr; // Propagate to outer catch
    } finally {
        // session.endSession();
    }

  } catch (err) {
    console.error('Error deleting family tree:', err.message);
    res.status(500).send('Server Error');
  }
};