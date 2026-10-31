
const mongoose = require('mongoose');
const calculateScore = require('../utils/scoreCalculator');

/*
|--------------------------------------------------------------------------
| Stored Document Schema
|--------------------------------------------------------------------------
| Stores Cloudinary references and metadata.
| The actual PDF files remain in Cloudinary, not MongoDB.
*/

const StoredDocumentSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: true,
      trim: true
    },

    resourceType: {
      type: String,
      enum: ['raw'],
      default: 'raw',
      required: true
    },

    format: {
      type: String,
      enum: ['pdf'],
      default: 'pdf',
      required: true
    },

    originalName: {
      type: String,
      required: true,
      trim: true
    },

    bytes: {
      type: Number,
      required: true,
      min: 1
    },

    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

/*
|--------------------------------------------------------------------------
| Document Review Schema
|--------------------------------------------------------------------------
| Each supporting document is reviewed independently by a clerk.
*/

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

/*
|--------------------------------------------------------------------------
| Application Schema
|--------------------------------------------------------------------------
*/

const ApplicationSchema = new mongoose.Schema(
  {
    // Unique application reference number.
    applicationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    // Applicant who submitted the application.
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    /*
    |--------------------------------------------------------------------------
    | Vulnerability Information
    |--------------------------------------------------------------------------
    */

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
        enum: [
          'under-10k',
          '10k-30k',
          'above-30k'
        ],
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

    /*
    |--------------------------------------------------------------------------
    | Confidential Award Scoring
    |--------------------------------------------------------------------------
    | This field must never be exposed in applicant or clerk responses.
    */

    calculatedScore: {
      type: Number,
      default: 0,
      min: 0
    },

    /*
    |--------------------------------------------------------------------------
    | Education Information
    |--------------------------------------------------------------------------
    */

    educationDetails: {
      schoolName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 200
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
        trim: true,
        maxlength: 50
      },

      outstandingFees: {
        type: Number,
        required: true,
        min: 0
      }
    },

    /*
    |--------------------------------------------------------------------------
    | Supporting Documents - Cloudinary
    |--------------------------------------------------------------------------
    | Only Cloudinary references and metadata are stored here.
    | All five documents must be uploaded before an application is saved.
    */

    documents: {
      chiefLetter: {
        type: StoredDocumentSchema,
        required: true
      },

      feeStructure: {
        type: StoredDocumentSchema,
        required: true
      },

      reportCard: {
        type: StoredDocumentSchema,
        required: true
      },

      parentIDOrDeathCertificate: {
        type: StoredDocumentSchema,
        required: true
      },

      studentIDOrBirthCert: {
        type: StoredDocumentSchema,
        required: true
      }
    },

    /*
    |--------------------------------------------------------------------------
    | Individual Document Reviews
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | Award and Application Status
    |--------------------------------------------------------------------------
    */

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
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      approvedAt: {
      type: Date,
      default: null
      },
    }
  },
  {
    timestamps: true
  }
);

/*
|--------------------------------------------------------------------------
| Automatic Vulnerability Score Calculation
|--------------------------------------------------------------------------
| Recalculate the score when a new application is created or
| vulnerability information is modified.
*/

ApplicationSchema.pre('validate', function () {
  if (this.isNew || this.isModified('vulnerabilityMetrics')) {
    this.calculatedScore = calculateScore(
      this.vulnerabilityMetrics?.toObject
        ? this.vulnerabilityMetrics.toObject()
        : this.vulnerabilityMetrics
    );
  }
});

/*
|--------------------------------------------------------------------------
| Export Application Model
|--------------------------------------------------------------------------
*/

module.exports = mongoose.model(
  'Application',
  ApplicationSchema
);
