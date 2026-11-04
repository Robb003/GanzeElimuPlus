
const mongoose = require('mongoose');

const guardianSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true,
      required: function () {
        return this.parent;
      },
    },

  relationship: {
    type: String,
    enum: ['Parent', 'Legal Guardian'],
    required: function () {
    return this.consentGiven === true;
    },
  },

    phoneNumber: {
      type: String,
      trim: true,
    },

    // Records the guardian's submitted declaration.
    consentGiven: {
      type: Boolean,
      default: false,
    },

    // A declaration is not automatically verified consent.
    verificationStatus: {
      type: String,
      enum: ['Not-Required', 'Pending', 'Verified', 'Rejected'],
      default: 'Pending',
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    verificationNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  { _id: false }
);

const privacyAcknowledgementSchema = new mongoose.Schema(
  {
    // Applicant who is subject to the privacy notice.
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Version of the privacy notice presented to the applicant.
    noticeVersion: {
      type: String,
      required: true,
      trim: true,
    },

    noticeTitle: {
      type: String,
      default: 'ElimuPlus Data Protection and Privacy Notice',
    },

    // Optional SHA-256 hash of the published notice.
    noticeHash: {
      type: String,
      default: null,
    },

    // Applicant's age category.
    applicantType: {
      type: String,
      enum: ['adult', 'minor'],
      required: true,
    },

    // Records acknowledgement of the privacy notice.
    acknowledged: {
      type: Boolean,
      required: true,
      validate: {
        validator: (value) => value === true,
        message: 'Privacy notice acknowledgement is required.',
      },
    },

    acknowledgedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    // Parent/guardian information for applicants under 18.
    guardian: {
      type: guardianSchema,
      default: null,
    },

    // Overall record status.
    status: {
      type: String,
      enum: [
        'Recorded',
        'Guardian-Verification-Pending',
        'Verified',
        'Rejected',
        'Withdrawn',
      ],
      default: 'Recorded',
    },

    // User who completed the acknowledgement.
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Withdrawal information, where applicable.
    withdrawnAt: {
      type: Date,
      default: null,
    },

    withdrawalReason: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    // Optional technical audit information.
    ipAddress: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Quickly retrieve an applicant's acknowledgement history.
privacyAcknowledgementSchema.index({
  applicantId: 1,
  createdAt: -1,
});

const PrivacyAcknowledgement = mongoose.model(
  'PrivacyAcknowledgement',
  privacyAcknowledgementSchema
);

module.exports = PrivacyAcknowledgement;
