const db = require('../config/db');

exports.getUserWorkHistory = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Validate that user exists
    const userCheck = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get work history entries
    const result = await db.query(
      'SELECT * FROM work_history WHERE user_id = $1 ORDER BY start_date DESC',
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching work history:', error);
    res.status(500).json({ error: 'Server error while fetching work history' });
  }
};

exports.createWorkHistoryEntry = async (req, res) => {
  try {
    const { userId, companyName, position, startDate, endDate, description, isCurrent } = req.body;
    
    // Validate required fields
    if (!userId || !companyName || !position || !startDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate that user exists
    const userCheck = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If current position, set endDate to null
    const finalEndDate = isCurrent ? null : endDate;
    
    // Insert the work history entry
    const result = await db.query(
      `INSERT INTO work_history 
       (user_id, company_name, position, start_date, end_date, description, is_current) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [userId, companyName, position, startDate, finalEndDate, description, isCurrent]
    );
    
    res.status(201).json({
      message: 'Work history entry created successfully',
      entry: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating work history entry:', error);
    res.status(500).json({ error: 'Server error while creating work history entry' });
  }
};

exports.updateWorkHistoryEntry = async (req, res) => {
  try {
    const entryId = req.params.entryId;
    const { companyName, position, startDate, endDate, description, isCurrent } = req.body;
    
    // Check if entry exists
    const entryCheck = await db.query('SELECT * FROM work_history WHERE id = $1', [entryId]);
    if (entryCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Work history entry not found' });
    }
    
    // If current position, set endDate to null
    let finalEndDate = endDate;
    if (isCurrent !== undefined && isCurrent) {
      finalEndDate = null;
    }
    
    // Update the entry
    const result = await db.query(
      `UPDATE work_history
       SET company_name = COALESCE($1, company_name),
           position = COALESCE($2, position),
           start_date = COALESCE($3, start_date),
           end_date = $4,
           description = COALESCE($5, description),
           is_current = COALESCE($6, is_current)
       WHERE id = $7
       RETURNING *`,
      [companyName, position, startDate, finalEndDate, description, isCurrent, entryId]
    );
    
    res.json({
      message: 'Work history entry updated successfully',
      entry: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating work history entry:', error);
    res.status(500).json({ error: 'Server error while updating work history entry' });
  }
};

exports.deleteWorkHistoryEntry = async (req, res) => {
  try {
    const entryId = req.params.entryId;
    
    // Check if entry exists
    const entryCheck = await db.query('SELECT * FROM work_history WHERE id = $1', [entryId]);
    if (entryCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Work history entry not found' });
    }
    
    // Delete the entry
    await db.query('DELETE FROM work_history WHERE id = $1', [entryId]);
    
    res.json({
      message: 'Work history entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting work history entry:', error);
    res.status(500).json({ error: 'Server error while deleting work history entry' });
  }
}; 