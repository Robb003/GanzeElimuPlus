const mongoose = require('mongoose');
const crypto = require('crypto');

const Application = require('../models/Application');
const School = require('../models/School');
const Transaction = require('../models/Transaction');
const Period = require('../models/Period');
const AuditLog = require('../models/AuditLog');
// 0. CREATE A SCHOOL (ADMIN ONLY)
exports.createSchool = async (req, res) => {
  try {
    const {
      schoolName,
      category,
      bankDetails,
      contactEmail,
      contactPhone
    } = req.body;

    if (
      typeof schoolName !== 'string' ||
      !schoolName.trim() ||
      !category ||
      typeof bankDetails?.bankName !== 'string' ||
      !bankDetails.bankName.trim() ||
      typeof bankDetails?.branchName !== 'string' ||
      !bankDetails.branchName.trim() ||
      typeof bankDetails?.accountNumber !== 'string' ||
      !bankDetails.accountNumber.trim() ||
      typeof contactEmail !== 'string' ||
      !contactEmail.trim() ||
      typeof contactPhone !== 'string' ||
      !contactPhone.trim()
    ) {
      return res.status(400).json({
        message: 'Please provide all required school details.'
      });
    }

    const cleanSchoolName = schoolName.trim();

    const existingSchool = await School.findOne({
      schoolName: cleanSchoolName
    });

    if (existingSchool) {
      return res.status(409).json({
        message: 'This school is already registered.'
      });
    }

    const school = await School.create({
      schoolName: cleanSchoolName,
      category,
      bankDetails: {
        bankName: bankDetails.bankName.trim(),
        branchName: bankDetails.branchName.trim(),
        accountNumber: bankDetails.accountNumber.trim(),
        paybillNumber:
          typeof bankDetails.paybillNumber === 'string'
            ? bankDetails.paybillNumber.trim() || null
            : null
      },
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim()
    });

    // Never return the school's bank account details.
    return res.status(201).json({
      message: 'School registered successfully.',
      data: {
        _id: school._id,
        schoolName: school.schoolName,
        category: school.category,
        contactEmail: school.contactEmail,
        contactPhone: school.contactPhone,
        createdAt: school.createdAt
      }
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'A school with this name or a unique field already exists.'
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Invalid school details.'
      });
    }

    console.error('Create school error:', error);

    return res.status(500).json({
      message: 'Failed to register school.'
    });
  }
};


// 1. FETCH VERIFIED APPLICATIONS FOR PRIORITIZATION
exports.getLeaderboard = async (req, res) => {
  try {
    const applications = await Application.find({
      'awardDetails.status': 'Verified'
    })
      .select(
        'applicationNumber applicantId educationDetails.schoolId calculatedScore awardDetails.status createdAt'
      )
      .populate('applicantId', 'profile.fullName profile.ward profile.village')
      .populate('educationDetails.schoolId', 'schoolName category')
      .sort({ calculatedScore: -1 })
      .lean();

    const isBoardOrAdmin = ['admin', 'board'].includes(req.user?.role);

    const leaderboard = applications.map((application) => {
      const item = {
        _id: application._id,
        applicationNumber: application.applicationNumber,
        applicant: application.applicantId
          ? {
              fullName: application.applicantId.profile?.fullName,
              ward: application.applicantId.profile?.ward,
              village: application.applicantId.profile?.village
            }
          : null,
        school: application.educationDetails?.schoolId
          ? {
              schoolName: application.educationDetails.schoolId.schoolName,
              category: application.educationDetails.schoolId.category
            }
          : null,
        status: application.awardDetails.status,
        submittedAt: application.createdAt
      };

      // Only authorized board/admin users can see the private score.
      if (isBoardOrAdmin) {
        item.calculatedScore = application.calculatedScore;
      }

      return item;
    });

    return res.status(200).json({
      count: leaderboard.length,
      data: leaderboard
    });

  } catch (error) {
    console.error('Leaderboard error:', error);

    return res.status(500).json({
      message: 'Unable to fetch the application leaderboard.'
    });
  }
};


