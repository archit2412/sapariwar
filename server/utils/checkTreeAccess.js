const FamilyTree = require('../models/FamilyTree');

/**
 * Checks if the requesting user (authenticated or guest) has access to a specific tree.
 *
 * @param {string} treeId - The MongoDB ObjectId string of the tree to check.
 * @param {object} req - The Express request object.
 *                       It's expected to have `req.user` (with `req.user.id`) if authenticated,
 *                       or `req.guestSessionId` if it's a guest session.
 * @param {boolean} writeAccessRequired - (Currently unused in this basic version, but can be extended)
 *                                        Indicates if write-level access is being checked.
 *                                        For now, owner/guest either has access or doesn't.
 * @returns {Promise<FamilyTree|null>}
 *          Resolves with the tree object if access is granted.
 *          Resolves with `null` if the tree is not found or access is denied.
 *          Rejects with an error for unexpected issues.
 */
async function checkTreeAccess(treeId, req, writeAccessRequired = false) {
  if (!mongoose.Types.ObjectId.isValid(treeId)) {
    console.warn(`checkTreeAccess: Invalid treeId format: ${treeId}`);
    return null; // Invalid ObjectId format
  }

  try {
    const tree = await FamilyTree.findById(treeId);

    if (!tree) {
      return null; // Tree not found
    }

    let hasAccess = false;

    // Case 1: Authenticated user is the owner of the tree
    if (req.user && req.user.id && tree.owner && tree.owner.equals(req.user.id)) {
      hasAccess = true;
    }
    // Case 2: Guest session matches the tree's guestSessionId, and the tree is not yet claimed (no owner)
    else if (req.guestSessionId && tree.guestSessionId === req.guestSessionId && !tree.owner) {
      hasAccess = true;
    }
    // Case 3: Tree is public (and it's a read operation - writeAccessRequired is false)
    // This part is for future extension if you implement public read access.
    // else if (tree.privacy === 'public' && !writeAccessRequired) {
    //   hasAccess = true;
    // }

    if (hasAccess) {
      // Optionally, attach the found tree to the request object if you find it convenient
      // in subsequent controller logic, though returning it is the primary goal here.
      // req.tree = tree;
      return tree; // Access granted, return the tree document
    }

    return null; // Access denied
  } catch (error) {
    console.error(`Error in checkTreeAccess for treeId ${treeId}:`, error);
    // Rethrow the error or handle it as appropriate for your application
    // For now, let's return null to indicate failure to determine access due to an error.
    // throw error; // Or:
    return null;
  }
}

// You'll need mongoose to check ObjectId validity
const mongoose = require('mongoose');

module.exports = { checkTreeAccess }; 