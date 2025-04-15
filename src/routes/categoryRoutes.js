const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// GET all categories
router.get('/getAllCategories', categoryController.getAllCategories);

// POST - get category ID by name
router.post('/getCategoryIdByName', categoryController.getCategoryIdByName);

// POST - get category name by ID
router.post('/getCategoryNameById', categoryController.getCategoryNameById);

module.exports = router;
