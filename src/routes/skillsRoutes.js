const express = require('express');
const router = express.Router();
const skillsController = require('../controllers/skillsController');

router.get('/', skillsController.getAllSkills);
router.get('/:userId', skillsController.getUserSkills);
router.put('/:userId', skillsController.updateUserSkills);
router.delete('/:userId/:skill', skillsController.deleteUserSkill);


module.exports = router;
