const db = require('../config/db');

exports.getLearningCourses = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM learningcourses ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching learning courses:', error);
    res.status(500).json({ error: 'Server error while fetching learning courses' });
  }
};

exports.enrollCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user.userId; // From JWT token
    
    // Check if course exists
    const courseCheck = await db.query('SELECT * FROM learningcourses WHERE id = $1', [courseId]);
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Check if already enrolled
    const enrollmentCheck = await db.query(
      'SELECT * FROM courseenrollments WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );
    if (enrollmentCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }
    
    // Create enrollment
    const result = await db.query(
      'INSERT INTO courseenrollments (user_id, course_id, status) VALUES ($1, $2, $3) RETURNING *',
      [userId, courseId, 'enrolled']
    );
    
    res.status(201).json({
      message: 'Successfully enrolled in course',
      enrollment: result.rows[0]
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({ error: 'Server error while enrolling in course' });
  }
}; 