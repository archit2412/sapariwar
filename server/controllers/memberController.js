const FamilyMember = require('../models/FamilyMember');
const FamilyTree = require('../models/FamilyTree');
const mongoose = require('mongoose');

// Helper function to check tree ownership and existence
const checkTreeAccess = async (treeId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(treeId)) {
    return { error: { status: 400, msg: 'Invalid Tree ID format.' }, tree: null };
  }
  const tree = await FamilyTree.findById(treeId);
  if (!tree) {
    return { error: { status: 404, msg: 'Family tree not found.' }, tree: null };
  }
  if (tree.owner.toString() !== userId.toString()) {
    return { error: { status: 403, msg: 'User not authorized to access this tree.' }, tree: null };
  }
  return { error: null, tree };
};


// @route   POST /api/trees/:treeId/members
// @desc    Add a new member to a specific family tree
// @access  Private (requires ownership of the tree)
exports.addFamilyMember = async (req, res) => {
  const { treeId } = req.params;
  const userId = req.user._id; // From authMiddleware

  const { error: treeAccessError, tree } = await checkTreeAccess(treeId, userId);
  if (treeAccessError) {
    return res.status(treeAccessError.status).json({ msg: treeAccessError.msg });
  }

  const {
    firstName, lastName, gender, dateOfBirth, placeOfBirth,
    dateOfDeath, placeOfDeath, profilePictureUrl, biography,
    parents, // Array of existing member IDs
    spouses, // Array of objects like { spouseId: 'memberId', relationshipType: 'Married' }
    // Children are typically derived or added by linking from the child's side
  } = req.body;

  if (!firstName || !gender) {
    return res.status(400).json({ msg: 'First name and gender are required.' });
  }

  try {
    const newMemberData = {
      treeId: tree._id,
      firstName, lastName, gender, dateOfBirth, placeOfBirth,
      dateOfDeath, placeOfDeath, profilePictureUrl, biography,
      parents: parents || [],
      spouses: spouses || [],
      children: [], // Children will be added by linking from child to parent
    };

    // Validate parent and spouse IDs (ensure they exist and belong to the same tree)
    // For simplicity, this validation is basic here. Production would need more robust checks.
    if (parents) {
      for (const parentId of parents) {
        if (!mongoose.Types.ObjectId.isValid(parentId)) return res.status(400).json({ msg: `Invalid parent ID format: ${parentId}`});
        const parentMember = await FamilyMember.findOne({ _id: parentId, treeId: tree._id });
        if (!parentMember) return res.status(404).json({ msg: `Parent member with ID ${parentId} not found in this tree.` });
      }
    }
    if (spouses) {
         for (const spouseRel of spouses) {
            if (!mongoose.Types.ObjectId.isValid(spouseRel.spouseId)) return res.status(400).json({ msg: `Invalid spouse ID format: ${spouseRel.spouseId}`});
            const spouseMember = await FamilyMember.findOne({ _id: spouseRel.spouseId, treeId: tree._id });
            if (!spouseMember) return res.status(404).json({ msg: `Spouse member with ID ${spouseRel.spouseId} not found in this tree.` });
        }
    }


    const member = new FamilyMember(newMemberData);
    await member.save();

    // Add member to the tree's member list
    tree.members.push(member._id);
    await tree.save();

    // Bidirectional linking (simplified):
    // If parents were specified, add this new member to their children arrays
    if (parents && parents.length > 0) {
      await FamilyMember.updateMany(
        { _id: { $in: parents }, treeId: tree._id },
        { $addToSet: { children: member._id } } // Use $addToSet to avoid duplicates
      );
    }
    // If spouses were specified, update the spouse's record too
    if (spouses && spouses.length > 0) {
        for (const spouseRel of spouses) {
            await FamilyMember.findByIdAndUpdate(
                spouseRel.spouseId,
                { $addToSet: { spouses: { spouseId: member._id /*, add other details if schema supports */ } } }
            );
        }
    }


    res.status(201).json(member);
  } catch (err) {
    console.error('Error adding family member:', err.message);
    if (err.name === 'ValidationError') {
        return res.status(400).json({ msg: err.message });
    }
    res.status(500).send('Server Error');
  }
};

// @route   GET /api/trees/:treeId/members
// @desc    Get all members of a specific family tree
// @access  Private
exports.getFamilyMembersByTree = async (req, res) => {
  const { treeId } = req.params;
  const userId = req.user._id;

  const { error: treeAccessError } = await checkTreeAccess(treeId, userId);
  if (treeAccessError) {
    return res.status(treeAccessError.status).json({ msg: treeAccessError.msg });
  }

  try {
    const members = await FamilyMember.find({ treeId })
      .populate('parents', 'firstName lastName fullName') // Populate basic info
      .populate('spouses.spouseId', 'firstName lastName fullName')
      .populate('children', 'firstName lastName fullName')
      .sort({ createdAt: 1 }); // Or by name, etc.
    res.json(members);
  } catch (err) {
    console.error('Error fetching members by tree:', err.message);
    res.status(500).send('Server Error');
  }
};

