//for verifying submitted documents by the clerk

const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  clerkId: {
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
    enum: ['Verified', 'Rejected', 'Re-reviewed'],
    required: true
  },
  notes: {
    type: String,
    default: null
  },
  ipAddress: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