// 2. INITIATE BULK DISBURSEMENTS
// This creates PENDING transaction records.
// It does not confirm or transfer money.
exports.executeBatchDisbursement = async (req, res) => {
  const { applicationIds } = req.body;

  if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
    return res.status(400).json({
      message: 'Provide at least one application ID for the batch.'
    });
  }

  // Keep batches manageable. Larger batches can be split.
  if (applicationIds.length > 100) {
    return res.status(400).json({
      message: 'A batch cannot contain more than 100 applications.'
    });
  }

  if (!applicationIds.every((id) => mongoose.isValidObjectId(id))) {
    return res.status(400).json({
      message: 'One or more application IDs are invalid.'
    });
  }

  // Prevent the same application appearing twice in one request.
  const uniqueIds = [...new Set(applicationIds.map(String))];

  if (uniqueIds.length !== applicationIds.length) {
    return res.status(400).json({
      message: 'The batch contains duplicate application IDs.'
    });
  }

  try {
    const results = {
      pending: [],
      failed: []
    };

    const batchReference = `ELP-BATCH-${crypto.randomUUID()}`;

    for (const applicationId of uniqueIds) {
      try {
        const application = await Application.findById(applicationId);

        if (!application) {
          results.failed.push({
            applicationId,
            reason: 'Application not found.'
          });
          continue;
        }

        // Clerk verification alone is not enough for payment.
        if (application.awardDetails?.status !== 'Board-Approved') {
          results.failed.push({
            applicationId,
            applicationNumber: application.applicationNumber,
            reason: 'Application has not been approved by the board.'
          });
          continue;
        }

        const approvedAmount = application.awardDetails.approvedAmount;

        if (
          typeof approvedAmount !== 'number' ||
          !Number.isFinite(approvedAmount) ||
          approvedAmount <= 0
        ) {
          results.failed.push({
            applicationId,
            applicationNumber: application.applicationNumber,
            reason: 'Application has no valid approved amount.'
          });
          continue;
        }

        const schoolId = application.educationDetails?.schoolId;

        if (!schoolId) {
          results.failed.push({
            applicationId,
            applicationNumber: application.applicationNumber,
            reason: 'Application has no linked school.'
          });
          continue;
        }

        const school = await School.findById(schoolId);

        if (!school) {
          results.failed.push({
            applicationId,
            applicationNumber: application.applicationNumber,
            reason: 'The linked school could not be found.'
          });
          continue;
        }

        // Do not initiate a second pending or completed payment.
        const existingTransaction = await Transaction.findOne({
          applicationId: application._id,
          status: { $in: ['Pending', 'Completed'] }
        }).select('_id paymentReference status');

        if (existingTransaction) {
          results.failed.push({
            applicationId,
            applicationNumber: application.applicationNumber,
            reason: 'A pending or completed transaction already exists.',
            paymentReference: existingTransaction.paymentReference,
            transactionStatus: existingTransaction.status
          });
          continue;
        }

        const paymentReference =
          `ELP-${crypto.randomUUID()}`;

        const transaction = await Transaction.create({
          applicationId: application._id,
          schoolId: school._id,
          amountDisbursed: approvedAmount,
          paymentReference,
          status: 'Pending',
          processedBy: req.user.id
        });

        results.pending.push({
          applicationNumber: application.applicationNumber,
          school: school.schoolName,
          amount: transaction.amountDisbursed,
          paymentReference: transaction.paymentReference,
          transactionStatus: transaction.status
        });

      } catch (innerError) {
        console.error(
          `Batch item failed for ${applicationId}:`,
          innerError
        );

        results.failed.push({
          applicationId,
          reason: 'Unable to initiate this transaction.'
        });
      }
    }

    return res.status(200).json({
      message: 'Batch processing finished. Eligible payments are pending confirmation.',
      batchReference,
      summary: {
        requested: applicationIds.length,
        pendingCount: results.pending.length,
        failedCount: results.failed.length
      },
      details: results
    });

  } catch (error) {
    console.error('Bulk disbursement error:', error);

    return res.status(500).json({
      message: 'Unable to process the disbursement batch.'
    });
  }
};


// 3. CONFIGURE THE BURSARY CALENDAR CYCLE
exports.configureBursaryCycle = async (req, res) => {
  const { cycleName, openingDate, closingDate } = req.body;

  if (
    typeof cycleName !== 'string' ||
    !cycleName.trim() ||
    !openingDate ||
    !closingDate
  ) {
    return res.status(400).json({
      message: 'Cycle name, opening date, and closing date are required.'
    });
  }

  const opening = new Date(openingDate);
  const closing = new Date(closingDate);

  if (
    Number.isNaN(opening.getTime()) ||
    Number.isNaN(closing.getTime()) ||
    closing <= opening
  ) {
    return res.status(400).json({
      message: 'Provide valid dates, with closing after opening.'
    });
  }

  try {
    // Deactivate the current cycle only after validating the input.
    // A database transaction is recommended if multiple administrators
    // could configure cycles concurrently.
    await Period.updateMany({}, { isActive: false });

    const newPeriod = await Period.create({
      cycleName: cycleName.trim(),
      openingDate: opening,
      closingDate: closing,
      isActive: true
    });

    return res.status(201).json({
      message: 'Bursary cycle configured successfully.',
      data: newPeriod
    });

  } catch (error) {
    console.error('Configure bursary cycle error:', error);

    return res.status(500).json({
      message: 'Unable to configure the bursary cycle.'
    });
  }
};

