const express = require('express');
const router = express.Router();
const balanceController = require('../controllers/balanceController');

// Get balance
router.get('/', balanceController.getBalance);

// Add funds
router.post('/add', balanceController.addFunds);

// Withdraw funds
router.post('/withdraw', balanceController.withdrawFunds);

module.exports = router; 