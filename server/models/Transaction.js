
const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true,
    index: true
  },

  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },

  amountDisbursed: {
    type: Number,
    required: true,
    min: [0.01, 'Disbursement amount must be greater than zero']
  },

  paymentReference: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Pending',
    required: true
  },

  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  completedAt: {
    type: Date,
    default: null
  },

  failureReason: {
    type: String,
    trim: true,
    maxlength: 500,
    default: null
  }

}, { timestamps: true });

TransactionSchema.index({ applicationId: 1, status: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
