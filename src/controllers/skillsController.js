const db = require('../config/db');

// Get all unique skills across all profiles
exports.getAllSkills = async (req, res) => {
  try {
    const result = await db.query('SELECT skills FROM profiles WHERE skills IS NOT NULL');

    // Combine and deduplicate skills
    const allSkills = new Set();
    result.rows.forEach(row => {
      try {
        const skillList = JSON.parse(row.skills); // If it's stored as a JSON array
        skillList.forEach(skill => allSkills.add(skill.trim()));
      } catch {
        const skillList = row.skills.split(','); // fallback for CSV
        skillList.forEach(skill => allSkills.add(skill.trim()));
      }
    });

    res.json([...allSkills]);
  } catch (error) {
    console.error('Error getting all skills:', error);
    res.status(500).json({ error: 'Server error while fetching skills' });
  }
};

// Get skills for a specific user
exports.getUserSkills = async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await db.query('SELECT skills FROM profiles WHERE user_id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const skills = result.rows[0].skills;

    let parsedSkills;
    try {
      parsedSkills = JSON.parse(skills);
    } catch {
      parsedSkills = skills.split(',').map(s => s.trim());
    }

    res.json(parsedSkills);
  } catch (error) {
    console.error('Error getting user skills:', error);
    res.status(500).json({ error: 'Server error while fetching user skills' });
  }
};

// Update skills for a user
exports.updateUserSkills = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { skills } = req.body;

    if (!Array.isArray(skills)) {
      return res.status(400).json({ error: 'Skills must be an array of strings' });
    }

    const skillString = JSON.stringify(skills);

    const result = await db.query(
      'UPDATE profiles SET skills = $1, updated_at = NOW() WHERE user_id = $2 RETURNING skills',
      [skillString, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json({
      message: 'Skills updated successfully',
      skills: JSON.parse(result.rows[0].skills)
    });
  } catch (error) {
    console.error('Error updating user skills:', error);
    res.status(500).json({ error: 'Server error while updating skills' });
  }
};


exports.deleteUserSkill = async (req, res) => {
    try {
      const userId = req.params.userId;
      const skillToRemove = req.params.skill.trim().toLowerCase();

  
      const profile = await db.query('SELECT skills FROM profiles WHERE user_id = $1', [userId]);
  
      if (profile.rows.length === 0) {
        return res.status(404).json({ error: 'Profile not found' });
      }
  
      let currentSkills;
      try {
        currentSkills = JSON.parse(profile.rows[0].skills);
      } catch {
        currentSkills = profile.rows[0].skills.split(',').map(s => s.trim());
      }
  
      const updatedSkills = currentSkills.filter(
        skill => skill.trim().toLowerCase() !== skillToRemove
      );
      
  
      const result = await db.query(
        'UPDATE profiles SET skills = $1, updated_at = NOW() WHERE user_id = $2 RETURNING skills',
        [JSON.stringify(updatedSkills), userId]
      );
  
      res.json({
        message: `Skill '${skillToRemove}' removed successfully`,
        skills: JSON.parse(result.rows[0].skills)
      });
    } catch (error) {
      console.error('Error removing skill:', error);
      res.status(500).json({ error: 'Server error while removing skill' });
    }
  };
  