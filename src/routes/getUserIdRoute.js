const express = require('express');
const router = express.Router();
const getUserIdController = require('../controllers/getUserIdController');

// POST /api/getUserId
router.post('/', getUserIdController.getUserId);

module.exports = router;
