const express = require('express');
const router = express.Router();
const digitalProductController = require('../controllers/digitalProductController');

// Get all digital products (can filter by userId)
router.get('/', digitalProductController.getDigitalProducts);

// Get digital product by ID
router.get('/:productId', digitalProductController.getDigitalProductById);

// Create digital product
router.post('/', digitalProductController.createDigitalProduct);

// Update digital product
router.put('/:productId', digitalProductController.updateDigitalProduct);

// Delete digital product
router.delete('/:productId', digitalProductController.deleteDigitalProduct);

// Submit product review
router.post('/:productId/reviews', digitalProductController.submitProductReview);

module.exports = router; 