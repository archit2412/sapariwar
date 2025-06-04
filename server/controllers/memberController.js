const FamilyMember = require('../models/FamilyMember');
const FamilyTree = require('../models/FamilyTree');
const { checkTreeAccess } = require('../utils/checkTreeAccess');
const mongoose = require('mongoose');

// Utility to cast to ObjectId array (with 'new')
function toObjectIdArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter(Boolean).map(id => new mongoose.Types.ObjectId(id));
}
function toObjectIdOrUndefined(id) {
  return id && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : undefined;
}

// Add a family member to a specific tree (and update parents/spouses/children if given)
exports.addFamilyMember = async (req, res) => {
  const { treeId } = req.params;
  const {
    firstName, lastName, gender, dateOfBirth, placeOfBirth, dateOfDeath,
    placeOfDeath, profilePictureUrl, biography, mother, father, spouses, children, role
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(treeId)) {
    return res.status(400).json({ message: 'Invalid tree ID format.' });
  }

  try {
    const tree = await checkTreeAccess(treeId, req, true);
    if (!tree) {
      return res.status(403).json({ message: 'Access denied or tree not found. Cannot add member.' });
    }

    const newMemberData = {
      treeId: new mongoose.Types.ObjectId(tree._id),
      firstName, lastName, gender, dateOfBirth, placeOfBirth, dateOfDeath,
      placeOfDeath, profilePictureUrl, biography,
      mother: toObjectIdOrUndefined(mother),
      father: toObjectIdOrUndefined(father),
      spouses: toObjectIdArray(spouses),
      children: toObjectIdArray(children),
      role
    };

    const newMember = new FamilyMember(newMemberData);
    await newMember.save();

    // Add to tree members if not already present
    if (!tree.members.includes(newMember._id)) {
      tree.members.push(newMember._id);
      await tree.save();
    }

    // If parents specified, add this member as their child
    const parents = [];
    if (mother && mongoose.Types.ObjectId.isValid(mother)) parents.push(new mongoose.Types.ObjectId(mother));
    if (father && mongoose.Types.ObjectId.isValid(father)) parents.push(new mongoose.Types.ObjectId(father));
    if (parents.length) {
      await FamilyMember.updateMany(
        { _id: { $in: parents } },
        { $addToSet: { children: newMember._id } }
      );
    }

    // If spouses specified, add this member to their spouses' spouses array
    if (spouses && spouses.length > 0) {
      await FamilyMember.updateMany(
        { _id: { $in: toObjectIdArray(spouses) } },
        { $addToSet: { spouses: newMember._id } }
      );
    }

    // If children specified, add this member as their parent (if not already set)
    if (children && children.length > 0) {
      let parentField = '';
      if (role === 'father') parentField = 'father';
      else if (role === 'mother') parentField = 'mother';
      if (parentField) {
        await FamilyMember.updateMany(
          { _id: { $in: toObjectIdArray(children) } },
          { $set: { [parentField]: newMember._id } }
        );
      }
    }

    res.status(201).json(newMember);
  } catch (error) {
    console.error(`Error adding family member to tree ${treeId}:`, error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message, errors: error.errors });
    }
    res.status(500).json({ message: 'Server error while adding family member.' });
  }
};

