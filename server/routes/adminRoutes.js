const express = require('express');
const router = express.Router();
const { 
  getLeaderboard, 
  executeDisbursement, 
  executeBatchDisbursement,
  configureBursaryCycle
} = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

//  ADMIN LEADERBOARD GATEWAY: Pulls clerk-verified students sorted by vulnerability points
// Endpoint: GET /api/admin/leaderboard
router.get(
  '/getleaderboard', 
  protect, 
  authorizeRoles('admin'), 
  getLeaderboard
);

// INDIVIDUAL DISBURSEMENT GATEWAY: Releases funds to an individual student's school account
// Endpoint: POST /api/admin/disburse/:applicationId
router.post(
  '/disburse/:applicationId', 
  protect, 
  authorizeRoles('admin'), 
  executeDisbursement,
);

router.post('/set-cycle', protect, authorizeRoles('admin'), configureBursaryCycle);


// BATCH DISBURSEMENT GATEWAY: Loops through a compilation array of IDs to pay schools in bulk
// Endpoint: POST /api/admin/disburse-batch
router.post(
  '/disburse-batch', 
  protect, 
  authorizeRoles('admin'), 
  executeBatchDisbursement
);

module.exports = router;
