
const mongoose = require('mongoose');

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
    enum: ['applicant', 'agent', 'clerk', 'board', 'admin'],
    default: 'applicant'
  },

  profile: {
    fullName: {
      type: String,
      required: true,
      trim: true
    },

    nationalID: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      validate: {
        validator: function (value) {
          // A National ID and birth certificate cannot both be provided.
          return !value || !this.profile.birthCertificateNumber;
        },
        message: 'Provide either a National ID or a birth certificate number, not both.'
      }
    },

    birthCertificateNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      validate: {
        validator: function (value) {
          // A birth certificate and National ID cannot both be provided.
          return !value || !this.profile.nationalID;
        },
        message: 'Provide either a birth certificate number or a National ID, not both.'
      }
    },

    ward: {
      type: String,
      enum: ['Ganze', 'Bamba', 'Jaribuni', 'Sokoke'],
      required: true
    },

    village: {
      type: String,
      required: true,
      trim: true
    }
  },

  isVerified: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
