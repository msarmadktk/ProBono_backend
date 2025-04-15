const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financialController');
// Keep imports but don't use the middleware
const { authenticate, authorizeRoles } = require('../middlewares/auth');

// Get connects balance - no authentication required
router.get('/connects', financialController.getConnectsBalance);

// Purchase connects - no authentication required
router.post('/connects/purchase', financialController.purchaseConnects);

// Get transactions - no authentication required
router.get('/transactions', financialController.getTransactions);

// Process revenue share - no authentication required
router.post('/revenue-share', financialController.processRevenueShare);

module.exports = router; 