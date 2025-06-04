const FamilyTree = require('../models/FamilyTree');
const FamilyMember = require('../models/FamilyMember');

/**
 * Create a family tree with initial members: self, mother, father.
 */
exports.createTreeWithInitialMembers = async (req, res) => {
  try {
    const { tree, members } = req.body;

    // Find members by role
    const motherData = members.find(m => m.role === 'mother');
    const fatherData = members.find(m => m.role === 'father');
    const selfData = members.find(m => m.role === 'self');

    if (!motherData || !fatherData || !selfData) {
      return res.status(400).json({ message: "You must provide all of: self, mother, father in members." });
    }

    // Create the tree to get its _id
    const tempTree = new FamilyTree({
      ...tree,
      owner: req.user ? req.user._id : undefined,
      guestSessionId: req.guestSessionId,
      members: []
    });
    await tempTree.save();

    // Create mother and father with reference to tree
    const mother = new FamilyMember({
      ...motherData,
      treeId: tempTree._id
    });
    await mother.save();

    const father = new FamilyMember({
      ...fatherData,
      treeId: tempTree._id
    });
    await father.save();

    // Create self with real mother/father IDs
    const self = new FamilyMember({
      ...selfData,
      treeId: tempTree._id,
      mother: mother._id,
      father: father._id
    });
    await self.save();

    // Update the tree with member IDs
    tempTree.members = [mother._id, father._id, self._id];
    await tempTree.save();

    res.status(201).json({
      tree: tempTree,
      members: [mother, father, self]
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get a family tree by ID with all member data deeply populated.
 */
exports.getFamilyTreeById = async (req, res) => {
  try {
    const { treeId } = req.params;

    const tree = await FamilyTree.findById(treeId)
      .populate({
        path: 'members',
        populate: [
          { path: 'mother', select: '-__v -treeId' },
          { path: 'father', select: '-__v -treeId' },
          {
            path: 'spouses.spouseId',
            select: '-__v -treeId'
          },
          {
            path: 'children',
            select: '-__v -treeId'
          }
        ],
        select: '-__v -treeId'
      })
      .lean();

    if (!tree) {
      return res.status(404).json({ message: 'Tree not found.' });
    }

    res.status(200).json(tree);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Add a sibling to a specific member in a specific tree.
 */
exports.addSibling = async (req, res) => {
  try {
    const { treeId, memberId } = req.params;
    const { firstName, lastName, gender } = req.body;

    // Find the member to whom we want to add a sibling
    const member = await FamilyMember.findOne({ _id: memberId, treeId });
    if (!member) {
      return res.status(404).json({ message: "Member not found in this tree." });
    }

    // Both parents must be known to add a sibling
    if (!member.mother || !member.father) {
      return res.status(400).json({ message: "Cannot add sibling: member must have both parents defined." });
    }

    // Create the sibling with the same parents and treeId
    const sibling = new FamilyMember({
      firstName,
      lastName,
      gender,
      treeId,
      mother: member.mother,
      father: member.father,
      role: 'sibling'
    });
    await sibling.save();

    // Optionally, add this sibling as a child to the parents
    await FamilyMember.updateMany(
      { _id: { $in: [member.mother, member.father] } },
      { $push: { children: sibling._id } }
    );

    // Add to tree members array
    await FamilyTree.findByIdAndUpdate(treeId, { $push: { members: sibling._id } });

    res.status(201).json({ sibling });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Add a spouse to a specific member in a specific tree.
 */
exports.addSpouse = async (req, res) => {
  try {
    const { treeId, memberId } = req.params;
    const { firstName, lastName, gender, relationshipType } = req.body;

    // Find the member to whom we want to add a spouse
    const member = await FamilyMember.findOne({ _id: memberId, treeId });
    if (!member) {
      return res.status(404).json({ message: "Member not found in this tree." });
    }

    // Create the spouse member
    const spouse = new FamilyMember({
      firstName,
      lastName,
      gender,
      treeId,
      role: 'spouse'
    });
    await spouse.save();

    // Add spouse relationship to both members
    member.spouses.push({ spouseId: spouse._id, relationshipType: relationshipType || 'spouse' });
    spouse.spouses.push({ spouseId: member._id, relationshipType: relationshipType || 'spouse' });
    await member.save();
    await spouse.save();

    // Add to tree members array
    await FamilyTree.findByIdAndUpdate(treeId, { $push: { members: spouse._id } });

    res.status(201).json({ spouse });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Add a child to a specific member in a specific tree.
 */
exports.addChild = async (req, res) => {
  try {
    const { treeId, memberId } = req.params;
    const { firstName, lastName, gender, motherId, fatherId } = req.body;

    // Find the member (should be one of the parents)
    const parent = await FamilyMember.findOne({ _id: memberId, treeId });
    if (!parent) {
      return res.status(404).json({ message: "Parent not found in this tree." });
    }

    // Ensure at least one parent is specified
    if (!motherId && !fatherId) {
      return res.status(400).json({ message: "At least one parent (motherId or fatherId) must be specified." });
    }

    // Create the child with given parents
    const child = new FamilyMember({
      firstName,
      lastName,
      gender,
      treeId,
      mother: motherId,
      father: fatherId,
      role: 'child'
    });
    await child.save();

    // Add child to parents' children arrays
    const parentIds = [];
    if (motherId) parentIds.push(motherId);
    if (fatherId) parentIds.push(fatherId);

    await FamilyMember.updateMany(
      { _id: { $in: parentIds } },
      { $push: { children: child._id } }
    );

    // Add to tree members array
    await FamilyTree.findByIdAndUpdate(treeId, { $push: { members: child._id } });

    res.status(201).json({ child });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get all family trees for a user.
 */
exports.getAllFamilyTreesForUser = async (req, res) => {
  try {
    let trees;
    if (req.user && req.user._id) {
      trees = await FamilyTree.find({ owner: req.user._id });
    } else if (req.guestSessionId) {
      trees = await FamilyTree.find({ guestSessionId: req.guestSessionId });
    } else {
      return res.status(401).json({ message: "Unauthorized: No user or guest session found." });
    }
    res.status(200).json(trees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Create a family tree (basic version).
 */
exports.createFamilyTree = async (req, res) => {
  try {
    const { name, description } = req.body;
    const tree = new FamilyTree({
      name,
      description,
      owner: req.user ? req.user._id : undefined,
      guestSessionId: req.guestSessionId,
      members: []
    });
    await tree.save();
    res.status(201).json(tree);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Update a family tree.
 */
exports.updateFamilyTree = async (req, res) => {
  try {
    const { treeId } = req.params;
    const { name, description } = req.body;

    const tree = await FamilyTree.findById(treeId);
    if (!tree) {
      return res.status(404).json({ message: "Tree not found." });
    }

    // Only the owner (or maybe session) can update
    if (req.user && tree.owner && req.user._id.toString() !== tree.owner.toString()) {
      return res.status(403).json({ message: "Access denied." });
    }
    if (req.guestSessionId && tree.guestSessionId !== req.guestSessionId) {
      return res.status(403).json({ message: "Access denied." });
    }

    tree.name = name || tree.name;
    tree.description = description || tree.description;
    await tree.save();

    res.status(200).json(tree);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Delete a family tree.
 */
exports.deleteFamilyTree = async (req, res) => {
  try {
    const { treeId } = req.params;
    const tree = await FamilyTree.findById(treeId);

    if (!tree) {
      return res.status(404).json({ message: "Tree not found." });
    }

    // Only the owner (or maybe session) can delete
    if (req.user && tree.owner && req.user._id.toString() !== tree.owner.toString()) {
      return res.status(403).json({ message: "Access denied." });
    }
    if (req.guestSessionId && tree.guestSessionId !== req.guestSessionId) {
      return res.status(403).json({ message: "Access denied." });
    }

    // Remove all related members
    await FamilyMember.deleteMany({ treeId: tree._id });

    // Remove the tree itself
    await FamilyTree.deleteOne({ _id: treeId });

    res.status(200).json({ message: "Tree and all its members deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};