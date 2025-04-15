const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');

// Get invitations for a freelancer
router.get('/', invitationController.getInvitations);

// Accept or decline an invitation
router.put('/:invitationId/respond', invitationController.respondToInvitation);

module.exports = router; 