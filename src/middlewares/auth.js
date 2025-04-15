const { verifyToken } = require('../utils/jwtUtils');

const authenticate = (req, res, next) => {
  // Bypass authentication - set a default user for development
  req.user = {
    userId: 1,  // Default user ID
    userType: 'admin'  // Give admin rights by default for testing
  };
  next();
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Bypass role checks - allow all actions
    next();
  };
};

module.exports = {
  authenticate,
  authorizeRoles
}; 