// ============================================================
// ELIMUPLUS CLERK AND BOARD APPLICATION WORKFLOW TESTS
// ============================================================

// PREVENT TEST EXECUTION IN PRODUCTION
if (process.env.NODE_ENV === 'production') {
  throw new Error(
    'SECURITY ERROR: Application workflow tests cannot run in production.'
  );
}

// TEST-ONLY ENVIRONMENT SETTINGS
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'elimuplus-jest-test-secret-only';

// ============================================================
// IMPORTS
// ============================================================

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const app = require('../app');
const User = require('../models/User');
const Application = require('../models/Application');
const AuditLog = require('../models/AuditLog');

let mongoServer;

jest.setTimeout(600000);

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

// ============================================================
// DATABASE SETUP
// ============================================================

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    throw new Error(
      'SECURITY ERROR: Mongoose already has an active database connection.'
    );
  }

  mongoServer = await MongoMemoryReplSet.create({
    replSet: {
      count: 1
    }
  });

  const testMongoUri = mongoServer.getUri();

  if (!testMongoUri.includes('127.0.0.1')) {
    throw new Error(
      'SECURITY ERROR: Unexpected MongoDB test connection.'
    );
  }

  await mongoose.connect(testMongoUri, {
    serverSelectionTimeoutMS: 10000,
    runtimeAdapters: {
      os: require('os')
    }
  });

  await Application.init();
});

// ============================================================
// TEST DATA HELPERS
// ============================================================

const createUser = async (role, suffix) => {
  const user = await User.create({
    phoneNumber: `071100${suffix}`,
    passwordHash: 'test-only-password-hash',
    role,
    profile: {
      fullName: `Test ${role}`,
      nationalID: `TEST${suffix}`,
      ward: 'Ganze',
      village: 'Bamba'
    }
  });

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '5m' }
  );

  return { user, token };
};

const createApplication = async ({
  applicantId,
  applicationNumber,
  status = 'Submitted',
  outstandingFees = 25000,
  documentStatus = 'Pending',
  reviewedBy = null
}) => {
  const document = {
    publicId: 'private/test-document',
    resourceType: 'raw',
    format: 'pdf',
    originalName: 'supporting-document.pdf',
    bytes: 1024
  };

  const documents = {};

  for (const type of DOCUMENT_TYPES) {
    documents[type] = { ...document };
  }

  const documentReviews = {};

  for (const type of DOCUMENT_TYPES) {
    documentReviews[type] = {
      status: documentStatus,
      reviewedBy,
      notes: null,
      reviewedAt: documentStatus === 'Verified' ? new Date() : null
    };
  }

  return Application.create({
    applicationNumber,
    applicantId,
    applicationYear: new Date().getUTCFullYear(),

    vulnerabilityMetrics: {
      familyStatus: 'partial-orphan-single-parent',
      householdIncomeBracket: 'under-10k',
      disabledParents: false,
      chronicIllnessInFamily: false,
      siblingsInSchool: 2
    },

    educationDetails: {
      schoolName: 'Mweza Junior Secondary School',
      studentCategory: 'Junior Secondary',
      admissionNumber: 'MZ-001',
      outstandingFees
    },

    documents,
    documentReviews,

    awardDetails: {
      status
    }
  });
};

beforeEach(async () => {
  await Application.deleteMany({});
  await User.deleteMany({});
  await AuditLog.deleteMany({});
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
});

// ============================================================
// CLERK VERIFICATION TESTS
// ============================================================

