const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
  schoolName: { type: String, required: true, unique: true },
  category: { 
    type: String, 
    enum: ['Primary', 'Junior Secondary', 'Senior Secondary', 'TVET / Polytechnic', 'College', 'University'], 
    required: true 
  },
  bankDetails: {
    bankName: { type: String, required: true },
    branchName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    paybillNumber: { type: String, default: null }
  },
  contactEmail: { type: String, required: true },
  contactPhone: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('School', SchoolSchema);
