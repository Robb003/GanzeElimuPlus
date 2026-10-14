const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  applicationNumber: {
    type: String,
    required: true,
    unique: true
  },
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vulnerabilityMetrics: {
    familyStatus: { 
      type: String, 
      enum: ['total-orphan', 'partial-orphan-single-parent', 'both-parents-alive'], 
      required: true 
    },
    householdIncomeBracket: {
      type: String,
      enum: ['under-10k', '10k-30k', 'above-30k'],
      required: true
    },
    disabledParents: { type: Boolean, default: false },
    chronicIllnessInFamily: { type: Boolean, default: false },
    siblingsInSchool: { type: Number, default: 0 }
  },
  calculatedScore: {
    type: Number,
    default: 0
  },
  educationDetails: {
    schoolId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'School',
      required: true 
    },
    studentCategory: {
      type: String,
      enum: ['Primary', 'Junior Secondary', 'Senior Secondary', 'TVET / Polytechnic', 'College', 'University'],
      required: true
    },
    admissionNumber: { type: String, required: true },
    outstandingFees: { type: Number, required: true }
  },
  documents: {
    chiefLetterUrl: { type: String, required: true },
    feeStructureUrl: { type: String, required: true },
    reportCardUrl: { type: String, required: true },
    parentIDOrDeathCertificateUrl: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['Submitted', 'Verified', 'Rejected', 'Board-Approved', 'Disbursed'],
    default: 'Submitted'
  },
  rejectionReason: { type: String, default: null },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

//automated need-scoring engine
ApplicationSchema.pre('save', function(next) {
  let score = 0;
  if (this.vulnerabilityMetrics.familyStatus === 'total-orphan') score += 40;
  else if (this.vulnerabilityMetrics.familyStatus === 'partial-orphan-single-parent') score += 25;
  else if (this.vulnerabilityMetrics.familyStatus === 'both-parents-alive') score += 10;

  if (this.vulnerabilityMetrics.householdIncomeBracket === 'under-10k') score += 30;
  else if (this.vulnerabilityMetrics.householdIncomeBracket === '10k-30k') score += 15;
  else if (this.vulnerabilityMetrics.householdIncomeBracket === 'above-30k') score += 5;

  if (this.vulnerabilityMetrics.disabledParents) score += 10;
  if (this.vulnerabilityMetrics.chronicIllnessInFamily) score += 10;

  const siblingPoints = this.vulnerabilityMetrics.siblingsInSchool * 2;
  score += Math.min(siblingPoints, 10);

  this.calculatedScore = score;
  next();
});

module.exports = mongoose.model('Application', ApplicationSchema);
