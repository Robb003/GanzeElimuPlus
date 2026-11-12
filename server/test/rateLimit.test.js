
// ============================================================
// ELIMUPLUS RATE LIMITING SECURITY TESTS
// ============================================================

// PREVENT TEST EXECUTION IN PRODUCTION
if (process.env.NODE_ENV === 'production') {
  throw new Error(
    'SECURITY ERROR: Rate limiting tests cannot run in production.'
  );
}

process.env.NODE_ENV = 'test';

// ============================================================
// IMPORTS
// ============================================================

const express = require('express');
const request = require('supertest');

const {
  generalLimiter,
  loginLimiter,
  registrationLimiter,
  applicationSubmissionLimiter
} = require('../middleware/rateLimitMiddleware');

// Supertest uses this local IP address.
const TEST_IP = '127.0.0.1';

// ============================================================
// TEST APPLICATION
// ============================================================

// Creates a small Express application using a selected limiter.
const createTestApp = (limiter) => {
  const testApp = express();

  testApp.use(limiter);

  testApp.post('/test', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Request accepted.'
    });
  });

  return testApp;
};

// Create an isolated test application for each limiter.
const generalApp = createTestApp(generalLimiter);
const loginApp = createTestApp(loginLimiter);
const registrationApp = createTestApp(registrationLimiter);
const submissionApp = createTestApp(applicationSubmissionLimiter);

// ============================================================
// RATE LIMITER TEST SUITE
// ============================================================

describe('ElimuPlus Rate Limiting Security Tests', () => {

  // Reset counters before every test.
  beforeEach(() => {
    generalLimiter.resetKey(TEST_IP);
    loginLimiter.resetKey(TEST_IP);
    registrationLimiter.resetKey(TEST_IP);
    applicationSubmissionLimiter.resetKey(TEST_IP);
  });

  // Clean up counters after every test.
  afterEach(() => {
    generalLimiter.resetKey(TEST_IP);
    loginLimiter.resetKey(TEST_IP);
    registrationLimiter.resetKey(TEST_IP);
    applicationSubmissionLimiter.resetKey(TEST_IP);
  });

  // ==========================================================
  // GENERAL API RATE LIMITING
  // ==========================================================

  test('Should block requests after 100 general API requests', async () => {
    for (let i = 0; i < 100; i++) {
      const response = await request(generalApp).post('/test');

      expect(response.statusCode).toBe(200);
    }

    const blockedResponse = await request(generalApp).post('/test');

    expect(blockedResponse.statusCode).toBe(429);
    expect(blockedResponse.body.success).toBe(false);
  });

  // ==========================================================
  // LOGIN RATE LIMITING
  // ==========================================================

  test('Should block login requests after 5 attempts', async () => {
    for (let i = 0; i < 5; i++) {
      const response = await request(loginApp).post('/test');

      expect(response.statusCode).toBe(200);
    }

    const blockedResponse = await request(loginApp).post('/test');

    expect(blockedResponse.statusCode).toBe(429);
    expect(blockedResponse.body.success).toBe(false);
  });

  // ==========================================================
  // REGISTRATION RATE LIMITING
  // ==========================================================

  test('Should block registration requests after 5 attempts', async () => {
    for (let i = 0; i < 5; i++) {
      const response = await request(registrationApp).post('/test');

      expect(response.statusCode).toBe(200);
    }

    const blockedResponse = await request(registrationApp).post('/test');

    expect(blockedResponse.statusCode).toBe(429);
    expect(blockedResponse.body.success).toBe(false);
  });

  // ==========================================================
  // APPLICATION SUBMISSION RATE LIMITING
  // ==========================================================

  test('Should block application submissions after 3 attempts', async () => {
    for (let i = 0; i < 3; i++) {
      const response = await request(submissionApp).post('/test');

      expect(response.statusCode).toBe(200);
    }

    const blockedResponse = await request(submissionApp).post('/test');

    expect(blockedResponse.statusCode).toBe(429);
    expect(blockedResponse.body.success).toBe(false);
  });

});
