const Application = require('../models/Application');
const School = require('../models/School');
const Transaction = require('../models/Transaction');

//1. FETCH THE PRIORITIZED LEADERBOARD OF VERIFIED STUDENTS
exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Application.find({ status: 'Verified' })
      .populate('applicantId', 'profile.fullName profile.ward profile.village')
      .populate('educationDetails.schoolId', 'schoolName category bankDetails')
      .sort({ calculatedScore: -1 });

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. EXECUTE INDIVIDUAL DISBURSEMENT
exports.executeDisbursement = async (req, res) => {
  const { applicationId } = req.params;
  const { amountToDisburse } = req.body;

  try {
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application profile record not found.' });
    }

    if (application.status !== 'Verified') {
      return res.status(400).json({ message: 'Disbursement aborted. Application has not passed clerk verification.' });
    }

    const school = await School.findById(application.educationDetails.schoolId);
    if (!school) {
      return res.status(404).json({ message: 'Target school bank profile mapping missing.' });
    }

    const systemTraceID = `EFT-KCB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const transaction = await Transaction.create({
      applicationId: application._id,
      schoolId: school._id,
      amountDisbursed: amountToDisburse,
      paymentReference: systemTraceID,
      status: 'Completed'
    });

    application.status = 'Disbursed';
    await application.save();

    res.status(201).json({
      message: `Financial disbursement executed successfully. Funds routed straight to ${school.schoolName}.`,
      paymentReference: transaction.paymentReference,
      amount: transaction.amountDisbursed,
      bankAccountTarget: school.bankDetails.accountNumber
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. EXECUTE BULK BATCH DISBURSEMENTS
exports.executeBatchDisbursement = async (req, res) => {
  const { applicationIds, amountPerStudent } = req.body;

  if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
    return res.status(400).json({ message: 'Batch compilation aborted. No target application IDs provided.' });
  }

  try {
    const results = { successful: [], failed: [] };
    const batchManifestID = `BATCH-KCB-${Date.now()}`;

    for (const appId of applicationIds) {
      try {
        const application = await Application.findById(appId);
        
        if (!application || application.status !== 'Verified') {
          results.failed.push({ appId, reason: "Application record missing or not clerk-verified." });
          continue;
        }

        const school = await School.findById(application.educationDetails.schoolId);
        if (!school) {
          results.failed.push({ appId, reason: "Target institution profile links broken." });
          continue;
        }

        const systemTraceID = `EFT-${batchManifestID}-${Math.floor(1000 + Math.random() * 9000)}`;
        
        await Transaction.create({
          applicationId: application._id,
          schoolId: school._id,
          amountDisbursed: amountPerStudent || application.educationDetails.outstandingFees,
          paymentReference: systemTraceID,
          status: 'Completed'
        });

        application.status = 'Disbursed';
        await application.save();

        results.successful.push({
          applicationNumber: application.applicationNumber,
          school: school.schoolName,
          amount: amountPerStudent || application.educationDetails.outstandingFees
        });

      } catch (innerError) {
        results.failed.push({ appId, reason: innerError.message });
      }
    }

    res.status(200).json({
      message: `Batch execution finalized under tracker reference [${batchManifestID}].`,
      summary: {
        totalProcessed: applicationIds.length,
        successfulCount: results.successful.length,
        failedCount: results.failed.length
      },
      details: results
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. CONFIGURE THE BURSARY CALENDAR CYCLE TIMELINES
exports.configureBursaryCycle = async (req, res) => {
  const { cycleName, openingDate, closingDate } = req.body;

  try {
    await require('../models/Period').updateMany({}, { isActive: false });

    const newPeriod = await require('../models/Period').create({
      cycleName,
      openingDate: new Date(openingDate),
      closingDate: new Date(closingDate),
      isActive: true
    });

    res.status(201).json({
      message: "Bursary application cycle timelines configured and activated successfully.",
      data: newPeriod
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
