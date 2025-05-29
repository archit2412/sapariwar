const express = require('express');
const router = express.Router();
const treeController = require('../controllers/treeController');
const authMiddleware = require('../middleware/authMiddleware');

// LMP 1. Import member routes
const memberRoutes = require('./memberRoutes');


// All routes in this file will be protected by authMiddleware

// @route   POST /api/trees
// @desc    Create a new family tree
router.post('/', authMiddleware, treeController.createFamilyTree);

// @route   GET /api/trees
// @desc    Get all family trees for the logged-in user
router.get('/', authMiddleware, treeController.getAllFamilyTreesForUser); // << UPDATED THIS LINE

// LMP 2. Mount member routes for a specific tree
// This will make routes like /api/trees/:treeId/members/... available
router.use('/:treeId/members', memberRoutes);


// @route   GET /api/trees/:treeId
// @desc    Get a specific family tree by ID
// @access  Private
router.get('/:treeId', authMiddleware, treeController.getFamilyTreeById);

// @route   PUT /api/trees/:treeId
// @desc    Update a family tree
// @access  Private
router.put('/:treeId', authMiddleware, treeController.updateFamilyTree);

// @route   DELETE /api/trees/:treeId
// @desc    Delete a family tree
// @access  Private
router.delete('/:treeId', authMiddleware, treeController.deleteFamilyTree);


module.exports = router;