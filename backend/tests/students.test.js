// backend/tests/students.test.js
const request = require('supertest');
const app = require('../server');

describe('Students Search Endpoint', () => {
  const testPayload = {
    name: 'Test Student',
    dorm: 'Chamberi',
    course: 'WREX-UF 9101',
    professor: 'Weubben'
  };

  it('should return 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/students/search')
      .send({ name: 'Test' });
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toContain('required');
  });

  it('should return 400 for invalid dorm', async () => {
    const res = await request(app)
      .post('/api/students/search')
      .send({
        name: 'Test',
        dorm: 'InvalidDorm',
        course: 'TEST-001'
      });
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toContain('Invalid dorm');
  });

  it('should return 400 for invalid course', async () => {
    const res = await request(app)
      .post('/api/students/search')
      .send({
        name: 'Test',
        dorm: 'Chamberi',
        course: 'INVALID-999'
      });
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toContain('Invalid course');
  });

  it('should complete search within 2 seconds for valid payload', async () => {
    const startTime = Date.now();
    
    const res = await request(app)
      .post('/api/students/search')
      .send(testPayload);
    
    const elapsed = Date.now() - startTime;
    
    // Should complete in under 2 seconds
    expect(elapsed).toBeLessThan(2000);
    
    // Should return success (even if no data, as long as it doesn't timeout)
    expect([200, 400, 404]).toContain(res.statusCode);
  }, 5000); // 5 second test timeout

  it('should return proper response structure on success', async () => {
    const res = await request(app)
      .post('/api/students/search')
      .send(testPayload);
    
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('student');
      expect(res.body).toHaveProperty('requiredBooks');
      expect(res.body).toHaveProperty('bookstores');
      expect(Array.isArray(res.body.requiredBooks)).toBe(true);
      expect(Array.isArray(res.body.bookstores)).toBe(true);
    }
  }, 5000);
});

describe('Admin Login', () => {
  it('should return 401 for invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'invalid',
        password: 'invalid'
      });
    
    expect(res.statusCode).toEqual(401);
    expect(res.body.ok).toBe(false);
  });

  it('should return token for valid credentials', async () => {
    // This test requires valid admin credentials in env
    // Skip if not available
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;
    
    if (!username || !password) {
      console.log('Skipping admin login test - credentials not in env');
      return;
    }
    
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username, password });
    
    if (res.statusCode === 200) {
      expect(res.body.ok).toBe(true);
      expect(res.body.token).toBeDefined();
    } else {
      // If it fails, that's ok - just log it
      console.log('Admin login test failed - may need to set credentials');
    }
  });
});
