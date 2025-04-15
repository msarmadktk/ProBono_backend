const db = require('../config/db');

exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const result = await db.query(
      'SELECT id, email, user_type, status, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Server error while fetching user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Authentication check removed - anyone can update any user
    
    // Allowable fields to update
    const { email } = req.body;
    
    // Update user
    const result = await db.query(
      'UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, user_type, status, created_at, updated_at',
      [email, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Server error while updating user' });
  }
};

exports.suspendUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const result = await db.query(
      'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, user_type, status, created_at, updated_at',
      ['suspended', userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      message: 'User suspended successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({ error: 'Server error while suspending user' });
  }
};

exports.banUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const result = await db.query(
      'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, user_type, status, created_at, updated_at',
      ['banned', userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      message: 'User banned successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ error: 'Server error while banning user' });
  }
}; 