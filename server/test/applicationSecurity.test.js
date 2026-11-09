
// ============================================================
// ELIMUPLUS APPLICANT APPLICATION SECURITY TESTS
// ============================================================

// PREVENT TEST EXECUTION IN PRODUCTION
if (process.env.NODE_ENV === 'production') {
  throw new Error(
    'SECURITY ERROR: Application security tests cannot run in production.'
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
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../app');
const User = require('../models/User');
const Application = require('../models/Application');
const Period = require('../models/Period');

let mongoServer;

jest.setTimeout(600000);

// ============================================================
// DATABASE SETUP
// ============================================================

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    throw new Error(
      'SECURITY ERROR: Mongoose already has an active database connection.'
    );
  }

  mongoServer = await MongoMemoryServer.create();

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

beforeEach(async () => {
  await Application.deleteMany({});
  await User.deleteMany({});
  await Period.deleteMany({});
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
});

// CREATE TEST APPLICANT
const createApplicant = async (phoneNumber, nationalID) => {
  const user = await User.create({
    phoneNumber,
    passwordHash: 'test-only-password-hash',
    role: 'applicant',
    profile: {
      fullName: 'Test Applicant',
      nationalID,
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

// CREATE TEST APPLICATION
const createApplication = async (applicantId, applicationNumber) => {
  const document = {
    publicId: 'private/test-document',
    resourceType: 'raw',
    format: 'pdf',
    originalName: 'supporting-document.pdf',
    bytes: 1024
  };

  return Application.create({
    applicationNumber,
    applicantId,
    applicationYear: new Date().getUTCFullYear(),

    vulnerabilityMetrics: {
      familyStatus: 'both-parents-alive',
      householdIncomeBracket: 'under-10k',
      disabledParents: false,
      chronicIllnessInFamily: false,
      siblingsInSchool: 2
    },

    calculatedScore: 59,

    educationDetails: {
      schoolName: 'Mweza Junior Secondary School',
      studentCategory: 'Junior Secondary',
      admissionNumber: 'MZ-001',
      outstandingFees: 25000
    },

    documents: {
      chiefLetter: document,
      feeStructure: document,
      reportCard: document,
      parentIDOrDeathCertificate: document,
      studentIDOrBirthCert: document
    },

    documentReviews: {
      chiefLetter: {
        status: 'Verified',
        reviewedBy: new mongoose.Types.ObjectId(),
        notes: 'Document checked.',
        reviewedAt: new Date()
      }
    },

    awardDetails: {
      status: 'Submitted',
      proposedAmount: 15000
    }
  });
};

// CREATE ACTIVE TEST BURSARY PERIOD
const createActivePeriod = async () => {
  return Period.create({
    cycleName: 'ElimuPlus Security Test Cycle',
    openingDate: new Date('2020-01-01T00:00:00.000Z'),
    closingDate: new Date('2099-12-31T23:59:59.000Z'),
    isActive: true
  });
};

// ============================================================
// APPLICANT APPLICATION SECURITY TESTS
// ============================================================

describe('ElimuPlus Applicant Application Security Tests', () => {

  // TEST 1: AUTHENTICATION REQUIRED
  test('Should reject access without an authentication token', async () => {
    const response = await request(app)
      .get('/api/applications/my-application');

    expect(response.statusCode).toBe(401);
  });

  // TEST 2: APPLICANT WITHOUT AN APPLICATION
  test('Should return 404 when an authenticated applicant has no application', async () => {
    const { token } = await createApplicant(
      '0711000001',
      '91000001'
    );

    const response = await request(app)
      .get('/api/applications/my-application')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe(
      'You have not submitted an application yet.'
    );
  });

  // TEST 3: APPLICANT CAN ACCESS OWN APPLICATION
  test('Should allow an applicant to retrieve their own application', async () => {
    const { user, token } = await createApplicant(
      '0711000002',
      '91000002'
    );

    await createApplication(user._id, 'GZ-SECURITY-001');

    const response = await request(app)
      .get('/api/applications/my-application')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.application.applicationNumber).toBe(
      'GZ-SECURITY-001'
    );

    expect(response.body.application.educationDetails.schoolName).toBe(
      'Mweza Junior Secondary School'
    );

    expect(response.body.application.documents.chiefLetter.originalName)
      .toBe('supporting-document.pdf');
  });

  // TEST 4: APPLICANT CANNOT ACCESS ANOTHER APPLICANT'S APPLICATION
  test('Should never return another applicant application', async () => {
    const firstApplicant = await createApplicant(
      '0711000003',
      '91000003'
    );

    const secondApplicant = await createApplicant(
      '0711000004',
      '91000004'
    );

    await createApplication(
      firstApplicant.user._id,
      'GZ-SECURITY-002'
    );

    await createApplication(
      secondApplicant.user._id,
      'GZ-SECURITY-003'
    );

    const response = await request(app)
      .get('/api/applications/my-application')
      .set('Authorization', `Bearer ${firstApplicant.token}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.application.applicationNumber).toBe(
      'GZ-SECURITY-002'
    );

    expect(response.body.application.applicationNumber).not.toBe(
      'GZ-SECURITY-003'
    );
  });

  // TEST 5: CONFIDENTIAL AWARD INFORMATION MUST REMAIN PRIVATE
  test('Should never expose confidential scoring or proposed award amounts', async () => {
    const { user, token } = await createApplicant(
      '0711000005',
      '91000005'
    );

    await createApplication(user._id, 'GZ-SECURITY-004');

    const response = await request(app)
      .get('/api/applications/my-application')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.application).not.toHaveProperty('calculatedScore');
    expect(response.body.application).not.toHaveProperty('proposedAmount');
    expect(response.body.application).not.toHaveProperty('awardDetails');

    const responseText = JSON.stringify(response.body);

    expect(responseText).not.toContain('calculatedScore');
    expect(responseText).not.toContain('proposedAmount');
  });

  // TEST 6: INTERNAL DOCUMENT AND REVIEWER INFORMATION MUST REMAIN PRIVATE
  test('Should never expose Cloudinary IDs or internal reviewer IDs', async () => {
    const { user, token } = await createApplicant(
      '0711000006',
      '91000006'
    );

    await createApplication(user._id, 'GZ-SECURITY-005');

    const response = await request(app)
      .get('/api/applications/my-application')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);

    const application = response.body.application;

    expect(application.documents.chiefLetter).not.toHaveProperty('publicId');

    expect(application.documentReviews.chiefLetter)
      .not.toHaveProperty('reviewedBy');

    const responseText = JSON.stringify(response.body);

    expect(responseText).not.toContain('private/test-document');
    expect(responseText).not.toContain('reviewedBy');
  });

  // TEST 7: ONE APPLICATION PER APPLICANT PER CALENDAR YEAR
  test('Should reject a second application from the same applicant in the same calendar year', async () => {

    // 1. Create an authenticated applicant.
    const { user, token } = await createApplicant(
      '0711000007',
      '91000007'
    );

    // 2. Activate the bursary application period.
    await createActivePeriod();

    // 3. Create the applicant's existing application.
    await createApplication(
      user._id,
      'GZ-SECURITY-DUPLICATE-001'
    );

    // 4. Prepare valid PDF test documents.
    const pdfBuffer = Buffer.from(
      '%PDF-1.4\nElimuPlus security test document'
    );

    // 5. Attempt to submit another application.
    const response = await request(app)
      .post('/api/applications/submit')
      .set('Authorization', `Bearer ${token}`)

      .field('familyStatus', 'both-parents-alive')
      .field('householdIncomeBracket', 'under-10k')
      .field('schoolName', 'Mweza Junior Secondary School')
      .field('studentCategory', 'Junior Secondary')
      .field('admissionNumber', 'MZ-002')
      .field('outstandingFees', '25000')
      .field('siblingsInSchool', '2')
      .field('disabledParents', 'false')
      .field('chronicIllnessInFamily', 'false')

      .attach('chiefLetter', pdfBuffer, {
        filename: 'chief-letter.pdf',
        contentType: 'application/pdf'
      })
      .attach('feeStructure', pdfBuffer, {
        filename: 'fee-structure.pdf',
        contentType: 'application/pdf'
      })
      .attach('reportCard', pdfBuffer, {
        filename: 'report-card.pdf',
        contentType: 'application/pdf'
      })
      .attach('parentIDOrDeathCertificate', pdfBuffer, {
        filename: 'parent-id.pdf',
        contentType: 'application/pdf'
      })
      .attach('studentIDOrBirthCert', pdfBuffer, {
        filename: 'student-id.pdf',
        contentType: 'application/pdf'
      });

    // 6. Confirm the duplicate submission is rejected.
    expect(response.statusCode).toBe(409);

    expect(response.body.message).toBe(
      'You have already submitted an application for this calendar year.'
    );

    // 7. Confirm only one application exists.
    const applicationCount = await Application.countDocuments({
      applicantId: user._id
    });

    expect(applicationCount).toBe(1);
  });

});
