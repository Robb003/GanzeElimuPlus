const express = require('express');
const router = express.Router();
const { 
  submitApplication, 
  getReviewQueue, 
  processVerification 
} = require('../controllers/applicationController');
const checkApplicationWindow = require('../middleware/windowMiddleware');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const Application = require('../models/Application');
const Transaction = require('../models/Transaction');

//  APPLICANT GATEWAY: Only logged-in applicants or trusted agents can submit forms
// Endpoint: POST /api/applications/submit
router.post(
  '/submit', 
  protect, 
  authorizeRoles('applicant', 'agent'), 
  checkApplicationWindow,
  submitApplication
);

// CLERK REVIEW QUEUE GATEWAY: Only clerks and admins can pull the blind review queue data
// Endpoint: GET /api/applications/review-queue
router.get(
  '/review-queue', 
  protect, 
  authorizeRoles('clerk', 'admin'), 
  getReviewQueue
);

// CLERK AUDIT GATEWAY: Only clerks can process individual verification approvals/rejections
// Endpoint: PUT /api/applications/:id/verify
router.put(
  '/:id/verify', 
  protect, 
  authorizeRoles('clerk'), 
  processVerification
);

//PUBLIC TRANSPARENCY LEDGER ENDPOINT (Open to the whole community - No login required)
// Endpoint: GET /api/applications/public-ledger
router.get('/public-ledger', async (req, res) => {
  try {
    const totalTransactions = await Transaction.find()
      .populate('schoolId', 'schoolName category')
      .select('amountDisbursed paymentReference createdAt');

    res.json({
      message: "Public transparency ledger fetched successfully for the community.",
      count: totalTransactions.length,
      data: totalTransactions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
