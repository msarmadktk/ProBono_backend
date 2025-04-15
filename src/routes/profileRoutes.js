const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
// Keep imports but don't use the middleware
const { authenticate } = require('../middlewares/auth');

// Create profile - no authentication required
router.post('/', profileController.createProfile);

// Get profile by user ID - no authentication required
router.get('/:userId', profileController.getProfile);

// Update profile by user ID - no authentication required
router.put('/:userId', profileController.updateProfile);

// Add portfolio item - no authentication required
router.post('/:userId/portfolio', profileController.addPortfolioItem);

// Get portfolio items - no authentication required
router.get('/:userId/portfolio', profileController.getPortfolioItems);

module.exports = router; 