describe('Clerk application verification', () => {
  test('clerk can verify an application and all five documents', async () => {
    const applicant = await createUser('applicant', '001');
    const clerk = await createUser('clerk', '002');

    const application = await createApplication({
      applicantId: applicant.user._id,
      applicationNumber: 'GZ-WORKFLOW-001'
    });

    const response = await request(app)
      .put(`/api/applications/${application._id}/verify`)
      .set('Authorization', `Bearer ${clerk.token}`)
      .send({
        action: 'Verified',
        notes: 'All supporting documents checked.'
      });

    expect(response.status).toBe(200);

    const updatedApplication = await Application.findById(application._id);

    expect(updatedApplication.awardDetails.status).toBe('Verified');

    for (const type of DOCUMENT_TYPES) {
      expect(updatedApplication.documentReviews[type].status)
        .toBe('Verified');

      expect(
        updatedApplication.documentReviews[type].reviewedBy.toString()
      ).toBe(clerk.user._id.toString());
    }

    expect(
      updatedApplication.awardDetails.reviewedBy.toString()
    ).toBe(clerk.user._id.toString());

    const auditLog = await AuditLog.findOne({
      applicationId: application._id
    });

    expect(auditLog).not.toBeNull();
    expect(auditLog.action).toBe('Verified');
    expect(auditLog.performedBy.toString())
      .toBe(clerk.user._id.toString());
  });

  test('clerk can reject an application with a reason', async () => {
    const applicant = await createUser('applicant', '003');
    const clerk = await createUser('clerk', '004');

    const application = await createApplication({
      applicantId: applicant.user._id,
      applicationNumber: 'GZ-WORKFLOW-002'
    });

    const response = await request(app)
      .put(`/api/applications/${application._id}/verify`)
      .set('Authorization', `Bearer ${clerk.token}`)
      .send({
        action: 'Rejected',
        notes: 'The submitted documents are incomplete.'
      });

    expect(response.status).toBe(200);

    const updatedApplication = await Application.findById(application._id);

    expect(updatedApplication.awardDetails.status).toBe('Rejected');

    expect(updatedApplication.awardDetails.rejectionReason)
      .toBe('The submitted documents are incomplete.');

    for (const type of DOCUMENT_TYPES) {
      expect(updatedApplication.documentReviews[type].status)
        .toBe('Rejected');
    }

    const auditLog = await AuditLog.findOne({
      applicationId: application._id
    });

    expect(auditLog.action).toBe('Rejected');
  });

  test('clerk cannot reject an application without a reason', async () => {
    const applicant = await createUser('applicant', '005');
    const clerk = await createUser('clerk', '006');

    const application = await createApplication({
      applicantId: applicant.user._id,
      applicationNumber: 'GZ-WORKFLOW-003'
    });

    const response = await request(app)
      .put(`/api/applications/${application._id}/verify`)
      .set('Authorization', `Bearer ${clerk.token}`)
      .send({
        action: 'Rejected',
        notes: '   '
      });

    expect(response.status).toBe(400);

    const updatedApplication = await Application.findById(application._id);

    expect(updatedApplication.awardDetails.status).toBe('Submitted');
    expect(await AuditLog.countDocuments({
      applicationId: application._id
    })).toBe(0);
  });

  test('clerk cannot verify the same application twice', async () => {
    const applicant = await createUser('applicant', '007');
    const clerk = await createUser('clerk', '008');

    const application = await createApplication({
      applicantId: applicant.user._id,
      applicationNumber: 'GZ-WORKFLOW-004'
    });

    const firstResponse = await request(app)
      .put(`/api/applications/${application._id}/verify`)
      .set('Authorization', `Bearer ${clerk.token}`)
      .send({
        action: 'Verified',
        notes: 'Documents checked.'
      });

    expect(firstResponse.status).toBe(200);

    const secondResponse = await request(app)
      .put(`/api/applications/${application._id}/verify`)
      .set('Authorization', `Bearer ${clerk.token}`)
      .send({
        action: 'Verified',
        notes: 'Attempted duplicate verification.'
      });

    expect(secondResponse.status).toBe(409);

    expect(await AuditLog.countDocuments({
      applicationId: application._id
    })).toBe(1);
  });
});

// ============================================================
// BOARD DECISION TESTS
// ============================================================

