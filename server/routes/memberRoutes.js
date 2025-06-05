const express = require('express');
// To access :treeId from the parent router (treeRoutes), we need mergeParams: true
const router = express.Router({ mergeParams: true });
const memberController = require('../controllers/memberController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes here are protected by authMiddleware and expect a :treeId from the parent router

// @route   POST /api/trees/:treeId/members
// @desc    Add a new member to a specific family tree
router.post('/', authMiddleware, memberController.addFamilyMember);

// @route   POST /api/trees/:treeId/members/add-child
// @desc    Add a child to the tree (requires at least one parentId in body)
router.post('/add-child', authMiddleware, memberController.addChild);

// @route   POST /api/trees/:treeId/members/:memberId/add-sibling
// @desc    Add a sibling for a member (parents will be auto-inherited)
router.post('/:memberId/add-sibling', authMiddleware, memberController.addSibling);

// @route   POST /api/trees/:treeId/members/:memberId/add-spouse
// @desc    Add a spouse for a member
router.post('/:memberId/add-spouse', authMiddleware, memberController.addSpouse);

// @route   GET /api/trees/:treeId/members
// @desc    Get all members of a specific family tree
router.get('/', authMiddleware, memberController.getFamilyMembersByTree);

// @route   GET /api/trees/:treeId/members/:memberId
// @desc    Get a specific family member by ID
router.get('/:memberId', authMiddleware, memberController.getFamilyMemberById);

// @route   PUT /api/trees/:treeId/members/:memberId
// @desc    Update a family member's details
router.put('/:memberId', authMiddleware, memberController.updateFamilyMember);

// @route   DELETE /api/trees/:treeId/members/:memberId
// @desc    Delete a family member
router.delete('/:memberId', authMiddleware, memberController.deleteFamilyMember);

// @route   DELETE /api/trees/:treeId/members/:memberId/delete-sibling
// @desc    Delete a sibling member
router.delete('/:memberId/delete-sibling', authMiddleware, memberController.deleteSibling);

module.exports = router;