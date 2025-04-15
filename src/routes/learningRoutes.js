const express = require('express');
const router = express.Router();
const learningController = require('../controllers/learningController');
// Keep imports but don't use the middleware
const { authenticate } = require('../middlewares/auth');

// Get all learning courses - no authentication required
router.get('/', learningController.getLearningCourses);

// Enroll in a course - no authentication required
router.post('/:courseId/enroll', learningController.enrollCourse);

module.exports = router; 