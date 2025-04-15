const db = require('../config/db');

exports.getBalance = async (req, res) => {
  try {
    const userId = req.query.userId || req.user.userId;
    
    const result = await db.query('SELECT * FROM balances WHERE user_id = $1', [userId]);
    
    if (result.rows.length === 0) {
      // If no balance record exists, create one with zero balance
      const newBalance = await db.query(
        'INSERT INTO balances (user_id, available_amount, pending_amount) VALUES ($1, $2, $3) RETURNING *',
        [userId, 0.00, 0.00]
      );
      return res.json(newBalance.rows[0]);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ error: 'Server error while fetching balance' });
  }
};

exports.addFunds = async (req, res) => {
  try {
    const { userId, amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    // Start transaction
    await db.query('BEGIN');
    
    // Check if user has a balance record
    const balanceCheck = await db.query('SELECT * FROM balances WHERE user_id = $1', [userId]);
    
    let result;
    if (balanceCheck.rows.length === 0) {
      // Create new balance record
      result = await db.query(
        'INSERT INTO balances (user_id, available_amount) VALUES ($1, $2) RETURNING *',
        [userId, amount]
      );
    } else {
      // Update existing balance
      result = await db.query(
        'UPDATE balances SET available_amount = available_amount + $1, last_updated = NOW() WHERE user_id = $2 RETURNING *',
        [amount, userId]
      );
    }
    
    // Use 'other' as the transaction type which is allowed by the constraint
    await db.query(
      'INSERT INTO transactions (user_id, transaction_type, amount, details) VALUES ($1, $2, $3, $4)',
      [userId, 'other', amount, JSON.stringify({ method: 'deposit', type: 'add_funds' })]
    );
    
    // Commit transaction
    await db.query('COMMIT');
    
    res.status(200).json({
      message: 'Funds added successfully',
      balance: result.rows[0]
    });
  } catch (error) {
    // Rollback on error
    await db.query('ROLLBACK');
    console.error('Error adding funds:', error);
    res.status(500).json({ error: 'Server error while adding funds' });
  }
};

exports.withdrawFunds = async (req, res) => {
  try {
    const { userId, amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    // Check if user has sufficient balance
    const balanceCheck = await db.query('SELECT * FROM balances WHERE user_id = $1', [userId]);
    
    if (balanceCheck.rows.length === 0 || balanceCheck.rows[0].available_amount < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Start transaction
    await db.query('BEGIN');
    
    // Update balance
    const result = await db.query(
      'UPDATE balances SET available_amount = available_amount - $1, last_updated = NOW() WHERE user_id = $2 RETURNING *',
      [amount, userId]
    );
    
    // Record transaction - Changed 'withdrawal' to 'other' to match allowed transaction types
    await db.query(
      'INSERT INTO transactions (user_id, transaction_type, amount, details) VALUES ($1, $2, $3, $4)',
      [userId, 'other', amount, JSON.stringify({ method: 'withdrawal', type: 'withdraw_funds' })]
    );
    
    // Commit transaction
    await db.query('COMMIT');
    
    res.status(200).json({
      message: 'Withdrawal successful',
      balance: result.rows[0]
    });
  } catch (error) {
    // Rollback on error
    await db.query('ROLLBACK');
    console.error('Error withdrawing funds:', error);
    res.status(500).json({ error: 'Server error while withdrawing funds' });
  }
}; 