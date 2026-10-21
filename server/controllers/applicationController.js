
const mongoose = require('mongoose');
const Application = require('../models/Application');
const AuditLog = require('../models/AuditLog');
const { randomUUID } = require('crypto');
const calculateProposedAward = require('../utils/awardCalculator');

const DOCUMENT_TYPES = [
  'chiefLetter',
  'feeStructure',
  'reportCard',
  'parentIDOrDeathCertificate',
  'studentIDOrBirthCert'
];

const MAX_NOTES_LENGTH = 2000;


// ============================================================
// 1. SUBMIT APPLICATION
// POST /api/applications/submit
// ============================================================

exports.submitApplication = async (req, res) => {
  const {
    familyStatus,
    householdIncomeBracket,
    disabledParents,
    chronicIllnessInFamily,
    siblingsInSchool,
    schoolId,
    studentCategory,
    admissionNumber,
    outstandingFees,
    chiefLetterUrl,
    feeStructureUrl,
    reportCardUrl,
    parentIDOrDeathCertificateUrl,
    studentIDOrBirthCertUrl
  } = req.body;

  try {
    if (req.user.role !== 'applicant') {
      return res.status(403).json({
        message: 'Only applicants may submit applications through this endpoint.'
      });
    }

    const requiredFields = {
      familyStatus,
      householdIncomeBracket,
      schoolId,
      studentCategory,
      admissionNumber,
      outstandingFees,
      chiefLetterUrl,
      feeStructureUrl,
      reportCardUrl,
      parentIDOrDeathCertificateUrl,
      studentIDOrBirthCertUrl
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) =>
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim() === '')
      )
      .map(([field]) => field);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Some required application fields are missing.',
        missingFields
      });
    }

    if (!mongoose.isValidObjectId(schoolId)) {
      return res.status(400).json({
        message: 'Invalid school ID.'
      });
    }

    if (
      outstandingFees === '' ||
      !Number.isFinite(Number(outstandingFees)) ||
      Number(outstandingFees) < 0 ||
      !Number.isSafeInteger(Number(outstandingFees))
    ) {
      return res.status(400).json({
        message: 'Outstanding fees must be a non-negative whole number of shillings.'
      });
    }

    if (
      !Number.isInteger(Number(siblingsInSchool ?? 0)) ||
      Number(siblingsInSchool ?? 0) < 0
    ) {
      return res.status(400).json({
        message: 'Siblings in school must be a non-negative integer.'
      });
    }

    if (
      (disabledParents !== undefined &&
        typeof disabledParents !== 'boolean') ||
      (chronicIllnessInFamily !== undefined &&
        typeof chronicIllnessInFamily !== 'boolean')
    ) {
      return res.status(400).json({
        message: 'Disability and chronic illness fields must be boolean values.'
      });
    }

    const currentYear = new Date().getFullYear();

    const existingApplication = await Application.findOne({
      applicantId: req.user.id,
      createdAt: {
        $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
        $lt: new Date(`${currentYear + 1}-01-01T00:00:00.000Z`)
      }
    }).select('_id');

    if (existingApplication) {
      return res.status(409).json({
        message: 'You have already submitted an application for this calendar year.'
      });
    }

    const trackingID = `GZ-${currentYear}-${randomUUID()
      .replace(/-/g, '')
      .slice(0, 12)
      .toUpperCase()}`;

    const application = new Application({
      applicationNumber: trackingID,
      applicantId: req.user.id,

      vulnerabilityMetrics: {
        familyStatus,
        householdIncomeBracket,
        disabledParents: disabledParents ?? false,
        chronicIllnessInFamily: chronicIllnessInFamily ?? false,
        siblingsInSchool: Number(siblingsInSchool ?? 0)
      },

      educationDetails: {
        schoolId,
        studentCategory,
        admissionNumber,
        outstandingFees: Number(outstandingFees)
      },

      documents: {
        chiefLetterUrl,
        feeStructureUrl,
        reportCardUrl,
        parentIDOrDeathCertificateUrl,
        studentIDOrBirthCertUrl
      },

      awardDetails: {
        status: 'Submitted'
      }
    });

    await application.validate();

    // Calculate the proposal privately on the server.
    application.set(
      'awardDetails.proposedAmount',
      calculateProposedAward(application.calculatedScore)
    );

    await application.save();

    return res.status(201).json({
      message: 'Application submitted successfully.',
      applicationNumber: application.applicationNumber,
      status: application.awardDetails.status
    });
  } catch (error) {
    console.error('Application submission error:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: 'A duplicate application was detected. Please check your records.'
      });
    }

    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({
        message: 'Application data is invalid. Please check your entries.'
      });
    }

    return res.status(500).json({
      message: 'Unable to submit the application. Please try again.'
    });
  }
};


// ============================================================
// 2. CLERK REVIEW QUEUE
// GET /api/applications/review-queue
// ============================================================

