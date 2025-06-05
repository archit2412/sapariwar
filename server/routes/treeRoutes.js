const express = require('express');
const router = express.Router();
const treeController = require('../controllers/treeController');
const authMiddleware = require('../middleware/authMiddleware');
const memberRoutes = require('./memberRoutes');

// All routes in this file will be protected by authMiddleware

// @route   POST /api/trees
// @desc    Create a new family tree
router.post('/', authMiddleware, treeController.createFamilyTree);

// @route   GET /api/trees
// @desc    Get all family trees for the logged-in user
router.get('/', authMiddleware, treeController.getAllFamilyTreesForUser);

// Mount member routes for members of a specific tree
router.use('/:treeId/members', memberRoutes);

// @route   GET /api/trees/:treeId
// @desc    Get a specific family tree by ID
router.get('/:treeId', authMiddleware, treeController.getFamilyTreeById);

// @route   PUT /api/trees/:treeId
// @desc    Update a family tree
router.put('/:treeId', authMiddleware, treeController.updateFamilyTree);

// @route   DELETE /api/trees/:treeId
// @desc    Delete a family tree
router.delete('/:treeId', authMiddleware, treeController.deleteFamilyTree);

// @route   POST /api/trees/createWithInitialMembers
// @desc    Create a tree with self, mother, father together
router.post('/createWithInitialMembers', authMiddleware, treeController.createTreeWithInitialMembers);

module.exports = router;