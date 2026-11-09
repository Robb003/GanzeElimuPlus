
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// TOKEN VERIFICATION MIDDLEWARE
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !/^Bearer\s+\S+$/i.test(authHeader)) {
    return res.status(401).json({
      message: 'Authentication failed. Secure token required.'
    });
  }

  try {
    const token = authHeader.split(/\s+/)[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id)
      .select('-passwordHash');

    if (!user) {
      return res.status(401).json({
        message: 'Account no longer exists. Access denied.'
      });
    }

    req.user = user;

    return next();

  } catch (error) {
    return res.status(401).json({
      message: 'Session expired or token verification failed. Access denied.'
    });
  }
};

// ROLE-BASED ACCESS CONTROL
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied. You do not have permission to access this resource.'
      });
    }

    return next();
  };
};

module.exports = { protect, authorizeRoles };
