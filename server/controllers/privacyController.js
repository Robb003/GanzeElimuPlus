
const PrivacyAcknowledgement = require('../models/PrivacyAcknowledgement');

// The currently published privacy notice version.
// Update this when a new notice is formally approved.
const CURRENT_NOTICE_VERSION =
  process.env.PRIVACY_NOTICE_VERSION || '1.0';

/**
 * Record an applicant's privacy notice acknowledgement.
 *
 * POST /api/privacy/acknowledgement
 */
const recordPrivacyAcknowledgement = async (req, res) => {
  try {
    // Get the authenticated applicant.
    // The protect middleware must populate req.user.
    const applicantId = req.user?._id || req.user?.id;

    if (!applicantId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    // Only applicants should use this endpoint.
    if (req.user.role && req.user.role !== 'applicant') {
      return res.status(403).json({
        success: false,
        message: 'Only applicants can submit this acknowledgement.',
      });
    }

    const {
      applicantType,
      acknowledged,
      guardian,
    } = req.body;

    // Validate applicant category.
    if (!['adult', 'minor'].includes(applicantType)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid applicant category.',
      });
    }

    // Acknowledgement must be explicitly provided.
    if (acknowledged !== true) {
      return res.status(400).json({
        success: false,
        message: 'You must acknowledge the Privacy Notice before continuing.',
      });
    }

    let guardianDetails = null;
    let acknowledgementStatus = 'Recorded';

    // Additional requirements for applicants under 18.
    if (applicantType === 'minor') {
      if (!guardian || typeof guardian !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Parent or guardian information is required.',
        });
      }

      const {
        fullName,
        relationship,
        phoneNumber,
        consentGiven,
      } = guardian;

      if (
        !fullName?.trim() ||
        !relationship ||
        !phoneNumber?.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Please complete all parent or guardian details.',
        });
      }

      if (!['Parent', 'Legal Guardian'].includes(relationship)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parent or guardian relationship.',
        });
      }

      if (consentGiven !== true) {
        return res.status(400).json({
          success: false,
          message: 'Parent or guardian authorisation is required.',
        });
      }

      guardianDetails = {
        fullName: fullName.trim(),
        relationship,
        phoneNumber: phoneNumber.trim(),
        consentGiven: true,
        verificationStatus: 'Pending',
      };

      // A guardian's declaration must be verified
      // before the minor proceeds with the application.
      acknowledgementStatus = 'Guardian-Verification-Pending';
    }

    // Prevent duplicate records for the same notice version.
    const existingAcknowledgement =
      await PrivacyAcknowledgement.findOne({
        applicantId,
        noticeVersion: CURRENT_NOTICE_VERSION,
        status: { $ne: 'Withdrawn' },
      });

    if (existingAcknowledgement) {
      return res.status(409).json({
        success: false,
        message: 'You have already acknowledged this Privacy Notice.',
        acknowledgement: {
          id: existingAcknowledgement._id,
          status: existingAcknowledgement.status,
          noticeVersion: existingAcknowledgement.noticeVersion,
        },
      });
    }

    // Create the acknowledgement record.
    const acknowledgement = new PrivacyAcknowledgement({
      applicantId,
      noticeVersion: CURRENT_NOTICE_VERSION,
      applicantType,
      acknowledged: true,
      acknowledgedAt: new Date(),
      guardian: guardianDetails,
      status: acknowledgementStatus,
      recordedBy: applicantId,
    });

    await acknowledgement.save();

    return res.status(201).json({
      success: true,
      message:
        applicantType === 'minor'
          ? 'Your acknowledgement has been recorded. Parent or guardian verification is pending.'
          : 'Your Privacy Notice acknowledgement has been recorded.',
      acknowledgement: {
        id: acknowledgement._id,
        noticeVersion: acknowledgement.noticeVersion,
        applicantType: acknowledgement.applicantType,
        acknowledged: acknowledgement.acknowledged,
        acknowledgedAt: acknowledgement.acknowledgedAt,
        status: acknowledgement.status,
      },
    });

  } catch (error) {
    console.error('Privacy acknowledgement error:', error);

    return res.status(500).json({
      success: false,
      message: 'An error occurred while recording your acknowledgement.',
    });
  }
};


/**
 * Retrieve the logged-in applicant's latest acknowledgement.
 *
 * GET /api/privacy/my-acknowledgement
 */
const getMyPrivacyAcknowledgement = async (req, res) => {
  try {
    const applicantId = req.user?._id || req.user?.id;

    if (!applicantId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const acknowledgement =
      await PrivacyAcknowledgement.findOne({
        applicantId,
      }).sort({ createdAt: -1 });

    if (!acknowledgement) {
      return res.status(404).json({
        success: false,
        message: 'No Privacy Notice acknowledgement found.',
      });
    }

    return res.status(200).json({
      success: true,
      acknowledgement,
    });

  } catch (error) {
    console.error('Get privacy acknowledgement error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve privacy acknowledgement.',
    });
  }
};

module.exports = {
  recordPrivacyAcknowledgement,
  getMyPrivacyAcknowledgement,
};
