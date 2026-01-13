#!/usr/bin/env node
// backend/scripts/resetCatalog.js
// Purge and re-import catalog from CSV

const fs = require('fs');
const path = require('path');
const { pool } = require('../db');
const { parseCSV } = require('../utils/csvParser');
const { importCatalog } = require('../utils/catalogImporter');

async function resetCatalog() {
  const csvPath = process.argv[2] || path.join(__dirname, '../../database/seed/course_catalog.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`Error: CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  console.log(`[resetCatalog] Reading CSV from ${csvPath}...`);
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  
  console.log(`[resetCatalog] Parsing CSV...`);
  const parsed = parseCSV(csvContent);
  
  if (parsed.errors.length > 0) {
    console.warn(`[resetCatalog] ${parsed.errors.length} parse errors:`, parsed.errors.slice(0, 5));
  }
  
  console.log(`[resetCatalog] Found ${parsed.courses.length} courses, ${parsed.books.length} books`);
  
  console.log(`[resetCatalog] Importing to database (this will TRUNCATE existing catalog)...`);
  const summary = await importCatalog({
    courses: parsed.courses,
    books: parsed.books,
  });
  
  console.log(`[resetCatalog] Import complete:`, {
    coursesCreated: summary.coursesCreated,
    coursesUpdated: summary.coursesUpdated,
    booksCreated: summary.booksCreated,
    booksUpdated: summary.booksUpdated,
    relationshipsCreated: summary.relationshipsCreated,
    duplicatesSkipped: summary.duplicatesSkipped,
    errors: summary.errors.length
  });
  
  if (summary.errors.length > 0) {
    console.error(`[resetCatalog] Errors:`, summary.errors.slice(0, 10));
  }
  
  process.exit(0);
}

resetCatalog().catch(err => {
  console.error('[resetCatalog] Fatal error:', err);
  process.exit(1);
});
