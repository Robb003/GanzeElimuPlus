
const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },

  action: {
    type: String,
    enum: [
      'Verified',
      'Rejected',
      'Re-reviewed',
      'Approved',
      'Disbursed',
      'Payment-Failed'
    ],
    required: true
  },

  notes: {
    type: String,
    default: null,
    maxlength: 2000
  },

  ipAddress: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
