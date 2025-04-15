const db = require('../config/db');

exports.getConnectsBalance = async (req, res) => {
  try {
    const userId = req.query.userId || req.user.userId;
    
    // Authentication check removed - anyone can view connects balance
    
    const result = await db.query('SELECT * FROM connects WHERE user_id = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Connects record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching connects balance:', error);
    res.status(500).json({ error: 'Server error while fetching connects balance' });
  }
};

exports.purchaseConnects = async (req, res) => {
  try {
    const { userId, packageDetails } = req.body;
    
    // Authentication check removed - anyone can purchase connects
    
    // Validate package details
    if (!packageDetails || !packageDetails.amount || !packageDetails.price) {
      return res.status(400).json({ error: 'Invalid package details' });
    }
    
    // Check if user has sufficient balance
    const balanceCheck = await db.query('SELECT * FROM balances WHERE user_id = $1', [userId]);
    
    // If user has no balance record or insufficient funds
    if (balanceCheck.rows.length === 0 || balanceCheck.rows[0].available_amount < packageDetails.price) {
      return res.status(400).json({ 
        error: 'Insufficient funds. Please add funds to your account.',
        currentBalance: balanceCheck.rows.length > 0 ? balanceCheck.rows[0].available_amount : 0,
        requiredAmount: packageDetails.price
      });
    }
    
    // Start a transaction
    await db.query('BEGIN');
    
    // Deduct the amount from user's balance
    await db.query(
      'UPDATE balances SET available_amount = available_amount - $1, last_updated = NOW() WHERE user_id = $2',
      [packageDetails.price, userId]
    );
    
    // Add connects to user's balance
    const connectsResult = await db.query(
      'UPDATE connects SET balance = balance + $1, last_updated = NOW() WHERE user_id = $2 RETURNING *',
      [packageDetails.amount, userId]
    );
    
    let finalConnectsResult = connectsResult;
    
    if (connectsResult.rows.length === 0) {
      // If no connects record exists, create one
      const newConnectsResult = await db.query(
        'INSERT INTO connects (user_id, balance) VALUES ($1, $2) RETURNING *',
        [userId, packageDetails.amount]
      );
      finalConnectsResult = newConnectsResult;
    }
    
    // Record the transaction
    const transactionResult = await db.query(
      'INSERT INTO transactions (user_id, transaction_type, amount, details) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, 'connect_purchase', packageDetails.price, JSON.stringify(packageDetails)]
    );
    
    // Commit the transaction
    await db.query('COMMIT');
    
    // Get updated balance
    const updatedBalance = await db.query('SELECT * FROM balances WHERE user_id = $1', [userId]);
    
    res.status(201).json({
      message: 'Connects purchased successfully',
      transaction: transactionResult.rows[0],
      connects: finalConnectsResult.rows[0],
      balance: updatedBalance.rows[0]
    });
  } catch (error) {
    // Rollback the transaction if there's an error
    await db.query('ROLLBACK');
    console.error('Error purchasing connects:', error);
    res.status(500).json({ error: 'Server error while purchasing connects' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const userId = req.query.userId || req.user.userId;
    
    // Authentication check removed - anyone can view transactions
    
    const result = await db.query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY transaction_date DESC',
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Server error while fetching transactions' });
  }
};

exports.processRevenueShare = async (req, res) => {
  try {
    const { jobId, freelancerId, amount } = req.body;
    
    // Authentication check removed - anyone can process revenue share
    
    // Check if job exists
    const jobCheck = await db.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const clientId = jobCheck.rows[0].client_id;
    const jobBudget = jobCheck.rows[0].budget;
    
    // Check if freelancer exists
    const freelancerCheck = await db.query('SELECT * FROM users WHERE id = $1 AND user_type = $2', [freelancerId, 'freelancer']);
    if (freelancerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Freelancer not found' });
    }
    
    // Check if client has sufficient pending amount
    const clientBalance = await db.query('SELECT * FROM balances WHERE user_id = $1', [clientId]);
    if (clientBalance.rows.length === 0 || clientBalance.rows[0].pending_amount < amount) {
      return res.status(400).json({ 
        error: 'Insufficient pending funds for this payment',
        currentPendingBalance: clientBalance.rows.length > 0 ? clientBalance.rows[0].pending_amount : 0,
        requiredAmount: amount
      });
    }
    
    // Calculate platform fee (10%)
    const platformFee = amount * 0.10;
    const freelancerAmount = amount - platformFee;
    
    // Start a transaction
    await db.query('BEGIN');
    
    // Reduce pending amount from client
    await db.query(
      'UPDATE balances SET pending_amount = pending_amount - $1, last_updated = NOW() WHERE user_id = $2',
      [amount, clientId]
    );
    
    // Add funds to freelancer (minus platform fee)
    const freelancerBalance = await db.query('SELECT * FROM balances WHERE user_id = $1', [freelancerId]);
    
    if (freelancerBalance.rows.length === 0) {
      // Create balance record for freelancer
      await db.query(
        'INSERT INTO balances (user_id, available_amount) VALUES ($1, $2)',
        [freelancerId, freelancerAmount]
      );
    } else {
      // Update existing balance
      await db.query(
        'UPDATE balances SET available_amount = available_amount + $1, last_updated = NOW() WHERE user_id = $2',
        [freelancerAmount, freelancerId]
      );
    }
    
    // Record the transaction for the freelancer
    const transactionResult = await db.query(
      'INSERT INTO transactions (user_id, job_id, transaction_type, amount, details) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [freelancerId, jobId, 'revenue_share', freelancerAmount, JSON.stringify({ 
        jobId, 
        originalAmount: amount,
        platformFee,
        freelancerAmount
      })]
    );
    
    // Record platform fee transaction
    await db.query(
      'INSERT INTO transactions (user_id, job_id, transaction_type, amount, details) VALUES ($1, $2, $3, $4, $5)',
      [clientId, jobId, 'platform_fee', platformFee, JSON.stringify({ 
        jobId, 
        originalAmount: amount,
        platformFee
      })]
    );
    
    // Update job status to completed if not already
    await db.query(
      'UPDATE jobs SET status = $1, updated_at = NOW() WHERE id = $2 AND status != $3',
      ['closed', jobId, 'closed']
    );
    
    // Commit the transaction
    await db.query('COMMIT');
    
    // Get updated balances
    const updatedFreelancerBalance = await db.query('SELECT * FROM balances WHERE user_id = $1', [freelancerId]);
    const updatedClientBalance = await db.query('SELECT * FROM balances WHERE user_id = $1', [clientId]);
    
    res.status(201).json({
      message: 'Revenue share processed successfully',
      transaction: transactionResult.rows[0],
      freelancerBalance: updatedFreelancerBalance.rows[0],
      clientBalance: updatedClientBalance.rows[0]
    });
  } catch (error) {
    // Rollback the transaction if there's an error
    await db.query('ROLLBACK');
    console.error('Error processing revenue share:', error);
    res.status(500).json({ error: 'Server error while processing revenue share' });
  }
}; 