exports.getReviewQueue = async (req, res) => {
  try {
    const applications = await Application.find({
      'awardDetails.status': 'Submitted'
    })
      .select(
        'applicationNumber educationDetails documents documentReviews awardDetails.status createdAt'
      )
      .populate('educationDetails.schoolId', 'schoolName category')
      .sort({ createdAt: 1 })
      .lean();

    const queue = applications.map((application) => ({
      id: application._id,
      applicationNumber: application.applicationNumber,
      status: application.awardDetails.status,
      submittedAt: application.createdAt,

      educationDetails: {
        school: application.educationDetails?.schoolId
          ? {
              schoolName: application.educationDetails.schoolId.schoolName,
              category: application.educationDetails.schoolId.category
            }
          : null,
        studentCategory: application.educationDetails?.studentCategory,
        admissionNumber: application.educationDetails?.admissionNumber,
        outstandingFees: application.educationDetails?.outstandingFees
      },

      documents: application.documents,
      documentReviews: application.documentReviews
    }));

    return res.status(200).json(queue);
  } catch (error) {
    console.error('Review queue error:', error);

    return res.status(500).json({
      message: 'Unable to retrieve the application review queue.'
    });
  }
};


// ============================================================
// 3. CLERK VERIFIES OR REJECTS ALL FIVE DOCUMENTS
// PUT /api/applications/:id/verify
// ============================================================

exports.processVerification = async (req, res) => {
  const { id } = req.params;
  const { action, notes } = req.body;

  if (req.user.role !== 'clerk') {
    return res.status(403).json({
      message: 'Only a clerk may verify application documents.'
    });
  }

  if (!['Verified', 'Rejected'].includes(action)) {
    return res.status(400).json({
      message: 'Action must be Verified or Rejected.'
    });
  }

  if (notes !== undefined && typeof notes !== 'string') {
    return res.status(400).json({
      message: 'Review notes must be text.'
    });
  }

  if (typeof notes === 'string' && notes.length > MAX_NOTES_LENGTH) {
    return res.status(400).json({
      message: `Review notes cannot exceed ${MAX_NOTES_LENGTH} characters.`
    });
  }

  if (action === 'Rejected' && !notes?.trim()) {
    return res.status(400).json({
      message: 'Provide a reason when rejecting the application.'
    });
  }

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      message: 'Invalid application ID.'
    });
  }

  const session = await mongoose.startSession();

  try {
    let responseData;

    await session.withTransaction(async () => {
      const application = await Application.findOne({
        _id: id,
        'awardDetails.status': 'Submitted'
      }).session(session);

      if (!application) {
        const exists = await Application.exists({ _id: id }).session(session);

        const error = new Error(
          exists
            ? 'Application is no longer awaiting verification.'
            : 'Application not found.'
        );

        error.statusCode = exists ? 409 : 404;
        throw error;
      }

      const reviewTime = new Date();
      const reviewNotes = notes?.trim() || null;

      // Record one decision against each of the five documents.
      for (const documentType of DOCUMENT_TYPES) {
        application.set(
          `documentReviews.${documentType}.status`,
          action
        );
        application.set(
          `documentReviews.${documentType}.reviewedBy`,
          req.user.id
        );
        application.set(
          `documentReviews.${documentType}.notes`,
          reviewNotes
        );
        application.set(
          `documentReviews.${documentType}.reviewedAt`,
          reviewTime
        );
      }

      application.set('awardDetails.status', action);
      application.set('awardDetails.reviewedBy', req.user.id);
      application.set(
        'awardDetails.rejectionReason',
        action === 'Rejected' ? notes.trim() : null
      );

      await application.save({ session });

      await AuditLog.create(
        [{
          clerkId: req.user.id,
          applicationId: application._id,
          action,
          notes: reviewNotes ||
            'All five documents verified by the clerk.',
          ipAddress: req.ip
        }],
        { session }
      );

      responseData = {
        applicationNumber: application.applicationNumber,
        status: application.awardDetails.status,
        documentReviews: application.documentReviews
      };
    });

    return res.status(200).json({
      message: action === 'Verified'
        ? 'All five documents verified successfully.'
        : 'Application rejected during document verification.',
      ...responseData
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message
      });
    }

    console.error('Application verification error:', error);

    return res.status(500).json({
      message: 'Unable to record the document review.'
    });
  } finally {
    await session.endSession();
  }
};


// ============================================================
// 4. BOARD REVIEW QUEUE
// GET /api/applications/board-queue
// ============================================================

