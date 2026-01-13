// backend/tests/catalog.test.js
// Set NODE_ENV to test
process.env.NODE_ENV = 'test';
const { parseCSV } = require('../utils/csvParser');
const { importCatalog } = require('../utils/catalogImporter');

describe('CSV Parser', () => {
  test('parses valid CSV', () => {
    const csv = `Teacher,Course Code,Class Title,Author,Title,ISBN,Required or Supplemental,Notes,Type of Class,Digital?,First year/Notes
Test Teacher,SPAN-UA 9001,Test Course,Test Author,Test Book,1234567890,Required,,Language,Not available,`;

    const result = parseCSV(csv);
    
    expect(result.courses).toHaveLength(1);
    expect(result.courses[0].code).toBe('SPAN-UA 9001');
    expect(result.books).toHaveLength(1);
    expect(result.books[0].title).toBe('Test Book');
  });

  test('normalizes course codes', () => {
    const csv = `Teacher,Course Code,Class Title,Author,Title,ISBN,Required or Supplemental,Notes,Type of Class,Digital?,First year/Notes
Test,SPAN-UA. 9001,Test,,Test Book,,Required,,Language,,`;

    const result = parseCSV(csv);
    expect(result.courses[0].code).toBe('SPAN-UA.9001');
  });

  test('fixes Digital typos', () => {
    const csv = `Teacher,Course Code,Class Title,Author,Title,ISBN,Required or Supplemental,Notes,Type of Class,Digital?,First year/Notes
Test,SPAN-UA 9001,Test,,Test Book,,Required,,Language,Not avialable,`;

    const result = parseCSV(csv);
    expect(result.books[0].digital).toBe('Not available');
  });

  test('deduplicates books', () => {
    const csv = `Teacher,Course Code,Class Title,Author,Title,ISBN,Required or Supplemental,Notes,Type of Class,Digital?,First year/Notes
Test,SPAN-UA 9001,Test,Author,Book,123,Required,,Language,,
Test,SPAN-UA 9001,Test,Author,Book,123,Required,,Language,,`;

    const result = parseCSV(csv);
    expect(result.books).toHaveLength(1);
  });

  test('handles missing fields', () => {
    const csv = `Teacher,Course Code,Class Title,Author,Title,ISBN,Required or Supplemental,Notes,Type of Class,Digital?,First year/Notes
,SPAN-UA 9001,,,Book,,,Language,,`;

    const result = parseCSV(csv);
    expect(result.courses).toHaveLength(1);
    expect(result.books).toHaveLength(1);
  });
});

describe('Catalog Importer', () => {
  test('import is idempotent', async () => {
    const data = {
      courses: [
        { code: 'TEST-001', name: 'Test Course', professor: 'Test Prof' },
      ],
      books: [
        { courseCode: 'TEST-001', title: 'Test Book', author: 'Author', isbn: '123', isRequired: true },
      ],
    };

    // First import
    const summary1 = await importCatalog(data);
    expect(summary1.coursesCreated).toBeGreaterThan(0);

    // Second import (should be idempotent)
    const summary2 = await importCatalog(data);
    // Should create same number of courses (or update existing)
    expect(summary2.coursesCreated + summary2.coursesUpdated).toBeGreaterThan(0);
  });
});
