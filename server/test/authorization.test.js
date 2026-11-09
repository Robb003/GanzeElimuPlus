// ============================================================
// ELIMUPLUS ROLE-BASED AUTHORIZATION SECURITY TESTS
// ============================================================

// PREVENT TEST EXECUTION IN PRODUCTION
if (process.env.NODE_ENV === 'production') {
  throw new Error(
    'SECURITY ERROR: Authorization tests cannot run in production.'
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
});

// ============================================================
// TEST DATA AND AUTHENTICATION HELPERS
// ============================================================

beforeEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Create a real test user and issue a signed JWT.
const createAuthenticatedUser = async (role) => {
  const user = await User.create({
    phoneNumber: `07${Date.now()}${Math.floor(Math.random() * 1000)}`,
    passwordHash: 'test-only-password-hash',
    role,
    profile: {
      fullName: `Test ${role}`,
      nationalID: `${Date.now()}${Math.floor(Math.random() * 1000)}`,
      ward: 'Ganze',
      village: 'Bamba'
    }
  });

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '5m' }
  );

  return token;
};

// ============================================================
// ROLE AUTHORIZATION TESTS
// ============================================================

describe('ElimuPlus Role-Based Authorization Security Tests', () => {

  const forbiddenAccessTests = [
    {
      role: 'applicant',
      method: 'get',
      endpoint: '/api/applications/review-queue',
      description: 'Applicants cannot access the clerk review queue'
    },
    {
      role: 'applicant',
      method: 'get',
      endpoint: '/api/applications/board-queue',
      description: 'Applicants cannot access the board review queue'
    },
    {
      role: 'applicant',
      method: 'put',
      endpoint: '/api/applications/507f1f77bcf86cd799439011/verify',
      description: 'Applicants cannot verify applications'
    },
    {
      role: 'applicant',
      method: 'put',
      endpoint: '/api/applications/507f1f77bcf86cd799439011/approve',
      description: 'Applicants cannot approve applications'
    },
    {
      role: 'applicant',
      method: 'post',
      endpoint: '/api/admin/schools',
      description: 'Applicants cannot register schools'
    },
    {
      role: 'clerk',
      method: 'get',
      endpoint: '/api/applications/my-application',
      description: 'Clerks cannot access the applicant personal application endpoint'
    },
    {
      role: 'clerk',
      method: 'get',
      endpoint: '/api/applications/board-queue',
      description: 'Clerks cannot access the board review queue'
    },
    {
      role: 'clerk',
      method: 'put',
      endpoint: '/api/applications/507f1f77bcf86cd799439011/approve',
      description: 'Clerks cannot approve applications'
    },
    {
      role: 'clerk',
      method: 'post',
      endpoint: '/api/admin/set-cycle',
      description: 'Clerks cannot configure bursary cycles'
    },
    {
      role: 'board',
      method: 'get',
      endpoint: '/api/applications/review-queue',
      description: 'Board members cannot access the clerk review queue'
    },
    {
      role: 'board',
      method: 'put',
      endpoint: '/api/applications/507f1f77bcf86cd799439011/verify',
      description: 'Board members cannot perform clerk verification'
    },
    {
      role: 'board',
      method: 'post',
      endpoint: '/api/admin/set-cycle',
      description: 'Board members cannot configure bursary cycles'
    },
    {
      role: 'admin',
      method: 'put',
      endpoint: '/api/applications/507f1f77bcf86cd799439011/verify',
      description: 'Admins cannot bypass the clerk-only verification endpoint'
    },
    {
      role: 'agent',
      method: 'get',
      endpoint: '/api/applications/my-application',
      description: 'Agents cannot access the applicant personal application endpoint'
    },
    {
      role: 'agent',
      method: 'get',
      endpoint: '/api/applications/review-queue',
      description: 'Agents cannot access the clerk review queue'
    }
  ];

  test.each(forbiddenAccessTests)(
    '$description',
    async ({ role, method, endpoint }) => {
      const token = await createAuthenticatedUser(role);

      let testRequest = request(app)[method](endpoint)
        .set('Authorization', `Bearer ${token}`);

      if (method === 'put' || method === 'post') {
        testRequest = testRequest.send({});
      }

      const response = await testRequest;

      expect(response.statusCode).toBe(403);

      expect(response.body.message).toBe(
        'Access denied. You do not have permission to access this resource.'
      );
    }
  );

  // ============================================================
  // POSITIVE ROLE AUTHORIZATION TESTS
  // ============================================================

  const authorizedAccessTests = [
    {
      role: 'clerk',
      endpoint: '/api/applications/review-queue',
      expectedBody: [],
      description: 'Clerks can access the application review queue'
    },
    {
      role: 'board',
      endpoint: '/api/applications/board-queue',
      expectedBody: [],
      description: 'Board members can access the board review queue'
    },
    {
      role: 'admin',
      endpoint: '/api/admin/getleaderboard',
      expectedBody: {
        count: 0,
        data: []
      },
      description: 'Admins can access the application leaderboard'
    }
  ];

  test.each(authorizedAccessTests)(
    '$description',
    async ({ role, endpoint, expectedBody }) => {
      const token = await createAuthenticatedUser(role);

      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(expectedBody);
    }
  );


});