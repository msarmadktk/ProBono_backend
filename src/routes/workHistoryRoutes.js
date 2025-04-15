const express = require('express');
const router = express.Router();
const workHistoryController = require('../controllers/workHistoryController');

// Get a user's work history
router.get('/:userId', workHistoryController.getUserWorkHistory);

// Add a new work history entry
router.post('/', workHistoryController.createWorkHistoryEntry);

// Update a work history entry
router.put('/:entryId', workHistoryController.updateWorkHistoryEntry);

// Delete a work history entry
router.delete('/:entryId', workHistoryController.deleteWorkHistoryEntry);

module.exports = router; 