
const mongoose = require('mongoose');
const calculateScore = require('../utils/scoreCalculator');

const DocumentReviewSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected'],
      default: 'Pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    notes: {
      type: String,
      default: null,
      maxlength: 2000
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);

const ApplicationSchema = new mongoose.Schema(
  {
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
        enum: [
          'total-orphan',
          'partial-orphan-single-parent',
          'both-parents-alive'
        ],
        required: true
      },
      householdIncomeBracket: {
        type: String,
        enum: ['under-10k', '10k-30k', 'above-30k'],
        required: true
      },
      disabledParents: {
        type: Boolean,
        default: false
      },
      chronicIllnessInFamily: {
        type: Boolean,
        default: false
      },
      siblingsInSchool: {
        type: Number,
        default: 0,
        min: 0,
        validate: {
          validator: Number.isInteger,
          message: 'Siblings in school must be a whole number.'
        }
      }
    },

    calculatedScore: {
      type: Number,
      default: 0,
      min: 0
    },

    educationDetails: {
      schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
      },
      studentCategory: {
        type: String,
        enum: [
          'Primary',
          'Junior Secondary',
          'Senior Secondary',
          'TVET / Polytechnic',
          'College',
          'University'
        ],
        required: true
      },
      admissionNumber: {
        type: String,
        required: true,
        trim: true
      },
      outstandingFees: {
        type: Number,
        required: true,
        min: 0
      }
    },

    documents: {
      chiefLetterUrl: {
        type: String,
        required: true
      },
      feeStructureUrl: {
        type: String,
        required: true
      },
      reportCardUrl: {
        type: String,
        required: true
      },
      parentIDOrDeathCertificateUrl: {
        type: String,
        required: true
      },
      studentIDOrBirthCertUrl: {
        type: String,
        required: true
      }
    },

    // Each document is reviewed independently by an authorized clerk.
    documentReviews: {
      chiefLetter: {
        type: DocumentReviewSchema,
        default: () => ({})
      },
      feeStructure: {
        type: DocumentReviewSchema,
        default: () => ({})
      },
      reportCard: {
        type: DocumentReviewSchema,
        default: () => ({})
      },
      parentIDOrDeathCertificate: {
        type: DocumentReviewSchema,
        default: () => ({})
      },
      studentIDOrBirthCert: {
        type: DocumentReviewSchema,
        default: () => ({})
      }
    },

    awardDetails: {
      proposedAmount: {
        type: Number,
        default: null,
        min: 0
      },
      approvedAmount: {
        type: Number,
        default: null,
        min: 0
      },
      status: {
        type: String,
        enum: [
          'Submitted',
          'Verified',
          'Rejected',
          'Board-Approved',
          'Disbursed'
        ],
        default: 'Submitted'
      },
      rejectionReason: {
        type: String,
        default: null
      },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      }
    }
  },
  { timestamps: true }
);


ApplicationSchema.pre('validate', function () {
  if (this.isNew || this.isModified('vulnerabilityMetrics')) {
    this.calculatedScore = calculateScore(
      this.vulnerabilityMetrics.toObject
        ? this.vulnerabilityMetrics.toObject()
        : this.vulnerabilityMetrics
    );
  }
});


module.exports = mongoose.model('Application', ApplicationSchema);
