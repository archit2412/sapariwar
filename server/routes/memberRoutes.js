const express = require('express');
// Important: To access :treeId from the parent router (treeRoutes), we need mergeParams: true
const router = express.Router({ mergeParams: true });
const memberController = require('../controllers/memberController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes here are protected by authMiddleware and expect a :treeId from the parent router

// @route   POST /api/trees/:treeId/members
// @desc    Add a new member to a specific family tree
router.post('/', authMiddleware, memberController.addFamilyMember);

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


// --- Relationship Management Endpoints ---
// These also operate within the context of a :treeId and are protected

// @route   POST /api/trees/:treeId/members/:memberId/link-parent/:parentId
// @desc    Link a parent to a member
router.post('/:memberId/link-parent/:parentId', authMiddleware, memberController.linkParent);

// @route   POST /api/trees/:treeId/members/:memberId/link-spouse/:spouseMemberId
// @desc    Link a spouse to a member
router.post('/:memberId/link-spouse/:spouseMemberId', authMiddleware, memberController.linkSpouse);
// Add routes for unlinking if needed

module.exports = router;