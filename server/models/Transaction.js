const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  amountDisbursed: {
    type: Number,
    required: true
  },
  paymentReference: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Completed'
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
