
// ============================================================
// ELIMUPLUS AUTHENTICATION SECURITY TESTS
// ============================================================

// PREVENT TEST EXECUTION IN PRODUCTION
if (process.env.NODE_ENV === 'production') {
  throw new Error(
    'SECURITY ERROR: Authentication tests cannot run in production.'
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
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../app');
const User = require('../models/User');

let mongoServer;

jest.setTimeout(600000);

// ============================================================
// REUSABLE TEST DATA
// ============================================================

const validApplicant = {
  phoneNumber: '0712345678',
  password: 'Password123!',
  fullName: 'Test Applicant',
  nationalID: '12345678',
  ward: 'Ganze',
  village: 'Bamba'
};

// ============================================================
// AUTHENTICATION SECURITY TEST SUITE
// ============================================================

describe('ElimuPlus Authentication Security Tests', () => {

  // ----------------------------------------------------------
  // DATABASE SETUP
  // ----------------------------------------------------------

  beforeAll(async () => {
    // Never reuse an existing database connection.
    if (mongoose.connection.readyState !== 0) {
      throw new Error(
        'SECURITY ERROR: Mongoose already has an active database connection.'
      );
    }

    // Start an isolated temporary MongoDB instance.
    mongoServer = await MongoMemoryServer.create();

    const testMongoUri = mongoServer.getUri();

    // Confirm that the connection points to the local test instance.
    if (!testMongoUri.includes('127.0.0.1')) {
      throw new Error(
        'SECURITY ERROR: Unexpected MongoDB test connection.'
      );
    }

    // Connect only to the temporary test database.
    await mongoose.connect(testMongoUri, {
      serverSelectionTimeoutMS: 10000,
      runtimeAdapters: {
        os: require('os')
      }
    });
  });

  // Clear test records before each test.
  beforeEach(async () => {
    await User.deleteMany({});
  });

  // Disconnect and stop the temporary database.
  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  // ==========================================================
  // REGISTRATION TESTS
  // ==========================================================

  test('Should successfully register a new applicant', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(validApplicant);

    expect(response.statusCode).toBe(201);
    expect(response.body.role).toBe('applicant');
    expect(response.body.fullName).toBe('Test Applicant');
    expect(response.body.token).toBeDefined();

    expect(response.body).not.toHaveProperty('passwordHash');
  });

  test('Should never allow public registration as admin', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        ...validApplicant,
        role: 'admin'
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.role).toBe('applicant');

    const savedUser = await User.findOne({
      phoneNumber: validApplicant.phoneNumber
    });

    expect(savedUser.role).toBe('applicant');
  });

  test('Should reject duplicate phone numbers', async () => {
    await request(app)
      .post('/api/auth/register')
      .send(validApplicant);

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        ...validApplicant,
        nationalID: '87654321'
      });

    expect(response.statusCode).toBe(409);
  });

  test('Should reject registration without identification document', async () => {
    const applicant = { ...validApplicant };

    delete applicant.nationalID;

    const response = await request(app)
      .post('/api/auth/register')
      .send(applicant);

    expect(response.statusCode).toBe(400);
  });

  // ==========================================================
  // LOGIN TESTS
  // ==========================================================

  test('Should allow login with correct credentials', async () => {
    await request(app)
      .post('/api/auth/register')
      .send(validApplicant);

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        phoneNumber: validApplicant.phoneNumber,
        password: validApplicant.password
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.role).toBe('applicant');
    expect(response.body).not.toHaveProperty('passwordHash');
  });

  test('Should reject an incorrect password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send(validApplicant);

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        phoneNumber: validApplicant.phoneNumber,
        password: 'WrongPassword123!'
      });

    expect(response.statusCode).toBe(401);
  });

  test('Should reject login with missing credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        phoneNumber: validApplicant.phoneNumber
      });

    expect(response.statusCode).toBe(400);
  });

  // ==========================================================
  // PROFILE AND JWT SECURITY TESTS
  // ==========================================================

  test('Should reject profile access without a token', async () => {
    const response = await request(app)
      .get('/api/auth/profile');

    expect(response.statusCode).toBe(401);
  });

  test('Should reject profile access with an invalid token', async () => {
    const response = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.statusCode).toBe(401);
  });

  test('Should allow profile access with a valid token', async () => {
    const registration = await request(app)
      .post('/api/auth/register')
      .send(validApplicant);

    const response = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${registration.body.token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.profile.fullName).toBe('Test Applicant');
    expect(response.body).not.toHaveProperty('passwordHash');
  });

  test('Should reject a token belonging to a deleted account', async () => {
    const registration = await request(app)
      .post('/api/auth/register')
      .send(validApplicant);

    const user = await User.findOne({
      phoneNumber: validApplicant.phoneNumber
    });

    await User.findByIdAndDelete(user._id);

    const response = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${registration.body.token}`);

    expect(response.statusCode).toBe(401);
  });

});
