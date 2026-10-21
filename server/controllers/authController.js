const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Token Generator 
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

//  Register logic endpoint

exports.registerUser = async (req, res) => {
  const {
    phoneNumber,
    password,
    role,
    fullName,
    nationalID,
    birthCertificateNumber,
    ward,
    village
  } = req.body;

  try {
    // Require exactly one identification document
    const hasNationalID = Boolean(nationalID?.trim());
    const hasBirthCertificate = Boolean(birthCertificateNumber?.trim());

    if (hasNationalID === hasBirthCertificate) {
      return res.status(400).json({
        message:
          'Provide exactly one: National ID or Birth Certificate number.'
      });
    }

    // Validate required fields
    if (
      !phoneNumber?.trim() ||
      !password ||
      !fullName?.trim() ||
      !ward ||
      !village?.trim()
    ) {
      return res.status(400).json({
        message: 'Please provide all required registration fields.'
      });
    }

    // Public registration must always create an applicant
    const userExists = await User.findOne({
      $or: [
        { phoneNumber: phoneNumber.trim() },
        ...(hasNationalID
          ? [{ 'profile.nationalID': nationalID.trim() }]
          : []),
        ...(hasBirthCertificate
          ? [{ 'profile.birthCertificateNumber': birthCertificateNumber.trim() }]
          : [])
      ]
    });

    if (userExists) {
      return res.status(409).json({
        message: 'Phone number or identification document is already registered.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Only include the identification field provided.
    
    const profile = {
      fullName: fullName.trim(),
      ward,
      village: village.trim()
    };

    if (hasNationalID) {
      profile.nationalID = nationalID.trim();
    } else {
      profile.birthCertificateNumber = birthCertificateNumber.trim();
    }

    const user = await User.create({
      phoneNumber: phoneNumber.trim(),
      passwordHash,
      role: role || "applicant",
      profile
    });

    return res.status(201).json({
      _id: user._id,
      phoneNumber: user.phoneNumber,
      role: user.role,
      fullName: user.profile.fullName,
      token: generateToken(user._id)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'This phone number or identification document is already registered.'
      });
    }

    console.error('Registration error:', error.message);

    return res.status(500).json({
      message: 'Registration failed due to a server error.'
    });
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