/*
 * GET THE ACTIVE BURSARY CYCLE
 * Used by the applicant dashboard to display
 * the application window status and dates.
 */
exports.getActiveBursaryCycle = async (req, res) => {
  try {
    const period = await Period.findOne({
      isActive: true
    })
      .sort({ createdAt: -1 })
      .lean();

    // No active cycle has been configured.
    if (!period) {
      return res.status(200).json({
        message: 'No active bursary cycle is configured.',
        data: null,
        applicationWindowOpen: false
      });
    }

    const now = new Date();

    const openingDate = new Date(period.openingDate);
    const closingDate = new Date(period.closingDate);

    // The application window must be within both dates.
    const applicationWindowOpen =
      period.isActive &&
      now >= openingDate &&
      now <= closingDate;

    return res.status(200).json({
      message: 'Active bursary cycle retrieved successfully.',
      data: {
        _id: period._id,
        cycleName: period.cycleName,
        openingDate: period.openingDate,
        closingDate: period.closingDate,
        isActive: period.isActive,
        applicationWindowOpen
      }
    });
  } catch (error) {
    console.error('Get active bursary cycle error:', error);

    return res.status(500).json({
      message: 'Unable to retrieve the active bursary cycle.'
    });
  }
};


/**
 * TESTING ONLY.
 * Simulates payment confirmation in development.
 * Never use this endpoint to confirm real payments.
 */
exports.simulatePaymentConfirmation = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      message: 'Payment simulation is disabled in production.'
    });
  }

  const { paymentReference } = req.params;

  if (
    typeof paymentReference !== 'string' ||
    !paymentReference.trim()
  ) {
    return res.status(400).json({
      message: 'A payment reference is required.'
    });
  }

  const session = await mongoose.startSession();

  try {
    let responseData;

    await session.withTransaction(async () => {
      const transaction = await Transaction.findOne({
        paymentReference: paymentReference.trim()
      }).session(session);

      if (!transaction) {
        const error = new Error('Transaction not found.');
        error.statusCode = 404;
        throw error;
      }

      if (transaction.status !== 'Pending') {
        const error = new Error(
          `Only Pending transactions can be confirmed. Current status: ${transaction.status}.`
        );
        error.statusCode = 409;
        throw error;
      }

      // Only transition a still-pending transaction.
      const completedTransaction =
        await Transaction.findOneAndUpdate(
          {
            _id: transaction._id,
            status: 'Pending'
          },
          {
            $set: {
              status: 'Completed',
              completedAt: new Date(),
              failureReason: null
            }
          },
          {
            new: true,
            runValidators: true,
            session
          }
        );

      if (!completedTransaction) {
        const error = new Error(
          'Transaction was already processed.'
        );
        error.statusCode = 409;
        throw error;
      }

      // Only mark the application disbursed if it was board-approved.
      const application = await Application.findOneAndUpdate(
        {
          _id: transaction.applicationId,
          'awardDetails.status': 'Board-Approved'
        },
        {
          $set: {
            'awardDetails.status': 'Disbursed'
          }
        },
        {
          returnDocument: 'after',
          runValidators: true,
          session
        }
      );

      if (!application) {
        const error = new Error(
          'Application is not in Board-Approved status. No changes were committed.'
        );
        error.statusCode = 409;
        throw error;
      }

      await AuditLog.create(
        [{
          performedBy: req.user.id,
          applicationId: application._id,
          action: 'Disbursed',
          notes:
            `TEST SIMULATION ONLY. Simulated confirmation for reference ${completedTransaction.paymentReference}, amount KSh ${completedTransaction.amountDisbursed}. This does not prove that real funds were transferred.`,
          ipAddress: req.ip
        }],
        { session }
      );

      responseData = {
        applicationNumber: application.applicationNumber,
        paymentReference: completedTransaction.paymentReference,
        amount: completedTransaction.amountDisbursed,
        transactionStatus: completedTransaction.status,
        applicationStatus: application.awardDetails.status,
        completedAt: completedTransaction.completedAt,
        simulationOnly: true
      };
    });

    return res.status(200).json({
      message: 'Test payment confirmation recorded. No real funds were transferred.',
      data: responseData
    });

  } catch (error) {
    console.error('Payment simulation error:', error);

    return res.status(error.statusCode || 500).json({
      message: error.statusCode
        ? error.message
        : 'Unable to simulate payment confirmation.'
    });

  } finally {
    await session.endSession();
  }
};

