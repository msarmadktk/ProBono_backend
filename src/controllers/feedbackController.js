const db = require('../config/db');

exports.submitFeedback = async (req, res) => {
  try {
    const { jobId, reviewerId, revieweeId, rating, comment, role } = req.body;
    
    // Validate required fields
    if (!jobId || !reviewerId || !revieweeId || !rating || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Remove authentication check - anyone can submit feedback
    
    // Validate role
    if (!['client', 'freelancer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be either "client" or "freelancer"' });
    }
    
    // Validate rating (1-5)
    if (rating < 0 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 0 and 5' });
    }
    
    // Check if job exists
    const jobCheck = await db.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Check if reviewer and reviewee exist
    const reviewerCheck = await db.query('SELECT * FROM users WHERE id = $1', [reviewerId]);
    if (reviewerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Reviewer not found' });
    }
    
    const revieweeCheck = await db.query('SELECT * FROM users WHERE id = $1', [revieweeId]);
    if (revieweeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Reviewee not found' });
    }
    
    // Check if feedback already exists
    const feedbackCheck = await db.query(
      'SELECT * FROM feedback WHERE job_id = $1 AND reviewer_id = $2 AND reviewee_id = $3',
      [jobId, reviewerId, revieweeId]
    );
    if (feedbackCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Feedback already submitted' });
    }
    
    // Start a transaction
    await db.query('BEGIN');
    
    // Insert feedback
    const result = await db.query(
      'INSERT INTO feedback (job_id, reviewer_id, reviewee_id, rating, comment, role, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
      [jobId, reviewerId, revieweeId, rating, comment, role]
    );
    
    // If the reviewee is a freelancer, update their average rating
    if (revieweeCheck.rows[0].user_type === 'freelancer') {
      // Get all ratings for this freelancer
      const ratingsResult = await db.query(
        'SELECT AVG(rating) as average_rating FROM feedback WHERE reviewee_id = $1',
        [revieweeId]
      );
      
      const averageRating = ratingsResult.rows[0].average_rating;
      
      // Update the freelancer's profile with the new average rating
      await db.query(
        'UPDATE profiles SET average_rating = $1, updated_at = NOW() WHERE user_id = $2',
        [averageRating, revieweeId]
      );
    }
    
    // Commit the transaction
    await db.query('COMMIT');
    
    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: result.rows[0]
    });
  } catch (error) {
    // Rollback the transaction if there's an error
    await db.query('ROLLBACK');
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Server error while submitting feedback' });
  }
};

exports.getUserFeedback = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const result = await db.query(
      `SELECT f.*, 
        j.title as job_title,
        reviewer.email as reviewer_email,
        reviewee.email as reviewee_email
      FROM feedback f
      JOIN jobs j ON f.job_id = j.id
      JOIN users reviewer ON f.reviewer_id = reviewer.id
      JOIN users reviewee ON f.reviewee_id = reviewee.id
      WHERE f.reviewee_id = $1
      ORDER BY f.created_at DESC`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user feedback:', error);
    res.status(500).json({ error: 'Server error while fetching user feedback' });
  }
}; 