// @route   GET /api/trees/:treeId/members/:memberId  (or /api/members/:memberId with tree check)
// @desc    Get a specific family member by ID
// @access  Private
exports.getFamilyMemberById = async (req, res) => {
  const { treeId, memberId } = req.params;
  const userId = req.user._id;

  const { error: treeAccessError } = await checkTreeAccess(treeId, userId);
  if (treeAccessError) {
    return res.status(treeAccessError.status).json({ msg: treeAccessError.msg });
  }

  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    return res.status(400).json({ msg: 'Invalid Member ID format.' });
  }

  try {
    const member = await FamilyMember.findOne({ _id: memberId, treeId })
      .populate('parents', 'firstName lastName fullName _id')
      .populate({
          path: 'spouses.spouseId',
          select: 'firstName lastName fullName _id'
      })
      .populate('children', 'firstName lastName fullName _id');

    if (!member) {
      return res.status(404).json({ msg: 'Family member not found in this tree.' });
    }
    res.json(member);
  } catch (err) {
    console.error('Error fetching member by ID:', err.message);
    res.status(500).send('Server Error');
  }
};

// @route   PUT /api/trees/:treeId/members/:memberId
// @desc    Update a family member's details
// @access  Private
exports.updateFamilyMember = async (req, res) => {
  const { treeId, memberId } = req.params;
  const userId = req.user._id;

  const { error: treeAccessError } = await checkTreeAccess(treeId, userId);
  if (treeAccessError) {
    return res.status(treeAccessError.status).json({ msg: treeAccessError.msg });
  }

  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    return res.status(400).json({ msg: 'Invalid Member ID format.' });
  }

  const {
    firstName, lastName, gender, dateOfBirth, placeOfBirth,
    dateOfDeath, placeOfDeath, profilePictureUrl, biography,
    // Relationship updates are more complex and might need separate endpoints or careful handling
    // For now, we focus on non-relational fields.
    // parents, spouses (handle with care or separate endpoints)
  } = req.body;

  try {
    let member = await FamilyMember.findOne({ _id: memberId, treeId });
    if (!member) {
      return res.status(404).json({ msg: 'Family member not found to update.' });
    }

    // Build update object only for fields that are provided
    const updateFields = {};
    if (firstName !== undefined) updateFields.firstName = firstName;
    if (lastName !== undefined) updateFields.lastName = lastName;
    if (gender !== undefined) updateFields.gender = gender;
    if (dateOfBirth !== undefined) updateFields.dateOfBirth = dateOfBirth;
    if (placeOfBirth !== undefined) updateFields.placeOfBirth = placeOfBirth;
    if (dateOfDeath !== undefined) updateFields.dateOfDeath = dateOfDeath;
    if (placeOfDeath !== undefined) updateFields.placeOfDeath = placeOfDeath;
    if (profilePictureUrl !== undefined) updateFields.profilePictureUrl = profilePictureUrl;
    if (biography !== undefined) updateFields.biography = biography;

    // Add logic for updating relationships (parents, spouses) if included.
    // This requires careful handling of adding/removing links and updating other members.
    // For example, if 'parents' array changes, old parents might need this member removed from their 'children',
    // and new parents might need this member added to their 'children'.
    // This is simplified here.

    if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ msg: 'No update fields provided.' });
    }
    updateFields.updatedAt = Date.now();

    const updatedMember = await FamilyMember.findByIdAndUpdate(
      memberId,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
    .populate('parents', 'firstName lastName fullName')
    .populate('spouses.spouseId', 'firstName lastName fullName')
    .populate('children', 'firstName lastName fullName');

    res.json(updatedMember);
  } catch (err) {
    console.error('Error updating family member:', err.message);
    if (err.name === 'ValidationError') {
        return res.status(400).json({ msg: err.message });
    }
    res.status(500).send('Server Error');
  }
};


