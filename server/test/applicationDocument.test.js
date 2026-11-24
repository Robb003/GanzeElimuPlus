// ============================================================
// ELIMUPLUS PRIVATE APPLICATION DOCUMENT SECURITY TESTS
// ============================================================

if (process.env.NODE_ENV === 'production') {
  throw new Error(
    'SECURITY ERROR: Document security tests cannot run in production.'
  );
}

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'elimuplus-jest-test-secret-only';

// ============================================================
// MOCK CLOUDINARY BEFORE IMPORTING THE APPLICATION
// ============================================================

jest.mock('../Config/cloudinary', () => ({
  utils: {
    private_download_url: jest.fn()
  }
}));

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
const cloudinary = require('../Config/cloudinary');

let mongoServer;
const originalFetch = global.fetch;

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
// TEST DATA SETUP
// ============================================================

beforeEach(async () => {
  await Application.deleteMany({});
  await User.deleteMany({});

  global.fetch = jest.fn();

  cloudinary.utils.private_download_url.mockReset();
  cloudinary.utils.private_download_url.mockReturnValue(
    'https://private-cloudinary-test.example/document.pdf'
  );
});

afterAll(async () => {
  global.fetch = originalFetch;

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
});

// ============================================================
// AUTHENTICATION HELPER
// ============================================================

