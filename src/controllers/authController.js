const bcrypt = require('bcrypt');
const db = require('../config/db');
// We'll still generate tokens, but they won't be checked
const { generateToken } = require('../utils/jwtUtils');

exports.signup = async (req, res) => {
  try {
    const { email, password, user_type } = req.body;
    
    // Validate user type
    if (!['freelancer', 'client', 'admin'].includes(user_type)) {
      return res.status(400).json({ error: 'Invalid user type' });
    }
    
    // Check if email already exists
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Insert user
    const result = await db.query(
      'INSERT INTO users (email, password_hash, user_type) VALUES ($1, $2, $3) RETURNING id, email, user_type, status, created_at',
      [email, passwordHash, user_type]
    );
    
    // Create connects entry for new user (only for freelancers)
    if (user_type === 'freelancer') {
      await db.query('INSERT INTO connects (user_id, balance) VALUES ($1, $2)', [result.rows[0].id, 10]);
    }
    
    // Generate dummy token (not required for auth anymore)
    const token = "dummy-token-for-testing";
    
    res.status(201).json({
      message: 'User created successfully',
      user: result.rows[0],
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ error: `Your account is ${user.status}` });
    }
    
    // Verify password (we'll keep this check)
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Return a dummy token (not required for auth anymore)
    const token = "dummy-token-for-testing";
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        status: user.status
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
}; 