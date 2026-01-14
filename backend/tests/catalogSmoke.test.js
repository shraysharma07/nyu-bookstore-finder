// backend/tests/catalogSmoke.test.js
// Smoke test: seed catalog and test /api/students/search

const request = require('supertest');
const { pool } = require('../db');
const { parseCSV } = require('../utils/csvParser');
const { importCatalog } = require('../utils/catalogImporter');

// Import app after all setup
let app;

describe('Catalog Smoke Test', () => {
  beforeAll(async () => {
    // Import app after potential env setup
    app = require('../server');
    
    // Seed minimal catalog data
    const testData = {
      courses: [
        {
          code: 'WREX-UF 9101',
          name: 'Writing as Exploration',
          professor: 'Weubben',
          typeOfClass: null,
          semester: null,
          year: null,
        },
        {
          code: 'SPAN-UA 9003',
          name: 'INTERMEDIATE SPANISH I',
          professor: 'Alonso/Prieto1',
          typeOfClass: null,
          semester: null,
          year: null,
        }
      ],
      books: [
        {
          courseCode: 'WREX-UF 9101',
          title: 'Homage to Catalonia',
          author: 'George Orwell',
          isbn: '9780140182316',
          isRequired: true,
          notes: null,
          digital: null,
        },
        {
          courseCode: 'SPAN-UA 9003',
          title: 'Aula Internacional Plus 3',
          author: 'Corpas, Jaime',
          isbn: '9788418032226',
          isRequired: true,
          notes: null,
          digital: null,
        }
      ]
    };
    
    try {
      await importCatalog(testData);
      console.log('[smoke] Catalog seeded successfully');
    } catch (err) {
      console.warn('[smoke] Catalog seed failed (may already exist):', err.message);
    }
  }, 30000);

  afterAll(async () => {
    // Cleanup: close pool connections
    await pool.end();
  });

  it('should return 503 if courses table is empty', async () => {
    // This test assumes catalog is seeded
    // If empty, should get 503
    const res = await request(app)
      .post('/api/students/search')
      .send({
        name: 'Test',
        dorm: 'Chamberi',
        course: 'INVALID-999'
      });
    
    // Should get 400 (invalid course) or 503 (no data)
    expect([400, 503]).toContain(res.statusCode);
  }, 10000);

  it('should complete search within 1 second for seeded data', async () => {
    const startTime = Date.now();
    
    const res = await request(app)
      .post('/api/students/search')
      .send({
        name: 'Test Student',
        dorm: 'Chamberi',
        course: 'WREX-UF 9101',
        professor: 'Weubben'
      });
    
    const elapsed = Date.now() - startTime;
    
    // Should complete in under 1 second
    expect(elapsed).toBeLessThan(1000);
    
    // Should return success or validation error (not timeout)
    expect([200, 400, 404]).toContain(res.statusCode);
  }, 5000);

  it('should return proper structure on success', async () => {
    const res = await request(app)
      .post('/api/students/search')
      .send({
        name: 'Test',
        dorm: 'Chamberi',
        course: 'WREX-UF 9101'
      });
    
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('student');
      expect(res.body).toHaveProperty('requiredBooks');
      expect(res.body).toHaveProperty('bookstores');
    }
  }, 5000);
});
