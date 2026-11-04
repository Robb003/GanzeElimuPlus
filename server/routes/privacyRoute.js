const express = require('express');
const router = express.Router();

const {
  recordPrivacyAcknowledgement,
  getMyPrivacyAcknowledgement,
} = require('../controllers/privacyController');

const { protect } = require('../middleware/authMiddleware');

router.post(
  '/acknowledgement',
  protect,
  recordPrivacyAcknowledgement
);

router.get(
  '/my-acknowledgement',
  protect,
  getMyPrivacyAcknowledgement
);

module.exports = router;