// @route   DELETE /api/trees/:treeId/members/:memberId
// @desc    Delete a family member
// @access  Private
exports.deleteFamilyMember = async (req, res) => {
  const { treeId, memberId } = req.params;
  const userId = req.user._id;

  const { error: treeAccessError, tree } = await checkTreeAccess(treeId, userId);
  if (treeAccessError) {
    return res.status(treeAccessError.status).json({ msg: treeAccessError.msg });
  }

  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    return res.status(400).json({ msg: 'Invalid Member ID format.' });
  }

  try {
    const memberToDelete = await FamilyMember.findOne({ _id: memberId, treeId });
    if (!memberToDelete) {
      return res.status(404).json({ msg: 'Family member not found to delete.' });
    }

    // Atomicity is important here (transactions in MongoDB >= 4.0 for replica sets)
    // For simplicity, performing sequential operations:

    // 1. Remove this member from the FamilyTree's list of members
    await FamilyTree.findByIdAndUpdate(treeId, { $pull: { members: memberId } });

    // 2. Remove this member from any other member's parents, children, or spouses arrays
    // Remove from other members' 'children' arrays (if this member was a parent)
    await FamilyMember.updateMany({ treeId, children: memberId }, { $pull: { children: memberId } });
    // Remove from other members' 'parents' arrays (if this member was a child)
    await FamilyMember.updateMany({ treeId, parents: memberId }, { $pull: { parents: memberId } });
    // Remove from other members' 'spouses' arrays
    await FamilyMember.updateMany({ treeId, 'spouses.spouseId': memberId }, { $pull: { spouses: { spouseId: memberId } } });
    // Also, if this member had spouses, remove self from their spouse list (covered by above if symmetric, but good to be thorough)
    for (const spouseEntry of memberToDelete.spouses) {
        await FamilyMember.findByIdAndUpdate(spouseEntry.spouseId, { $pull: { spouses: { spouseId: memberId } } });
    }


    // 3. Delete the member itself
    await FamilyMember.findByIdAndDelete(memberId);

    res.json({ msg: 'Family member successfully deleted and references updated.' });
  } catch (err) {
    console.error('Error deleting family member:', err.message);
    res.status(500).send('Server Error');
  }
};

// --- Relationship Management Endpoints (Example Stubs - more complex) ---

// @route   POST /api/trees/:treeId/members/:memberId/link-parent/:parentId
// @desc    Link a parent to a member
// @access  Private
exports.linkParent = async (req, res) => {
    const { treeId, memberId, parentId } = req.params;
    const userId = req.user._id;

    const { error: treeAccessError } = await checkTreeAccess(treeId, userId);
    if (treeAccessError) return res.status(treeAccessError.status).json({ msg: treeAccessError.msg });

    if (!mongoose.Types.ObjectId.isValid(memberId) || !mongoose.Types.ObjectId.isValid(parentId)) {
        return res.status(400).json({ msg: 'Invalid Member or Parent ID format.' });
    }

    try {
        const child = await FamilyMember.findOne({ _id: memberId, treeId });
        const parent = await FamilyMember.findOne({ _id: parentId, treeId });

        if (!child || !parent) {
            return res.status(404).json({ msg: 'Child or Parent not found in this tree.' });
        }
        if (memberId === parentId) return res.status(400).json({msg: "Cannot link member to self as parent."})


        // Add parent to child's parents array
        child.parents.addToSet(parentId); // addToSet avoids duplicates
        // Add child to parent's children array
        parent.children.addToSet(memberId);

        await child.save();
        await parent.save();

        res.json({ msg: 'Parent linked successfully.', child, parent });
    } catch (err) {
        console.error('Error linking parent:', err.message);
        res.status(500).send('Server Error');
    }
};

// @route   POST /api/trees/:treeId/members/:memberId/link-spouse/:spouseMemberId
// @desc    Link a spouse to a member
// @access  Private
exports.linkSpouse = async (req, res) => {
    const { treeId, memberId, spouseMemberId } = req.params;
    // const { relationshipType } = req.body; // e.g., "Married"
    const userId = req.user._id;

    const { error: treeAccessError } = await checkTreeAccess(treeId, userId);
    if (treeAccessError) return res.status(treeAccessError.status).json({ msg: treeAccessError.msg });

    if (!mongoose.Types.ObjectId.isValid(memberId) || !mongoose.Types.ObjectId.isValid(spouseMemberId)) {
        return res.status(400).json({ msg: 'Invalid Member or Spouse ID format.' });
    }
     if (memberId === spouseMemberId) return res.status(400).json({msg: "Cannot link member to self as spouse."})


    try {
        const member1 = await FamilyMember.findOne({ _id: memberId, treeId });
        const member2 = await FamilyMember.findOne({ _id: spouseMemberId, treeId });

        if (!member1 || !member2) {
            return res.status(404).json({ msg: 'One or both members not found in this tree.' });
        }

        // Add to each other's spouses array (assuming symmetric relationship for now)
        // Ensure not already spoused to avoid duplicates, or handle updates to relationshipType
        const member1HasSpouse = member1.spouses.some(s => s.spouseId.equals(spouseMemberId));
        if (!member1HasSpouse) {
            member1.spouses.push({ spouseId: spouseMemberId /*, relationshipType */ });
        }

        const member2HasSpouse = member2.spouses.some(s => s.spouseId.equals(memberId));
        if (!member2HasSpouse) {
            member2.spouses.push({ spouseId: memberId /*, relationshipType */ });
        }

        await member1.save();
        await member2.save();

        res.json({ msg: 'Spouse linked successfully.', member1, member2 });
    } catch (err) {
        console.error('Error linking spouse:', err.message);
        res.status(500).send('Server Error');
    }
};
// Add similar unlinkParent, unlinkSpouse methods as needed.