describe('Board application decisions', () => {
  test('board can approve an application after all documents are verified', async () => {
    const applicant = await createUser('applicant', '009');
    const clerk = await createUser('clerk', '010');
    const board = await createUser('board', '011');

    const application = await createApplication({
      applicantId: applicant.user._id,
      applicationNumber: 'GZ-WORKFLOW-005',
      status: 'Verified',
      documentStatus: 'Verified',
      reviewedBy: clerk.user._id
    });

    const response = await request(app)
      .put(`/api/applications/${application._id}/approve`)
      .set('Authorization', `Bearer ${board.token}`)
      .send({
        action: 'Approved',
        notes: 'Application approved by the board.'
      });

    expect(response.status).toBe(200);

    const updatedApplication = await Application.findById(application._id);

    expect(updatedApplication.awardDetails.status).toBe('Board-Approved');
    expect(updatedApplication.awardDetails.proposedAmount).toBe(15000);
    expect(updatedApplication.awardDetails.approvedAmount).toBe(15000);

    expect(updatedApplication.awardDetails.approvedBy.toString())
      .toBe(board.user._id.toString());

    expect(updatedApplication.awardDetails.approvedAt).toBeInstanceOf(Date);

    // The confidential award amount must not be returned in the response.
    expect(response.body).not.toHaveProperty('approvedAmount');
    expect(response.body).not.toHaveProperty('proposedAmount');

    const auditLog = await AuditLog.findOne({
      applicationId: application._id
    });

    expect(auditLog).not.toBeNull();
    expect(auditLog.action).toBe('Approved');
    expect(auditLog.performedBy.toString())
      .toBe(board.user._id.toString());
  });

  test('board can reject an application with a reason', async () => {
    const applicant = await createUser('applicant', '012');
    const clerk = await createUser('clerk', '013');
    const board = await createUser('board', '014');

    const application = await createApplication({
      applicantId: applicant.user._id,
      applicationNumber: 'GZ-WORKFLOW-006',
      status: 'Verified',
      documentStatus: 'Verified',
      reviewedBy: clerk.user._id
    });

    const response = await request(app)
      .put(`/api/applications/${application._id}/approve`)
      .set('Authorization', `Bearer ${board.token}`)
      .send({
        action: 'Rejected',
        notes: 'The application does not meet the programme requirements.'
      });

    expect(response.status).toBe(200);

    const updatedApplication = await Application.findById(application._id);

    expect(updatedApplication.awardDetails.status).toBe('Rejected');

    expect(updatedApplication.awardDetails.rejectionReason)
      .toBe('The application does not meet the programme requirements.');

    expect(updatedApplication.awardDetails.approvedAmount).toBeNull();
    expect(updatedApplication.awardDetails.approvedBy).toBeNull();
    expect(updatedApplication.awardDetails.approvedAt).toBeNull();

    const auditLog = await AuditLog.findOne({
      applicationId: application._id
    });

    expect(auditLog.action).toBe('Rejected');
  });

  test('board cannot reject an application without a reason', async () => {
    const applicant = await createUser('applicant', '015');
    const clerk = await createUser('clerk', '016');
    const board = await createUser('board', '017');

    const application = await createApplication({
      applicantId: applicant.user._id,
      applicationNumber: 'GZ-WORKFLOW-007',
      status: 'Verified',
      documentStatus: 'Verified',
      reviewedBy: clerk.user._id
    });

    const response = await request(app)
      .put(`/api/applications/${application._id}/approve`)
      .set('Authorization', `Bearer ${board.token}`)
      .send({
        action: 'Rejected',
        notes: '   '
      });

    expect(response.status).toBe(400);

    const updatedApplication = await Application.findById(application._id);

    expect(updatedApplication.awardDetails.status).toBe('Verified');

    expect(await AuditLog.countDocuments({
      applicationId: application._id
    })).toBe(0);
  });

  test('board cannot approve an application that has not been clerk-verified', async () => {
    const applicant = await createUser('applicant', '018');
    const board = await createUser('board', '019');

    const application = await createApplication({
      applicantId: applicant.user._id,
      applicationNumber: 'GZ-WORKFLOW-008',
      status: 'Submitted',
      documentStatus: 'Pending'
    });

    const response = await request(app)
      .put(`/api/applications/${application._id}/approve`)
      .set('Authorization', `Bearer ${board.token}`)
      .send({
        action: 'Approved',
        notes: 'Attempted approval.'
      });

    expect(response.status).toBe(409);

    const updatedApplication = await Application.findById(application._id);

    expect(updatedApplication.awardDetails.status).toBe('Submitted');

    expect(await AuditLog.countDocuments({
      applicationId: application._id
    })).toBe(0);
  });

  test('board cannot approve until all five documents are verified', async () => {
    const applicant = await createUser('applicant', '020');
    const clerk = await createUser('clerk', '021');
    const board = await createUser('board', '022');

    const application = await createApplication({
      applicantId: applicant.user._id,
      applicationNumber: 'GZ-WORKFLOW-009',
      status: 'Verified',
      documentStatus: 'Verified',
      reviewedBy: clerk.user._id
    });

    await Application.updateOne(
      { _id: application._id },
      {
        $set: {
          'documentReviews.reportCard.status': 'Pending'
        }
      }
    );

    const response = await request(app)
      .put(`/api/applications/${application._id}/approve`)
      .set('Authorization', `Bearer ${board.token}`)
      .send({
        action: 'Approved',
        notes: 'Attempted approval with an unverified document.'
      });

    expect(response.status).toBe(409);

    const updatedApplication = await Application.findById(application._id);

    expect(updatedApplication.awardDetails.status).toBe('Verified');
    expect(updatedApplication.awardDetails.approvedAmount).toBeFalsy();

    expect(await AuditLog.countDocuments({
      applicationId: application._id
    })).toBe(0);
  });

  test('board cannot approve an award greater than outstanding fees', async () => {
    const applicant = await createUser('applicant', '023');
    const clerk = await createUser('clerk', '024');
    const board = await createUser('board', '025');

    const application = await createApplication({
      applicantId: applicant.user._id,
      applicationNumber: 'GZ-WORKFLOW-010',
      status: 'Verified',
      documentStatus: 'Verified',
      reviewedBy: clerk.user._id,
      outstandingFees: 10000
    });

    const response = await request(app)
      .put(`/api/applications/${application._id}/approve`)
      .set('Authorization', `Bearer ${board.token}`)
      .send({
        action: 'Approved',
        notes: 'Attempted approval above outstanding fees.'
      });

    expect(response.status).toBe(409);

    const updatedApplication = await Application.findById(application._id);

    expect(updatedApplication.awardDetails.status).toBe('Verified');
    expect(updatedApplication.awardDetails.approvedAmount).toBeFalsy();

    expect(await AuditLog.countDocuments({
      applicationId: application._id
    })).toBe(0);
  });

  test('board cannot make a second decision on an already approved application', async () => {
    const applicant = await createUser('applicant', '026');
    const clerk = await createUser('clerk', '027');
    const board = await createUser('board', '028');

    const application = await createApplication({
      applicantId: applicant.user._id,
      applicationNumber: 'GZ-WORKFLOW-011',
      status: 'Verified',
      documentStatus: 'Verified',
      reviewedBy: clerk.user._id
    });

    const firstResponse = await request(app)
      .put(`/api/applications/${application._id}/approve`)
      .set('Authorization', `Bearer ${board.token}`)
      .send({
        action: 'Approved',
        notes: 'First board decision.'
      });

    expect(firstResponse.status).toBe(200);

    const secondResponse = await request(app)
      .put(`/api/applications/${application._id}/approve`)
      .set('Authorization', `Bearer ${board.token}`)
      .send({
        action: 'Rejected',
        notes: 'Attempted second board decision.'
      });

    expect(secondResponse.status).toBe(409);

    const updatedApplication = await Application.findById(application._id);

    expect(updatedApplication.awardDetails.status).toBe('Board-Approved');

    expect(await AuditLog.countDocuments({
      applicationId: application._id
    })).toBe(1);
  });
});

// ============================================================
// ROLE AUTHORIZATION TEST
// ============================================================

describe('Workflow role authorization', () => {
  test('an applicant cannot verify an application as a clerk', async () => {
    const applicant = await createUser('applicant', '029');
    const anotherApplicant = await createUser('applicant', '030');

    const application = await createApplication({
      applicantId: anotherApplicant.user._id,
      applicationNumber: 'GZ-WORKFLOW-012'
    });

    const response = await request(app)
      .put(`/api/applications/${application._id}/verify`)
      .set('Authorization', `Bearer ${applicant.token}`)
      .send({
        action: 'Verified',
        notes: 'Unauthorized verification attempt.'
      });

    expect(response.status).toBe(403);

    const updatedApplication = await Application.findById(application._id);

    expect(updatedApplication.awardDetails.status).toBe('Submitted');

    expect(await AuditLog.countDocuments({
      applicationId: application._id
    })).toBe(0);
  });
});
