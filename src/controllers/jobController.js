const db = require('../config/db');

exports.getJobs = async (req, res) => {
  try {
    // Extract filter parameters
    const { 
      skillsRequired, 
      status, 
      minBudget, 
      maxBudget, 
      location, 
      category_id,
      experienceLevel,
      jobType,
      proposals 
    } = req.query;
    
    let query = `
      SELECT j.*, 
        COALESCE(p.proposal_count, 0) AS proposal_count 
      FROM jobs j
      LEFT JOIN (
        SELECT job_id, COUNT(*) AS proposal_count 
        FROM proposals 
        GROUP BY job_id
      ) p ON j.id = p.job_id
      WHERE 1=1`;
      
    const params = [];
    let paramIndex = 1;
    
    // Apply filters if provided
    if (skillsRequired) {
      query += ` AND j.skills_required LIKE $${paramIndex}`;
      params.push(`%${skillsRequired}%`);
      paramIndex++;
    }
    
    if (status) {
      query += ` AND j.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (minBudget) {
      query += ` AND j.budget >= $${paramIndex}`;
      params.push(minBudget);
      paramIndex++;
    }
    
    if (maxBudget) {
      query += ` AND j.budget <= $${paramIndex}`;
      params.push(maxBudget);
      paramIndex++;
    }
    
    // New filters
    if (location) {
      query += ` AND j.location LIKE $${paramIndex}`;
      params.push(`%${location}%`);
      paramIndex++;
    }
    
    if (category_id) {
      query += ` AND j.category_id = $${paramIndex}`;
      params.push(category_id);
      paramIndex++;
    }
    
    if (experienceLevel) {
      query += ` AND j.experience_level = $${paramIndex}`;
      params.push(experienceLevel);
      paramIndex++;
    }
    
    if (jobType) {
      query += ` AND j.job_type = $${paramIndex}`;
      params.push(jobType);
      paramIndex++;
    }
    
    // Filter by number of proposals
    if (proposals) {
      if (proposals === 'less_than_5') {
        query += ` AND COALESCE(p.proposal_count, 0) < 5`;
      } else if (proposals === '5_to_10') {
        query += ` AND COALESCE(p.proposal_count, 0) BETWEEN 5 AND 10`;
      } else if (proposals === '20_to_50') {
        query += ` AND COALESCE(p.proposal_count, 0) BETWEEN 20 AND 50`;
      } else if (proposals === '50_plus') {
        query += ` AND COALESCE(p.proposal_count, 0) > 50`;
      }
    }
    
    // Add sorting
    query += ' ORDER BY j.created_at DESC';
    
    const result = await db.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Server error while fetching jobs' });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const jobId = req.params.jobId;

    const result = await db.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Server error while fetching job' });
  }
};

exports.createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      skills_required: skillsRequired,
      budget,
      clientId,
      category_id,
      location,
      experienceLevel,
      jobType
    } = req.body;

    // Authentication check removed - anyone can create a job

    // Validate client exists
    const clientExists = await db.query('SELECT * FROM users WHERE id = $1 AND user_type = $2', [clientId, 'client']);
    if (clientExists.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Check if client has sufficient balance to post the job
    // We'll charge a small fee (5% of budget) to post a job
    const jobPostingFee = budget * 0.05;

    const balanceCheck = await db.query('SELECT * FROM balances WHERE user_id = $1', [clientId]);

    // If client has no balance record or insufficient funds
    if (balanceCheck.rows.length === 0 || balanceCheck.rows[0].available_amount < jobPostingFee) {
      return res.status(400).json({
        error: 'Insufficient funds to post this job. We charge a 5% fee based on the budget.',
        currentBalance: balanceCheck.rows.length > 0 ? balanceCheck.rows[0].available_amount : 0,
        requiredAmount: jobPostingFee
      });
    }

    // Start transaction
    await db.query('BEGIN');

    // Deduct posting fee from client's balance
    await db.query(
      'UPDATE balances SET available_amount = available_amount - $1, last_updated = NOW() WHERE user_id = $2',
      [jobPostingFee, clientId]
    );

    // Set aside the job budget in pending amount
    await db.query(
      'UPDATE balances SET pending_amount = pending_amount + $1, last_updated = NOW() WHERE user_id = $2',
      [budget, clientId]
    );

    // Insert job with new fields
    const result = await db.query(
      `INSERT INTO jobs (
    client_id, 
    title, 
    description, 
    skills_required, 
    budget, 
    status, 
    category_id, 
    location,
    experience_level,
    job_type
  ) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
  RETURNING *`,
      [clientId, title, description, skillsRequired, budget, 'pending',
        category_id, location, experienceLevel, jobType]
    );

    // Record the transaction for the posting fee
    await db.query(
      'INSERT INTO transactions (user_id, job_id, transaction_type, amount, details) VALUES ($1, $2, $3, $4, $5)',
      [clientId, result.rows[0].id, 'job_posting_fee', jobPostingFee, JSON.stringify({
        jobId: result.rows[0].id,
        budget: budget,
        fee_percentage: 5
      })]
    );

    // Commit the transaction
    await db.query('COMMIT');

    // Get updated balance
    const updatedBalance = await db.query('SELECT * FROM balances WHERE user_id = $1', [clientId]);

    res.status(201).json({
      message: 'Job created successfully and pending approval',
      job: result.rows[0],
      balance: updatedBalance.rows[0]
    });
  } catch (error) {
    // Rollback the transaction if there's an error
    await db.query('ROLLBACK');
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Server error while creating job' });
  }
};

exports.approveJob = async (req, res) => {
  try {
    const jobId = req.params.jobId;

    const result = await db.query(
      'UPDATE jobs SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['approved', jobId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      message: 'Job approved successfully',
      job: result.rows[0]
    });
  } catch (error) {
    console.error('Error approving job:', error);
    res.status(500).json({ error: 'Server error while approving job' });
  }
};

exports.rejectJob = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const { feedback } = req.body;

    const result = await db.query(
      'UPDATE jobs SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['rejected', jobId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // We can store feedback in some other table if needed

    res.json({
      message: 'Job rejected successfully',
      job: result.rows[0]
    });
  } catch (error) {
    console.error('Error rejecting job:', error);
    res.status(500).json({ error: 'Server error while rejecting job' });
  }
};

exports.submitProposal = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const { freelancerId, proposalContent, timeline, bid } = req.body;

    // Check if job exists and is approved
    const jobCheck = await db.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    if (jobCheck.rows[0].status !== 'approved') {
      return res.status(400).json({ error: 'Cannot submit proposal for a job that is not approved' });
    }

    // Check if user is a freelancer
    const userCheck = await db.query('SELECT * FROM users WHERE id = $1', [freelancerId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Freelancer not found' });
    }
    if (userCheck.rows[0].user_type !== 'freelancer') {
      return res.status(400).json({ error: 'Only freelancers can submit proposals' });
    }

    // Check for connects
    const connectsCheck = await db.query('SELECT balance FROM connects WHERE user_id = $1', [freelancerId]);
    if (connectsCheck.rows.length === 0 || connectsCheck.rows[0].balance < 1) {
      return res.status(400).json({ error: 'Insufficient connects to submit proposal' });
    }

    // Check if already submitted a proposal for this job
    const existingProposal = await db.query(
      'SELECT * FROM proposals WHERE job_id = $1 AND freelancer_id = $2',
      [jobId, freelancerId]
    );
    if (existingProposal.rows.length > 0) {
      return res.status(400).json({ error: 'Already submitted a proposal for this job' });
    }

    // Deduct connects
    await db.query(
      'UPDATE connects SET balance = balance - 1, last_updated = NOW() WHERE user_id = $1',
      [freelancerId]
    );

    // Insert proposal
    const result = await db.query(
      'INSERT INTO proposals (job_id, freelancer_id, proposal_content, timeline, bid, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [jobId, freelancerId, proposalContent, timeline, bid, 'submitted']
    );

    res.status(201).json({
      message: 'Proposal submitted successfully',
      proposal: result.rows[0]
    });
  } catch (error) {
    console.error('Error submitting proposal:', error);
    res.status(500).json({ error: 'Server error while submitting proposal' });
  }
};

exports.getProposals = async (req, res) => {
  try {
    const jobId = req.params.jobId;

    // Check if job exists
    const jobCheck = await db.query('SELECT client_id FROM jobs WHERE id = $1', [jobId]);
    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const result = await db.query(
      'SELECT p.*, u.email as freelancer_email FROM proposals p JOIN users u ON p.freelancer_id = u.id WHERE p.job_id = $1 ORDER BY p.created_at DESC',
      [jobId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ error: 'Server error while fetching proposals' });
  }
};

exports.inviteFreelancer = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const { freelancerId } = req.body;

    // Check if job exists
    const jobCheck = await db.query('SELECT client_id FROM jobs WHERE id = $1', [jobId]);
    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user is a freelancer
    const userCheck = await db.query('SELECT * FROM users WHERE id = $1', [freelancerId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Freelancer not found' });
    }
    if (userCheck.rows[0].user_type !== 'freelancer') {
      return res.status(400).json({ error: 'Can only invite freelancers' });
    }

    // Check if already invited
    const existingInvitation = await db.query(
      'SELECT * FROM invitations WHERE job_id = $1 AND freelancer_id = $2',
      [jobId, freelancerId]
    );
    if (existingInvitation.rows.length > 0) {
      return res.status(400).json({ error: 'Freelancer already invited to this job' });
    }

    // Insert invitation
    const result = await db.query(
      'INSERT INTO invitations (job_id, freelancer_id, status) VALUES ($1, $2, $3) RETURNING *',
      [jobId, freelancerId, 'pending']
    );

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: result.rows[0]
    });
  } catch (error) {
    console.error('Error inviting freelancer:', error);
    res.status(500).json({ error: 'Server error while inviting freelancer' });
  }
};

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