exports.getBoardReviewQueue = async (req, res) => {
  try {
    if (!['board', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only the board or an authorized admin can review awards.'
      });
    }

    const applications = await Application.find({
      'awardDetails.status': 'Verified'
    })
      .select(
        'applicationNumber educationDetails vulnerabilityMetrics calculatedScore documents documentReviews awardDetails.proposedAmount awardDetails.status createdAt'
      )
      .populate('educationDetails.schoolId', 'schoolName category')
      .sort({ createdAt: 1 })
      .lean();

    const queue = applications.map((application) => ({
      id: application._id,
      applicationNumber: application.applicationNumber,
      status: application.awardDetails.status,
      submittedAt: application.createdAt,

      educationDetails: {
        school: application.educationDetails?.schoolId
          ? {
              schoolName: application.educationDetails.schoolId.schoolName,
              category: application.educationDetails.schoolId.category
            }
          : null,
        studentCategory: application.educationDetails?.studentCategory,
        admissionNumber: application.educationDetails?.admissionNumber,
        outstandingFees: application.educationDetails?.outstandingFees
      },

      // Internal assessment information for authorized staff only.
      calculatedScore: application.calculatedScore,
      proposedAmount: application.awardDetails.proposedAmount,
      documentReviews: application.documentReviews
    }));

    return res.status(200).json(queue);
  } catch (error) {
    console.error('Board review queue error:', error);

    return res.status(500).json({
      message: 'Unable to retrieve the board review queue.'
    });
  }
};


// ============================================================
// 5. BOARD APPROVES OR REJECTS AN AWARD
// PUT /api/applications/:id/approve
// ============================================================


exports.approveApplication = async (req, res) => {
  const { id } = req.params;
  const { action, notes } = req.body;

  if (!['board', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      message: 'Only the board or an authorized admin can decide awards.'
    });
  }

  if (!['Approved', 'Rejected'].includes(action)) {
    return res.status(400).json({
      message: 'Action must be Approved or Rejected.'
    });
  }

  if (notes !== undefined && typeof notes !== 'string') {
    return res.status(400).json({
      message: 'Notes must be text.'
    });
  }

  if (typeof notes === 'string' && notes.length > MAX_NOTES_LENGTH) {
    return res.status(400).json({
      message: `Notes cannot exceed ${MAX_NOTES_LENGTH} characters.`
    });
  }

  if (action === 'Rejected' && !notes?.trim()) {
    return res.status(400).json({
      message: 'A reason is required when rejecting an application.'
    });
  }

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      message: 'Invalid application ID.'
    });
  }

  const session = await mongoose.startSession();

  try {
    let responseData;

    await session.withTransaction(async () => {
      const application = await Application.findOne({
        _id: id,
        'awardDetails.status': 'Verified'
      }).session(session);

      if (!application) {
        const exists = await Application.exists({ _id: id }).session(session);

        const error = new Error(
          exists
            ? 'Application is not awaiting board approval.'
            : 'Application not found.'
        );

        error.statusCode = exists ? 409 : 404;
        throw error;
      }

      const allDocumentsVerified = DOCUMENT_TYPES.every(
        (type) =>
          application.documentReviews?.[type]?.status === 'Verified'
      );

      if (!allDocumentsVerified) {
        const error = new Error(
          'All five documents must be verified before board approval.'
        );
        error.statusCode = 409;
        throw error;
      }

      const decisionTime = new Date();

      if (action === 'Approved') {
        // The backend calculates the award. The board cannot set the amount.
        const amount = calculateProposedAward(
          application.calculatedScore
        );

        const outstandingFees = Number(
          application.educationDetails?.outstandingFees
        );

        if (amount > outstandingFees) {
          const error = new Error(
            'The automatically calculated award exceeds the outstanding fees. Review the allocation policy or fee information.'
          );
          error.statusCode = 409;
          throw error;
        }

        application.set('awardDetails.proposedAmount', amount);
        application.set('awardDetails.approvedAmount', amount);
        application.set('awardDetails.status', 'Board-Approved');
        application.set('awardDetails.rejectionReason', null);
        application.set('awardDetails.approvedBy', req.user.id);
        application.set('awardDetails.approvedAt', decisionTime);
      } else {
        application.set('awardDetails.status', 'Rejected');
        application.set('awardDetails.approvedAmount', null);
        application.set('awardDetails.rejectionReason', notes.trim());
        application.set('awardDetails.approvedBy', null);
        application.set('awardDetails.approvedAt', null);
      }

      await application.save({ session });

      await AuditLog.create(
        [{
          // Existing AuditLog schema field.
          clerkId: req.user.id,
          applicationId: application._id,
          action: action === 'Approved' ? 'Approved' : 'Rejected',
          notes: notes?.trim() ||
            'Board approved the automatically calculated award.',
          ipAddress: req.ip
        }],
        { session }
      );

      // Do not return the amount in this response.
      responseData = {
        applicationNumber: application.applicationNumber,
        status: application.awardDetails.status,
        decisionBy: req.user.id,
        decisionAt: decisionTime
      };
    });

    return res.status(200).json({
      message: action === 'Approved'
        ? 'Bursary award approved using the allocation policy. Payment is not yet confirmed.'
        : 'Bursary application rejected by the board.',
      ...responseData
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message
      });
    }

    console.error('Board approval error:', error);

    return res.status(500).json({
      message: 'Unable to record the board decision.'
    });
  } finally {
    await session.endSession();
  }
};
