const pool = require('../config/db');

exports.getUserId = async (req, res) => {
  const { email } = req.body;

  try {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = result.rows[0].id;
    res.json({ userId });
  } catch (err) {
    console.error('Error fetching user ID:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
