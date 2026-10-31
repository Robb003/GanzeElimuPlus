
const mongoose = require('mongoose');
const Application = require('../models/Application');
const AuditLog = require('../models/AuditLog');
const { randomUUID } = require('crypto');
const calculateProposedAward = require('../utils/awardCalculator');
const cloudinary = require('../config/cloudinary');

// ============================================================
// CONSTANTS
// ============================================================

const DOCUMENT_TYPES = [
  'chiefLetter',
  'feeStructure',
  'reportCard',
  'parentIDOrDeathCertificate',
  'studentIDOrBirthCert'
];

const MAX_NOTES_LENGTH = 2000;

const ALLOWED_FAMILY_STATUSES = [
  'total-orphan',
  'partial-orphan-single-parent',
  'both-parents-alive'
];

const ALLOWED_STUDENT_CATEGORIES = [
  'Primary',
  'Junior Secondary',
  'Senior Secondary',
  'TVET / Polytechnic',
  'College',
  'University'
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Convert FormData string values into actual booleans.
const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;

  return null;
};

// Upload one PDF to authenticated Cloudinary storage.
const uploadPdfToCloudinary = (file, folder, documentType) => {
  return new Promise((resolve, reject) => {
    const publicId = `${folder}/${documentType}.pdf`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        type: 'authenticated',
        public_id: publicId,
        overwrite: false
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve({
          publicId: result.public_id,
          resourceType: result.resource_type,
          format: 'pdf',
          originalName: file.originalname,
          bytes: result.bytes,
          uploadedAt: new Date()
        });
      }
    );

    uploadStream.end(file.buffer);
  });
};

// Delete uploaded Cloudinary documents if submission fails.
const deleteCloudinaryDocuments = async (documents) => {
  for (const document of documents) {
    try {
      await cloudinary.uploader.destroy(document.publicId, {
        resource_type: 'raw',
        type: 'authenticated',
        invalidate: true
      });
    } catch (error) {
      console.error(
        `Cloudinary cleanup failed for ${document.publicId}:`,
        error.message
      );
    }
  }
};

// Confirm that all five document fields were uploaded.
const validateUploadedDocuments = (files) => {
  return DOCUMENT_TYPES.filter(
    (type) => !files?.[type] || files[type].length !== 1
  );
};

// Return safe document metadata without exposing Cloudinary IDs.
const getSafeDocumentMetadata = (documents) => {
  const metadata = {};

  for (const type of DOCUMENT_TYPES) {
    const document = documents?.[type];

    metadata[type] = document
      ? {
          originalName: document.originalName,
          format: document.format,
          bytes: document.bytes,
          uploadedAt: document.uploadedAt
        }
      : null;
  }

  return metadata;
};

// ============================================================
// 1. SUBMIT APPLICATION
// POST /api/applications/submit
// ============================================================

