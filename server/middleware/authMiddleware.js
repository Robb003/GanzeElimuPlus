const jwt = require('jsonwebtoken');
const User = require('../models/User');

// TOKEN VERIFICATION MIDDLEWARE (The Main Security Guard)
const protect = async (req, res, next) => {
  let token;

  // 1. Check if the request contains an authorization header formatted as 'Bearer <token>'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Isolate the pure token string from the 'Bearer' prefix
      token = req.headers.authorization.split(' ')[1];

      // Decode and verify the token using your private system signature secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Hydrate the request object with the fully authenticated user profile from MongoDB
      // CRITICAL ANTI-CORRUPTION SECURITY: We explicitly exclude the passwordHash payload for safety
      req.user = await User.findById(decoded.id).select('-passwordHash');
      
      return next(); // Token is perfectly valid, allow the user to proceed to the controller!
    } catch (error) {
      console.error("JWT Security Interception Error:", error.message);
      return res.status(401).json({ message: 'Session expired or token verification failed. Access denied.' });
    }
  }

  // 2. Catch instances where the authorization token payload is missing entirely
  if (!token) {
    return res.status(401).json({ message: 'Authentication failed. Secure token required to pass gateway.' });
  }
};

//ROLE-BASED ACCESS CONTROL (RBAC) AUTHORIZER
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // If the authenticated user's role is not within the authorized parameter array, block execution instantly
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access Denied. Your system profile role [${req.user.role}] does not have clearance to interact with this resource.` 
      });
    }
    next(); // Access clearance granted, push to execution loop!
  };
};

module.exports = { protect, authorizeRoles };
