const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Token Generator 
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

//  Register logic endpoint
exports.registerUser = async (req, res) => {
  const { phoneNumber, password, fullName, nationalID, birthCertificateNumber, ward, village } = req.body;

  try {
    // Enforce that at least one ID method is provided
    if (!nationalID && !birthCertificateNumber) {
      return res.status(400).json({ 
        message: 'Registration failed. You must provide either a National ID or a Birth Certificate number.' 
      });
    }

    // Double check if account identifier already exists
    const userExists = await User.findOne({ phoneNumber });
    if (userExists) {
      return res.status(400).json({ message: 'A profile with this phone number already exists.' });
    }

    // Encrypt and Hash the raw user password using Bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Commit the fresh user record to MongoDB cluster
    const user = await User.create({
      phoneNumber,
      passwordHash,
      role: 'applicant', // Hardcoded default to prevent privilege escalation attacks
      profile: {
        fullName,
        nationalID: nationalID || null,
        birthCertificateNumber: birthCertificateNumber || null,
        ward,
        village
      }
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        fullName: user.profile.fullName,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user registration data provided.' });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login logic endpoint
exports.loginUser = async (req, res) => {
  const { phoneNumber, password } = req.body;

  try {
    // Locate the account via phone identifier
    const user = await User.findOne({ phoneNumber });

    // Comparison on the provided string against the database hash
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      res.json({
        _id: user._id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        fullName: user.profile.fullName,
        ward: user.profile.ward,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid phone number or secret password match.' });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 

// getUser profile endpoint logic
exports.getUserProfile = async (req, res) => {
  try {
    
    const user = await User.findById(req.user.id).select('-passwordHash');
    
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User profile matrix not found.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
