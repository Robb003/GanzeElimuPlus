const Application = require('../models/Application');
const AuditLog = require('../models/AuditLog');

// @desc    Submit a new bursary application (With Student ID/Birth Cert handling)
// @route   POST /api/applications/submit
// @access  Private (Applicants / Agents only)
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
    studentIDOrBirthCertUrl //  Handled from incoming request body
  } = req.body;

  try {
    // SECURITY CHECK: Prevent duplicate applications in the same active cycle
    const currentYear = new Date().getFullYear();
    const existingApplication = await Application.findOne({
      applicantId: req.user.id,
      createdAt: { $gte: new Date(`${currentYear}-01-01`) }
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already submitted an active bursary application for this calendar year.' });
    }

    // GENERATE RANDOM UNIQUE APPLICATION NUMBER FOR BLIND REVIEWS
    const trackingID = `EP-${currentYear}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create the record. Our pre-save schema hook automatically calculates the vulnerability score!
    const application = await Application.create({
      applicationNumber: trackingID,
      applicantId: req.user.id,
      vulnerabilityMetrics: {
        familyStatus,
        householdIncomeBracket,
        disabledParents: disabledParents || false,
        chronicIllnessInFamily: chronicIllnessInFamily || false,
        siblingsInSchool: siblingsInSchool || 0
      },
      educationDetails: {
        schoolId,
        studentCategory,
        admissionNumber,
        outstandingFees
      },
      documents: {
        chiefLetterUrl,
        feeStructureUrl,
        reportCardUrl,
        parentIDOrDeathCertificateUrl,
        studentIDOrBirthCertUrl //  Committed to database document cluster
      }
    });

    res.status(201).json({
      message: "Application submitted successfully. Live tracking code generated.",
      applicationNumber: application.applicationNumber,
      calculatedNeedScore: application.calculatedScore
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Fetch a completely anonymous list of applications for verification (Blind Review)
// @route   GET /api/applications/review-queue
// @access  Private (Clerks / Admins only)
exports.getReviewQueue = async (req, res) => {
  try {
    // THE BLIND REVIEW WALL: We select everything EXCEPT the applicantId link!
    // This blocks clerks from seeing names, photos, or exact home locations.
    const queue = await Application.find({ status: 'Submitted' })
      .select('-applicantId') 
      .populate('educationDetails.schoolId', 'schoolName category') // Pulls school name for audit
      .sort({ calculatedScore: -1 }); //Sorts automatically by highest vulnerability score first

    res.json(queue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Process a verification or rejection decision on an application
// @route   PUT /api/applications/:id/verify
// @access  Private (Clerks only)
exports.processVerification = async (req, res) => {
  const { id } = req.params;
  const { action, notes } = req.body; // Action must be 'Verified' or 'Rejected'

  if (!['Verified', 'Rejected'].includes(action)) {
    return res.status(400).json({ message: 'Invalid administrative action payload.' });
  }

  try {
    // 1. Update application record state
    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Target application record not found.' });
    }

    application.status = action;
    if (action === 'Rejected') {
      application.rejectionReason = notes || "Submitted documents did not meet requirements.";
    }
    application.reviewedBy = req.user.id;
    await application.save();

    // 2. ENFORCE INDELIBLE AUDIT TRAIL LOGGING
    await AuditLog.create({
      clerkId: req.user.id,
      applicationId: application._id,
      action: action,
      notes: notes || `Application explicitly marked as ${action} during queue sweep.`,
      ipAddress: req.ip
    });

    res.json({ message: `Application tracking status successfully updated to [${action}]. Audit trail committed.` });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
