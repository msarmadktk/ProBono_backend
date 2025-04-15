const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
// Keep imports but don't use the middleware
const { authenticate, authorizeRoles } = require('../middlewares/auth');

// Get all jobs with optional filters
router.get('/', jobController.getJobs);

// Get job by ID
router.get('/:jobId', jobController.getJobById);

// Create a new job - no authentication required
router.post('/', jobController.createJob);

// Approve a job - no authentication required
router.put('/:jobId/approve', jobController.approveJob);

// Reject a job - no authentication required
router.put('/:jobId/reject', jobController.rejectJob);

// Submit a proposal for a job - no authentication required
router.post('/:jobId/proposals', jobController.submitProposal);

// Get proposals for a job - no authentication required
router.get('/:jobId/proposals', jobController.getProposals);

// Invite a freelancer to a job - no authentication required
router.post('/:jobId/invite', jobController.inviteFreelancer);

module.exports = router; 