// Add a sibling to a member (parents will be same as the reference member, and update parents' children array)
exports.addSibling = async (req, res) => {
  try {
    const { treeId, memberId } = req.params;
    const { firstName, lastName, gender, dateOfBirth, placeOfBirth, dateOfDeath, placeOfDeath, profilePictureUrl, biography, spouses, children } = req.body;

    if (!mongoose.Types.ObjectId.isValid(treeId) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ message: 'Invalid tree ID or member ID format.' });
    }

    // Check access to the tree
    const tree = await checkTreeAccess(treeId, req, true);
    if (!tree) {
      return res.status(403).json({ message: 'Access denied or tree not found.' });
    }

    // Find the reference member to get their parents
    const referenceMember = await FamilyMember.findById(memberId);
    if (!referenceMember) {
      return res.status(404).json({ message: 'Reference member not found.' });
    }

    if (!referenceMember.mother || !referenceMember.father) {
      return res.status(400).json({ message: 'Reference member does not have both parents specified.' });
    }

    const sibling = new FamilyMember({
      treeId: new mongoose.Types.ObjectId(treeId),
      firstName,
      lastName,
      gender,
      dateOfBirth,
      placeOfBirth,
      dateOfDeath,
      placeOfDeath,
      profilePictureUrl,
      biography,
      mother: referenceMember.mother,
      father: referenceMember.father,
      spouses: toObjectIdArray(spouses),
      children: toObjectIdArray(children),
      role: "sibling"
    });
    await sibling.save();

    // Add the new sibling to the tree's members array if not already present
    if (!tree.members.includes(sibling._id)) {
      tree.members.push(sibling._id);
      await tree.save();
    }

    // Add new sibling to parents' children array
    await FamilyMember.updateMany(
      { _id: { $in: [referenceMember.mother, referenceMember.father] } },
      { $addToSet: { children: sibling._id } }
    );

    res.status(201).json({
      message: 'Sibling added successfully.',
      sibling
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add a spouse to a member (bi-directional linking)
exports.addSpouse = async (req, res) => {
  try {
    const { treeId, memberId } = req.params;
    const { firstName, lastName, gender, dateOfBirth, placeOfBirth, dateOfDeath, placeOfDeath, profilePictureUrl, biography, children } = req.body;

    if (!mongoose.Types.ObjectId.isValid(treeId) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ message: 'Invalid tree ID or member ID format.' });
    }

    // Check access to the tree
    const tree = await checkTreeAccess(treeId, req, true);
    if (!tree) {
      return res.status(403).json({ message: 'Access denied or tree not found.' });
    }

    // Create spouse
    const spouse = new FamilyMember({
      treeId: new mongoose.Types.ObjectId(treeId),
      firstName,
      lastName,
      gender,
      dateOfBirth,
      placeOfBirth,
      dateOfDeath,
      placeOfDeath,
      profilePictureUrl,
      biography,
      spouses: [new mongoose.Types.ObjectId(memberId)],
      children: toObjectIdArray(children),
      role: "spouse"
    });
    await spouse.save();

    // Add spouse to member's spouses array (bi-directional link)
    await FamilyMember.findByIdAndUpdate(
      memberId,
      { $addToSet: { spouses: spouse._id } }
    );

    // Add spouse to tree's members if not already present
    if (!tree.members.includes(spouse._id)) {
      tree.members.push(spouse._id);
      await tree.save();
    }

    res.status(201).json({ message: 'Spouse added successfully.', spouse });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add a child and auto-update parents' children arrays
exports.addChild = async (req, res) => {
  try {
    const { treeId } = req.params;
    const { firstName, lastName, gender, dateOfBirth, placeOfBirth, dateOfDeath, placeOfDeath, profilePictureUrl, biography, mother, father, spouses } = req.body;

    if (!mongoose.Types.ObjectId.isValid(treeId)) {
      return res.status(400).json({ message: 'Invalid tree ID format.' });
    }
    if ((!mother || !mongoose.Types.ObjectId.isValid(mother)) && (!father || !mongoose.Types.ObjectId.isValid(father))) {
      return res.status(400).json({ message: 'At least one valid parent ID required.' });
    }

    // Check access to the tree
    const tree = await checkTreeAccess(treeId, req, true);
    if (!tree) {
      return res.status(403).json({ message: 'Access denied or tree not found.' });
    }

    // Create child
    const child = new FamilyMember({
      treeId: new mongoose.Types.ObjectId(treeId),
      firstName,
      lastName,
      gender,
      dateOfBirth,
      placeOfBirth,
      dateOfDeath,
      placeOfDeath,
      profilePictureUrl,
      biography,
      mother: toObjectIdOrUndefined(mother),
      father: toObjectIdOrUndefined(father),
      spouses: toObjectIdArray(spouses),
      role: "child"
    });
    await child.save();

    // Add child to both parents' children arrays
    const parents = [];
    if (mother && mongoose.Types.ObjectId.isValid(mother)) parents.push(new mongoose.Types.ObjectId(mother));
    if (father && mongoose.Types.ObjectId.isValid(father)) parents.push(new mongoose.Types.ObjectId(father));
    if (parents.length) {
      await FamilyMember.updateMany(
        { _id: { $in: parents } },
        { $addToSet: { children: child._id } }
      );
    }

    // Add child to tree's members if not already present
    if (!tree.members.includes(child._id)) {
      tree.members.push(child._id);
      await tree.save();
    }

    res.status(201).json({ message: 'Child added successfully.', child });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a sibling (removes from parents' children arrays and deletes the member)
exports.deleteSibling = async (req, res) => {
  const { memberId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    return res.status(400).json({ message: 'Invalid member ID format.' });
  }

  try {
    const sibling = await FamilyMember.findById(memberId);
    if (!sibling) {
      return res.status(404).json({ message: 'Sibling not found.' });
    }

    // Remove the sibling from parents' children arrays
    await FamilyMember.updateMany(
      { _id: { $in: [sibling.mother, sibling.father] } },
      { $pull: { children: sibling._id } }
    );

    // Remove this sibling from any spouses' spouses arrays
    await FamilyMember.updateMany(
      { _id: { $in: sibling.spouses } },
      { $pull: { spouses: sibling._id } }
    );

    // Remove this sibling as a parent from any children
    await FamilyMember.updateMany(
      { _id: { $in: sibling.children } },
      { $pull: { mother: sibling._id, father: sibling._id } }
    );

    // Remove sibling from tree's members array
    await FamilyTree.updateOne(
      { _id: sibling.treeId },
      { $pull: { members: sibling._id } }
    );

    // Delete the sibling member
    await FamilyMember.deleteOne({ _id: memberId });

    res.status(200).json({ message: 'Sibling deleted successfully and relationships updated.' });
  } catch (error) {
    console.error(`Error deleting sibling ${memberId}:`, error);
    res.status(500).json({ message: 'Server error while deleting sibling.' });
  }
};

// Get all family members for a specific tree
exports.getFamilyMembersByTree = async (req, res) => {
  const { treeId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(treeId)) {
    return res.status(400).json({ message: 'Invalid tree ID format.' });
  }

  try {
    const tree = await checkTreeAccess(treeId, req, false);
    if (!tree) {
      return res.status(403).json({ message: 'Access denied or tree not found.' });
    }

    const members = await FamilyMember.find({ treeId: new mongoose.Types.ObjectId(tree._id) });
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

    const tree = await checkTreeAccess(member.treeId.toString(), req, false);
    if (!tree) {
      return res.status(403).json({ message: 'Access denied to the tree this member belongs to.' });
    }

    res.status(200).json(member);
  } catch (error) {
    console.error(`Error fetching family member ${memberId}:`, error);
    res.status(500).json({ message: 'Server error while fetching family member.' });
  }
};

// Update a family member
exports.updateFamilyMember = async (req, res) => {
  const { memberId } = req.params;
  const updates = req.body;

  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    return res.status(400).json({ message: 'Invalid member ID format.' });
  }

  try {
    const member = await FamilyMember.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: 'Family member not found.' });
    }

    const tree = await checkTreeAccess(member.treeId.toString(), req, true);
    if (!tree) {
      return res.status(403).json({ message: 'Access denied to modify members in this tree.' });
    }

    const allowedUpdates = [
      'firstName', 'lastName', 'gender', 'dateOfBirth', 'placeOfBirth', 'dateOfDeath',
      'placeOfDeath', 'profilePictureUrl', 'biography', 'mother', 'father', 'spouses', 'children', 'role'
    ];
    allowedUpdates.forEach(key => {
      if (updates[key] !== undefined) {
        if (key === 'mother' || key === 'father') {
          member[key] = toObjectIdOrUndefined(updates[key]);
        } else if (key === 'spouses' || key === 'children') {
          member[key] = toObjectIdArray(updates[key]);
        } else {
          member[key] = updates[key];
        }
      }
    });

    await member.save();
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

    const tree = await checkTreeAccess(member.treeId.toString(), req, true);
    if (!tree) {
      return res.status(403).json({ message: 'Access denied to delete members from this tree.' });
    }

    const parentTreeId = member.treeId;

    await FamilyMember.deleteOne({ _id: memberId });

    await FamilyTree.updateOne(
      { _id: parentTreeId },
      { $pull: { members: memberId } }
    );

    // (Optional: Remove this member from parents' children arrays, spouses' spouses arrays, etc.)

    res.status(200).json({ message: 'Family member deleted successfully. Remember to handle cascading relationship updates.' });
  } catch (error) {
    console.error(`Error deleting family member ${memberId}:`, error);
    res.status(500).json({ message: 'Server error while deleting family member.' });
  }
};