
const express = require('express');
const router = express.Router();

const {
  submitApplication,
  getReviewQueue,
  processVerification,
  approveApplication,
  getBoardReviewQueue
} = require('../controllers/applicationController');

const checkApplicationWindow = require('../middleware/windowMiddleware');
const {
  protect,
  authorizeRoles
} = require('../middleware/authMiddleware');

const Transaction = require('../models/Transaction');

// APPLICANT GATEWAY
// POST /api/applications/submit
// Only authenticated applicants may submit through this endpoint.
// Agents require a separate, explicitly authorized workflow.
router.post(
  '/submit',
  protect,
  authorizeRoles('applicant'),
  checkApplicationWindow,
  submitApplication
);

// CLERK REVIEW QUEUE
// GET /api/applications/review-queue
// Clerks and authorized admins can view the score-blind queue.
router.get(
  '/review-queue',
  protect,
  authorizeRoles('clerk', 'admin'),
  getReviewQueue
);

// DOCUMENT VERIFICATION
// PUT /api/applications/:id/verify
// Only authenticated clerks can verify submitted applications.
// This endpoint must not approve or disburse bursaries.
router.put(
  '/:id/verify',
  protect,
  authorizeRoles('clerk'),
  processVerification
);
router.get(
  '/board-queue',
  protect,
  authorizeRoles('board', 'admin'),
  getBoardReviewQueue
);


router.put(
  '/:id/approve',
  protect,
  authorizeRoles('board', 'admin'),
  approveApplication
);


// PUBLIC TRANSPARENCY LEDGER
// GET /api/applications/public-ledger
// Public output must contain only explicitly approved information.
// Never return applicant IDs, identity documents, or private details.
router.get('/public-ledger', async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .select('amountDisbursed createdAt schoolId')
      .populate('schoolId', 'schoolName category')
      .sort({ createdAt: -1 })
      .lean();

    // Explicitly construct the public response rather than returning
    // complete database records.
    const publicTransactions = transactions.map((transaction) => ({
      school: transaction.schoolId
        ? {
            schoolName: transaction.schoolId.schoolName,
            category: transaction.schoolId.category
          }
        : null,
      amountDisbursed: transaction.amountDisbursed,
      date: transaction.createdAt
    }));

    return res.status(200).json({
      message: 'Public transparency ledger fetched successfully.',
      count: publicTransactions.length,
      data: publicTransactions
    });
  } catch (error) {
    console.error('Public ledger error:', error);

    return res.status(500).json({
      message: 'Unable to retrieve the public transparency ledger.'
    });
  }
});

module.exports = router;
