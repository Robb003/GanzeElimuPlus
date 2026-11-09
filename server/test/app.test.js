
const request = require('supertest');
const app = require('../app');

describe('ElimuPlus API Health Check', () => {
  test('GET / should return HTTP 200', async () => {
    const response = await request(app).get('/');

    expect(response.statusCode).toBe(200);
  });

  test('Should return the correct project name', async () => {
    const response = await request(app).get('/');

    expect(response.body.project).toBe(
      'Project ElimuPlus API Gateway'
    );
  });

  test('Should report that the API is online', async () => {
    const response = await request(app).get('/');

    expect(response.body.status).toBe('Online');
  });

  test('Should return a timestamp', async () => {
    const response = await request(app).get('/');

    expect(response.body.timestamp).toBeDefined();
    expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false);
  });
});