const createAuthenticatedUser = async (role) => {
  const uniqueValue = `${Date.now()}${Math.floor(Math.random() * 100000)}`;

  const user = await User.create({
    phoneNumber: `07${uniqueValue}`.slice(0, 15),
    passwordHash: 'test-only-password-hash',
    role,
    profile: {
      fullName: `Test ${role}`,
      nationalID: uniqueValue,
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

// ============================================================
// APPLICATION FIXTURE
// ============================================================

const createTestApplication = async (applicantId) => {
  const document = {
    publicId: 'elimuplus/test/private-document',
    resourceType: 'raw',
    format: 'pdf',
    originalName: 'supporting-document.pdf',
    bytes: 1024
  };

  return Application.create({
    applicationNumber: 'GZ-DOCUMENT-TEST-001',
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

    awardDetails: {
      status: 'Submitted',
      proposedAmount: 15000
    }
  });
};

// ============================================================
// PDF RESPONSE HELPER
// ============================================================

const pdfResponseParser = (res, callback) => {
  const chunks = [];

  res.on('data', (chunk) => chunks.push(chunk));

  res.on('end', () => {
    callback(null, Buffer.concat(chunks));
  });

  res.on('error', callback);
};

// ============================================================
// PRIVATE DOCUMENT ACCESS TESTS
// ============================================================

describe('ElimuPlus Private Application Document Security Tests', () => {

  // TEST 1: AUTHENTICATION REQUIRED

  test('Should reject document access without an authentication token', async () => {
    const applicationId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .get(`/api/applications/${applicationId}/documents/chiefLetter`);

    expect(response.statusCode).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // TEST 2: APPLICANT DENIED

  // TEST 3: AGENT DENIED

  // TEST 4: BOARD DENIED

  test.each(['applicant', 'agent', 'board'])(
    'Should deny document access to the %s role',
    async (role) => {
      const { token } = await createAuthenticatedUser(role);
      const applicationId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/applications/${applicationId}/documents/chiefLetter`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(403);

      expect(response.body.message).toBe(
        'Access denied. You do not have permission to access this resource.'
      );

      expect(global.fetch).not.toHaveBeenCalled();
    }
  );

  // TEST 5 AND 6: CLERK AND ADMIN CAN RETRIEVE DOCUMENTS

  test.each(['clerk', 'admin'])(
    'Should allow the %s to retrieve a private PDF document',
    async (role) => {
      const { user, token } = await createAuthenticatedUser(role);

      const application = await createTestApplication(user._id);

      const pdfBuffer = Buffer.from(
        '%PDF-1.7\nElimuPlus private document test'
      );

      global.fetch.mockResolvedValue(
        new Response(pdfBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf'
          }
        })
      );

      const response = await request(app)
        .get(
          `/api/applications/${application._id}/documents/chiefLetter`
        )
        .set('Authorization', `Bearer ${token}`)
        .buffer(true)
        .parse(pdfResponseParser);

      expect(response.statusCode).toBe(200);

      expect(response.headers['content-type']).toMatch(
        /application\/pdf/
      );

      expect(response.headers['content-disposition']).toBe(
        'inline; filename="chiefLetter.pdf"'
      );

      expect(response.headers['x-content-type-options']).toBe('nosniff');

      expect(response.headers['cache-control']).toContain('no-store');

      expect(response.body.toString()).toBe(pdfBuffer.toString());

      expect(cloudinary.utils.private_download_url).toHaveBeenCalledWith(
        application.documents.chiefLetter.publicId,
        'pdf',
        expect.objectContaining({
          resource_type: 'raw',
          type: 'authenticated',
          expires_at: expect.any(Number)
        })
      );

      expect(global.fetch).toHaveBeenCalledWith(
        'https://private-cloudinary-test.example/document.pdf',
        { redirect: 'error' }
      );

      // The signed Cloudinary URL must never appear in the response.
      expect(response.body.toString()).not.toContain(
        'private-cloudinary-test.example'
      );
    }
  );

  // TEST 7: INVALID APPLICATION ID

  test('Should reject an invalid application identifier', async () => {
    const { token } = await createAuthenticatedUser('clerk');

    const response = await request(app)
      .get('/api/applications/invalid-id/documents/chiefLetter')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(
      'Invalid application identifier.'
    );

    expect(global.fetch).not.toHaveBeenCalled();
  });

  // TEST 8: INVALID DOCUMENT TYPE

  test('Should reject an unsupported document type', async () => {
    const { token } = await createAuthenticatedUser('clerk');
    const applicationId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .get(`/api/applications/${applicationId}/documents/passport`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Invalid document type.');

    expect(global.fetch).not.toHaveBeenCalled();
  });

  // TEST 9: APPLICATION DOES NOT EXIST

  test('Should return 404 when the application does not exist', async () => {
    const { token } = await createAuthenticatedUser('clerk');
    const applicationId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .get(`/api/applications/${applicationId}/documents/chiefLetter`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('Application not found.');

    expect(global.fetch).not.toHaveBeenCalled();
  });

  // TEST 10: DOCUMENT DOES NOT EXIST

  test('Should return 404 when the requested document is missing', async () => {
    const { user, token } = await createAuthenticatedUser('clerk');

    const application = await createTestApplication(user._id);

    await Application.updateOne(
      { _id: application._id },
      { $unset: { 'documents.chiefLetter': 1 } }
    );

    const response = await request(app)
      .get(
        `/api/applications/${application._id}/documents/chiefLetter`
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe(
      'Requested document was not found.'
    );

    expect(global.fetch).not.toHaveBeenCalled();
  });

  // TEST 11: CLOUDINARY DOWNLOAD FAILURE

  test('Should return 502 when Cloudinary cannot retrieve the document', async () => {
    const { user, token } = await createAuthenticatedUser('clerk');

    const application = await createTestApplication(user._id);

    global.fetch.mockResolvedValue(
      new Response('Document unavailable', {
        status: 404
      })
    );

    const response = await request(app)
      .get(
        `/api/applications/${application._id}/documents/chiefLetter`
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(502);

    expect(response.body.message).toBe(
      'Unable to retrieve the private document.'
    );
  });

  // TEST 12: INVALID CONTENT TYPE

  test('Should reject an invalid Cloudinary content type', async () => {
    const { user, token } = await createAuthenticatedUser('clerk');

    const application = await createTestApplication(user._id);

    global.fetch.mockResolvedValue(
      new Response('This is not a PDF document', {
        status: 200,
        headers: {
          'Content-Type': 'text/html'
        }
      })
    );

    const response = await request(app)
      .get(
        `/api/applications/${application._id}/documents/chiefLetter`
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(502);

    expect(response.body.message).toBe(
      'The document provider returned an invalid file.'
    );
  });
  // TEST 13: INVALID PDF SIGNATURE

  test('Should reject a file without a valid PDF signature', async () => {
    const { user, token } = await createAuthenticatedUser('clerk');

    const application = await createTestApplication(user._id);

    // The response claims to be a PDF but actually contains HTML.
    global.fetch.mockResolvedValue(
      new Response('<html>This is not a PDF</html>', {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf'
        }
      })
    );

    const response = await request(app)
      .get(
        `/api/applications/${application._id}/documents/chiefLetter`
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(502);

    expect(response.body.message).toBe(
      'The document provider returned an invalid file.'
    );
  });

  // TEST 13: SIGNED URL GENERATION FAILURE

  test('Should handle signed URL generation failures safely', async () => {
    const { user, token } = await createAuthenticatedUser('clerk');

    const application = await createTestApplication(user._id);

    cloudinary.utils.private_download_url.mockImplementation(() => {
      throw new Error('Simulated Cloudinary signing failure');
    });

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      const response = await request(app)
        .get(
          `/api/applications/${application._id}/documents/chiefLetter`
        )
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(502);

      expect(response.body.message).toBe(
        'Unable to retrieve the private document.'
      );

      expect(JSON.stringify(response.body)).not.toContain(
        'Simulated Cloudinary signing failure'
      );

      expect(global.fetch).not.toHaveBeenCalled();

      // Confirm the server still logs the internal error.
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Private document retrieval failed:',
        'Error'
      );
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
