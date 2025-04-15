const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
// Keep imports but don't use the middleware
const { authenticate, authorizeRoles } = require('../middlewares/auth');

// Get user by ID - no authentication required
router.get('/:userId', userController.getUserById);

// Update user - no authentication required
router.put('/:userId', userController.updateUser);

// Suspend user - no authentication required
router.put('/:userId/suspend', userController.suspendUser);

// Ban user - no authentication required
router.put('/:userId/ban', userController.banUser);

module.exports = router; 