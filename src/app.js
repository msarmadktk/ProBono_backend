const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const profileRoutes = require('./routes/profileRoutes');
const jobRoutes = require('./routes/jobRoutes');
const learningRoutes = require('./routes/learningRoutes');
const financialRoutes = require('./routes/financialRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const invitationRoutes = require('./routes/invitationRoutes');
const balanceRoutes = require('./routes/balanceRoutes');
const digitalProductRoutes = require('./routes/digitalProductRoutes');
const workHistoryRoutes = require('./routes/workHistoryRoutes');

const userIdRoute = require('./routes/getUserIdRoute');
const categoryRoutes = require('./routes/categoryRoutes');
// Initialize the app
const app = express();

// Middleware
app.use(helmet()); // Set security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded bodies

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/learning-courses', learningRoutes);
app.use('/api/payments', financialRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/balances', balanceRoutes);
app.use('/api/digital-products', digitalProductRoutes);
app.use('/api/work-history', workHistoryRoutes);

app.use('/api/getUserId', userIdRoute);
app.use('/api/categories', categoryRoutes);


// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Pro Bono Work API' });
});

// Handle 404 routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error' });
});

module.exports = app; 