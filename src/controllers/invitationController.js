const db = require('../config/db');

exports.getInvitations = async (req, res) => {
  try {
    const freelancerId = req.query.freelancerId || req.user.userId;
    
    const result = await db.query(
      `SELECT i.*, j.title as job_title, j.description as job_description, j.budget 
       FROM invitations i
       JOIN jobs j ON i.job_id = j.id
       WHERE i.freelancer_id = $1
       ORDER BY i.created_at DESC`,
      [freelancerId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ error: 'Server error while fetching invitations' });
  }
};

exports.respondToInvitation = async (req, res) => {
  try {
    const invitationId = req.params.invitationId;
    const { response, freelancerId } = req.body;
    
    // Validate response
    if (!['accepted', 'declined'].includes(response)) {
      return res.status(400).json({ error: 'Invalid response. Must be either "accepted" or "declined"' });
    }
    
    // Get invitation
    const invitationResult = await db.query(
      'SELECT * FROM invitations WHERE id = $1',
      [invitationId]
    );
    
    if (invitationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    
    const invitation = invitationResult.rows[0];
    
    // Ensure freelancer owns this invitation
    if (invitation.freelancer_id != freelancerId) {
      return res.status(403).json({ error: 'Forbidden: Cannot respond to invitation for another freelancer' });
    }
    
    // Update invitation status
    const result = await db.query(
      'UPDATE invitations SET status = $1 WHERE id = $2 RETURNING *',
      [response, invitationId]
    );
    
    // If accepted, potentially create a proposal automatically
    if (response === 'accepted') {
      // The frontend can redirect to proposal creation page
      // or we could auto-create a draft proposal here
    }
    
    res.json({
      message: `Invitation ${response}`,
      invitation: result.rows[0]
    });
  } catch (error) {
    console.error('Error responding to invitation:', error);
    res.status(500).json({ error: 'Server error while responding to invitation' });
  }
}; 