const Period = require('../models/Period');

const checkApplicationWindow = async (req, res, next) => {
  try {
    // Locate the active cycle setup inside MongoDB
    const activePeriod = await Period.findOne({ isActive: true });

    if (!activePeriod) {
      return res.status(403).json({ 
        message: "Submission blocked. There is currently no active bursary cycle configured by the administration." 
      });
    }

    const now = new Date();

    //  BOUNDARY CHECK 1: Before Opening Date
    if (now < activePeriod.openingDate) {
      return res.status(403).json({ 
        message: `Submission blocked. The application portal opens on ${activePeriod.openingDate.toDateString()}.` 
      });
    }

    // BOUNDARY CHECK 2: After Closing Deadline
    if (now > activePeriod.closingDate) {
      return res.status(403).json({ 
        message: `Submission blocked. The deadline for this cycle passed on ${activePeriod.closingDate.toDateString()}.` 
      });
    }

    // The current date is perfectly valid! Proceed to application submission.
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = checkApplicationWindow;