exports.submitApplication = async (req, res) => {
  const uploadedDocuments = [];

  try {
    const {
      familyStatus,
      householdIncomeBracket,
      disabledParents,
      chronicIllnessInFamily,
      siblingsInSchool,
      schoolName,
      studentCategory,
      admissionNumber,
      outstandingFees
    } = req.body;

    // 1. Confirm applicant role.
    if (req.user.role !== 'applicant') {
      return res.status(403).json({
        message: 'Only applicants may submit applications through this endpoint.'
      });
    }

    // 2. Validate required fields.
    const requiredFields = {
      familyStatus,
      householdIncomeBracket,
      schoolName,
      studentCategory,
      admissionNumber,
      outstandingFees
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

    // 3. Clean and validate school name.
    const cleanedSchoolName = schoolName.trim();

    if (
      cleanedSchoolName.length < 2 ||
      cleanedSchoolName.length > 200
    ) {
      return res.status(400).json({
        message: 'School name must contain between 2 and 200 characters.'
      });
    }

    // 4. Validate student category.
    if (!ALLOWED_STUDENT_CATEGORIES.includes(studentCategory)) {
      return res.status(400).json({
        message: 'Invalid student category.'
      });
    }

    // 5. Clean and validate admission number.
    const cleanedAdmissionNumber = admissionNumber.trim();

    if (
      cleanedAdmissionNumber.length < 1 ||
      cleanedAdmissionNumber.length > 50
    ) {
      return res.status(400).json({
        message: 'Admission number must contain between 1 and 50 characters.'
      });
    }

    // 6. Validate all five PDF files.
    const missingDocuments = validateUploadedDocuments(req.files);

    if (missingDocuments.length > 0) {
      return res.status(400).json({
        message: 'All five supporting PDF documents are required.',
        missingDocuments
      });
    }

    // 7. Validate family status.
    if (!ALLOWED_FAMILY_STATUSES.includes(familyStatus)) {
      return res.status(400).json({
        message: 'Invalid family status.'
      });
    }

    // 8. Validate outstanding fees.
    const fees = Number(outstandingFees);

    if (
      outstandingFees === '' ||
      !Number.isSafeInteger(fees) ||
      fees < 0
    ) {
      return res.status(400).json({
        message: 'Outstanding fees must be a non-negative whole number of shillings.'
      });
    }

    // 9. Validate siblings.
    const siblings = Number(siblingsInSchool ?? 0);

    if (!Number.isSafeInteger(siblings) || siblings < 0) {
      return res.status(400).json({
        message: 'Siblings in school must be a non-negative integer.'
      });
    }

    // 10. Parse multipart boolean values.
    const disabled = parseBoolean(disabledParents);
    const chronicIllness = parseBoolean(chronicIllnessInFamily);

    if (disabled === null || chronicIllness === null) {
      return res.status(400).json({
        message: 'Disability and chronic illness fields must be true or false.'
      });
    }

    // 11. Check duplicate applications for the calendar year.
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

    // 12. Generate application tracking number.
    const trackingID = `GZ-${currentYear}-${randomUUID()
      .replace(/-/g, '')
      .slice(0, 12)
      .toUpperCase()}`;

    // 13. Prepare Cloudinary application folder.
    const cloudinaryFolder = `elimuplus/applications/${trackingID}`;

    const documents = {};

    // 14. Upload all five PDF documents.
    for (const documentType of DOCUMENT_TYPES) {
      const file = req.files[documentType][0];

      const uploadedDocument = await uploadPdfToCloudinary(
        file,
        cloudinaryFolder,
        documentType
      );

      documents[documentType] = uploadedDocument;
      uploadedDocuments.push(uploadedDocument);
    }

    // 15. Create application.
    const application = new Application({
      applicationNumber: trackingID,
      applicantId: req.user.id,

      vulnerabilityMetrics: {
        familyStatus,
        householdIncomeBracket,
        disabledParents: disabled,
        chronicIllnessInFamily: chronicIllness,
        siblingsInSchool: siblings
      },

      educationDetails: {
        schoolName: cleanedSchoolName,
        studentCategory,
        admissionNumber: cleanedAdmissionNumber,
        outstandingFees: fees
      },

      documents,

      awardDetails: {
        status: 'Submitted'
      }
    });

    // 16. Validate application.
    await application.validate();

    // 17. Calculate proposed award privately.
    application.set(
      'awardDetails.proposedAmount',
      calculateProposedAward(application.calculatedScore)
    );

    // 18. Save application.
    await application.save();

    return res.status(201).json({
      message: 'Application submitted successfully.',
      applicationNumber: application.applicationNumber,
      status: application.awardDetails.status
    });

  } catch (error) {
    console.error('Application submission error:', error);

    // Clean up Cloudinary files if submission failed.
    if (uploadedDocuments.length > 0) {
      await deleteCloudinaryDocuments(uploadedDocuments);
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: 'A duplicate application was detected. Please check your records.'
      });
    }

    if (
      error.name === 'ValidationError' ||
      error.name === 'CastError'
    ) {
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
    if (!['clerk', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'You are not authorized to access the review queue.'
      });
    }

    const applications = await Application.find({
      'awardDetails.status': 'Submitted'
    })
      .select(
        'applicationNumber educationDetails documents documentReviews awardDetails.status createdAt'
      )
      .sort({ createdAt: 1 })
      .lean();

    const queue = applications.map((application) => ({
      id: application._id,
      applicationNumber: application.applicationNumber,
      status: application.awardDetails.status,
      submittedAt: application.createdAt,

      educationDetails: {
        schoolName: application.educationDetails?.schoolName,
        studentCategory: application.educationDetails?.studentCategory,
        admissionNumber: application.educationDetails?.admissionNumber,
        outstandingFees: application.educationDetails?.outstandingFees
      },

      documents: getSafeDocumentMetadata(application.documents),
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
// 3. CLERK VERIFIES OR REJECTS APPLICATION
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

      // Apply the decision to all five documents.
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
          performedBy: req.user.id,
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
      .sort({ createdAt: 1 })
      .lean();

    const queue = applications.map((application) => ({
      id: application._id,
      applicationNumber: application.applicationNumber,
      status: application.awardDetails.status,
      submittedAt: application.createdAt,

      educationDetails: {
        schoolName: application.educationDetails?.schoolName,
        studentCategory: application.educationDetails?.studentCategory,
        admissionNumber: application.educationDetails?.admissionNumber,
        outstandingFees: application.educationDetails?.outstandingFees
      },

      // Confidential information: board and authorized admin only.
      vulnerabilityMetrics: application.vulnerabilityMetrics,
      calculatedScore: application.calculatedScore,
      proposedAmount: application.awardDetails.proposedAmount,

      documents: getSafeDocumentMetadata(application.documents),
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
      message: 'A reason is required when rejecting an award.'
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

      // Confirm all five documents were verified.
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
        // Calculate the amount on the server.
        // The board cannot supply or manipulate the award amount.
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
          performedBy: req.user.id,
          applicationId: application._id,
          action: action === 'Approved' ? 'Approved' : 'Rejected',
          notes: notes?.trim() ||
            'Board approved the automatically calculated award.',
          ipAddress: req.ip
        }],
        { session }
      );

      // Do not disclose the confidential award amount here.
      responseData = {
        applicationNumber: application.applicationNumber,
        status: application.awardDetails.status,
        decisionBy: req.user.id,
        decisionAt: decisionTime
      };
    });

    return res.status(200).json({
      message: action === 'Approved'
        ? 'Bursary award approved. Payment is not yet confirmed.'
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
