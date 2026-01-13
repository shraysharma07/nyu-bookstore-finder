// backend/tests/health.test.js
const request = require('supertest');

// Set NODE_ENV to test to avoid dotenv loading
process.env.NODE_ENV = 'test';
const app = require('../server');

describe('Health Endpoints', () => {
  test('GET /api/health returns 200', async () => {
    const res = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(res.body).toHaveProperty('ok', true);
  });

  test('GET /health returns 200', async () => {
    const res = await request(app)
      .get('/health')
      .expect(200);
    
    expect(res.body).toHaveProperty('ok', true);
  });
});
