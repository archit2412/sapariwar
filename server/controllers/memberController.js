const FamilyMember = require('../models/FamilyMember');
const FamilyTree = require('../models/FamilyTree'); // Needed for updating tree's member list
const { checkTreeAccess } = require('../utils/checkTreeAccess'); // Import the utility
const mongoose = require('mongoose'); // For ObjectId validation

// Add a family member to a specific tree
exports.addFamilyMember = async (req, res) => {
  const { treeId } = req.params; // The ID of the tree to add the member to
  // Member data from request body:
  const {
    firstName, lastName, gender, dateOfBirth, placeOfBirth, dateOfDeath,
    placeOfDeath, profilePictureUrl, biography, relationships, // Assuming relationships might be passed
    // For simplicity, direct parent/spouse/children fields might be easier if not using 'relationships' object
    parents, spouses, children
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(treeId)) {
    return res.status(400).json({ message: 'Invalid tree ID format.' });
  }

  try {
    // First, check if the user/guest has access to the tree they're trying to add a member to.
    // true for writeAccessRequired, as adding a member is a modification.
    const tree = await checkTreeAccess(treeId, req, true);
    if (!tree) {
      return res.status(403).json({ message: 'Access denied or tree not found. Cannot add member.' });
    }

    const newMemberData = {
      treeId: tree._id, // Associate member with this tree
      firstName, lastName, gender, dateOfBirth, placeOfBirth, dateOfDeath,
      placeOfDeath, profilePictureUrl, biography,
      parents: parents || [], // Ensure these are arrays of ObjectIds
      spouses: spouses || [], // Ensure these are arrays of { spouseId, relationshipType }
      children: children || [], // Ensure these are arrays of ObjectIds
      // 'relationships' field could be more complex and handled based on its structure
    };

    const newMember = new FamilyMember(newMemberData);
    await newMember.save();

    // Add the new member's ID to the tree's 'members' array
    if (!tree.members.includes(newMember._id)) {
      tree.members.push(newMember._id);
      await tree.save(); // Save the tree with the new member reference
    }

    // Complex: Update relationships for other members if necessary.
    // E.g., if 'parents' were specified for newMember, those parent documents should have newMember added to their 'children' array.
    // This requires careful logic and is beyond the scope of this direct change, assume you have this or will build it.

    res.status(201).json(newMember);
  } catch (error) {
    console.error(`Error adding family member to tree ${treeId}:`, error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message, errors: error.errors });
    }
    res.status(500).json({ message: 'Server error while adding family member.' });
  }
};

// Get all family members for a specific tree
exports.getFamilyMembersByTree = async (req, res) => {
  const { treeId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(treeId)) {
    return res.status(400).json({ message: 'Invalid tree ID format.' });
  }

  try {
    // Check access to the tree first (read access is sufficient)
    const tree = await checkTreeAccess(treeId, req, false); // false for writeAccessRequired
    if (!tree) {
      return res.status(403).json({ message: 'Access denied or tree not found.' });
    }

    // If access granted, fetch members belonging to this tree
    const members = await FamilyMember.find({ treeId: tree._id });
    // Consider populating relationships if needed for display:
    // .populate('parents')
    // .populate('children')
    // .populate('spouses.spouseId');
    res.status(200).json(members);
  } catch (error) {
    console.error(`Error fetching members for tree ${treeId}:`, error);
    res.status(500).json({ message: 'Server error while fetching family members.' });
  }
};

// Get a specific family member by their ID
exports.getFamilyMemberById = async (req, res) => {
  const { memberId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    return res.status(400).json({ message: 'Invalid member ID format.' });
  }

  try {
    const member = await FamilyMember.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: 'Family member not found.' });
    }

    // Now, check if the current user/guest has access to the tree this member belongs to.
    // Read access is sufficient (false for writeAccessRequired).
    const tree = await checkTreeAccess(member.treeId.toString(), req, false);
    if (!tree) {
      return res.status(403).json({ message: 'Access denied to the tree this member belongs to.' });
    }

    // Optionally populate relationships for the single member view
    // await member.populate(['parents', 'children', 'spouses.spouseId']);
    res.status(200).json(member);
  } catch (error) {
    console.error(`Error fetching family member ${memberId}:`, error);
    res.status(500).json({ message: 'Server error while fetching family member.' });
  }
};

// Update a family member
exports.updateFamilyMember = async (req, res) => {
  const { memberId } = req.params;
  const updates = req.body; // Contains fields to update

  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    return res.status(400).json({ message: 'Invalid member ID format.' });
  }

  try {
    const member = await FamilyMember.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: 'Family member not found.' });
    }

    // Check write access to the tree this member belongs to.
    const tree = await checkTreeAccess(member.treeId.toString(), req, true); // true for writeAccessRequired
    if (!tree) {
      return res.status(403).json({ message: 'Access denied to modify members in this tree.' });
    }

    // Update allowed member fields. Be careful about what can be updated.
    // Exclude fields like _id, treeId from direct update via body.
    const allowedUpdates = ['firstName', 'lastName', 'gender', 'dateOfBirth', 'placeOfBirth', 'dateOfDeath', 'placeOfDeath', 'profilePictureUrl', 'biography', 'parents', 'spouses', 'children' /*, 'relationships'*/];
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        member[key] = updates[key];
      }
    });
    // member.updatedAt is handled by {timestamps: true} in FamilyMember schema (assuming it has it)

    await member.save();

    // Complex: Handle updates to relationships (e.g., if 'parents' array changes, update other members).
    // This requires careful logic.

    res.status(200).json(member);
  } catch (error) {
    console.error(`Error updating family member ${memberId}:`, error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message, errors: error.errors });
    }
    res.status(500).json({ message: 'Server error while updating family member.' });
  }
};

// Delete a family member
exports.deleteFamilyMember = async (req, res) => {
  const { memberId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    return res.status(400).json({ message: 'Invalid member ID format.' });
  }

  try {
    const member = await FamilyMember.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: 'Family member not found.' });
    }

    // Check write access to the tree this member belongs to.
    const tree = await checkTreeAccess(member.treeId.toString(), req, true); // true for writeAccessRequired
    if (!tree) {
      return res.status(403).json({ message: 'Access denied to delete members from this tree.' });
    }

    const parentTreeId = member.treeId;

    // 1. Delete the member itself
    // await member.remove(); // .remove() is deprecated
    await FamilyMember.deleteOne({ _id: memberId });


    // 2. Remove the member's ID from the parent tree's 'members' array
    await FamilyTree.updateOne(
      { _id: parentTreeId },
      { $pull: { members: memberId } } // Use memberId directly
    );

    // 3. Complex: Remove this member from other members' relationship arrays.
    //    - Remove from children's 'parents' list.
    //    - Remove from parents' 'children' list.
    //    - Remove from spouses' 'spouses' list.
    //    This requires iterating through related members and updating them. This is critical for data integrity.
    //    Example for removing from children's parents list:
    //    await FamilyMember.updateMany({ parents: memberId }, { $pull: { parents: memberId } });
    //    Similar logic for other relationships.

    res.status(200).json({ message: 'Family member deleted successfully. Remember to handle cascading relationship updates.' });
  } catch (error) {
    console.error(`Error deleting family member ${memberId}:`, error);
    res.status(500).json({ message: 'Server error while deleting family member.' });
  }
};