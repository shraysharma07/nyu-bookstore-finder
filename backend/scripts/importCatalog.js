#!/usr/bin/env node
// backend/scripts/importCatalog.js
// CLI script to import CSV catalog
// Usage: node scripts/importCatalog.js --file /path/to/file.csv

const fs = require('fs');
const path = require('path');
const { parseCSV } = require('../utils/csvParser');
const { importCatalog } = require('../utils/catalogImporter');

// Parse command line arguments
const args = process.argv.slice(2);
let filePath = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--file' && args[i + 1]) {
    filePath = args[i + 1];
    break;
  }
}

if (!filePath) {
  console.error('Usage: node scripts/importCatalog.js --file <path-to-csv>');
  process.exit(1);
}

// Resolve file path
const resolvedPath = path.resolve(filePath);
if (!fs.existsSync(resolvedPath)) {
  console.error(`Error: File not found: ${resolvedPath}`);
  process.exit(1);
}

// Main import function
async function main() {
  try {
    console.log(`[import] Reading CSV from: ${resolvedPath}`);
    const csvContent = fs.readFileSync(resolvedPath, 'utf8');

    console.log('[import] Parsing CSV...');
    const parsed = parseCSV(csvContent);

    if (parsed.errors.length > 0) {
      console.warn(`[import] Parse warnings (${parsed.errors.length}):`);
      parsed.errors.slice(0, 10).forEach(err => {
        console.warn(`  Row ${err.rowNum}: ${err.reason}`);
      });
      if (parsed.errors.length > 10) {
        console.warn(`  ... and ${parsed.errors.length - 10} more`);
      }
    }

    console.log(`[import] Found ${parsed.courses.length} courses, ${parsed.books.length} books`);

    console.log('[import] Importing to database...');
    const summary = await importCatalog({
      courses: parsed.courses,
      books: parsed.books,
    });

    // Combine errors
    const allErrors = [
      ...parsed.errors.map(e => ({ row: e.rowNum, reason: e.reason })),
      ...summary.errors,
    ];

    console.log('\n[import] Import Summary:');
    console.log(`  Courses created: ${summary.coursesCreated}`);
    console.log(`  Courses updated: ${summary.coursesUpdated}`);
    console.log(`  Books created: ${summary.booksCreated}`);
    console.log(`  Books updated: ${summary.booksUpdated}`);
    console.log(`  Relationships created: ${summary.relationshipsCreated}`);
    console.log(`  Duplicates skipped: ${summary.duplicatesSkipped}`);
    console.log(`  Errors: ${allErrors.length}`);

    if (allErrors.length > 0) {
      console.log('\n[import] Errors:');
      allErrors.slice(0, 20).forEach(err => {
        console.log(`  ${err.row ? `Row ${err.row}: ` : ''}${err.reason}`);
      });
      if (allErrors.length > 20) {
        console.log(`  ... and ${allErrors.length - 20} more`);
      }
    }

    console.log('\n[import] ✅ Import completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[import] ❌ Import failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
