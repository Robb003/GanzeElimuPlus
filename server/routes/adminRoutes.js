
const express = require('express');
const router = express.Router();

const {
  createSchool,
  getLeaderboard,
  executeBatchDisbursement,
  configureBursaryCycle,
  getActiveBursaryCycle,
  simulatePaymentConfirmation
} = require('../controllers/adminController');

const {
  protect,
  authorizeRoles
} = require('../middleware/authMiddleware');

// 1. Register a school
// POST /api/admin/schools
router.post(
  '/schools',
  protect,
  authorizeRoles('admin'),
  createSchool
);

// 2. Fetch the application leaderboard
// GET /api/admin/getleaderboard
router.get(
  '/getleaderboard',
  protect,
  authorizeRoles('admin'),
  getLeaderboard
);

// 3. Configure the bursary cycle
// POST /api/admin/set-cycle
router.post(
  '/set-cycle',
  protect,
  authorizeRoles('admin'),
  configureBursaryCycle
);
router.get(
  '/active-cycle',
  protect,
  getActiveBursaryCycle
);

// 4. Initiate bulk disbursement
// POST /api/admin/disburse-batch
router.post(
  '/disburse-batch',
  protect,
  authorizeRoles('admin'),
  executeBatchDisbursement
);
// TESTING ONLY  simulate a payment confirmation in development.
router.post(
  '/test-confirm-payment/:paymentReference',
  protect,
  authorizeRoles('admin'),
  simulatePaymentConfirmation
);

module.exports = router;
