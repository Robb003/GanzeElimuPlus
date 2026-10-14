const mongoose = require ('mongoose')

const UserSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['applicant', 'agent', 'clerk', 'admin'],
    default: 'applicant'
  },
  profile: {
    fullName: { type: String, required: true },
    nationalID: { type: String, unique: true, sparse: true },
    birthCertificateNumber: { type: String, unique: true, sparse: true },
    ward: { 
      type: String, 
      enum: ['Ganze', 'Bamba', 'Jaribuni', 'Sokoke'], 
      required: true 
    },
    village: { type: String, required: true }
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });
module.exports = mongoose.model('User', UserSchema);
