const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
// Keep imports but don't use the middleware
const { authenticate } = require('../middlewares/auth');

// Submit feedback - no authentication required
router.post('/', feedbackController.submitFeedback);

// Get feedback for a user - no authentication required
router.get('/:userId', feedbackController.getUserFeedback);

module.exports = router; 