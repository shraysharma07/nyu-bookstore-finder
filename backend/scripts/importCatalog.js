#!/usr/bin/env node
// backend/scripts/importCatalog.js
// CLI script to import CSV catalog
// Usage: node scripts/importCatalog.js --file /path/to/file.csv
// Requires: DATABASE_URL environment variable (or DB_HOST, DB_USER, etc.)

const fs = require('fs');
const path = require('path');

// Ensure DATABASE_URL is set (required for production/EB)
if (!process.env.DATABASE_URL) {
  console.error('[import] ERROR: DATABASE_URL environment variable is not set');
  console.error('[import] On EB, export it first:');
  console.error('[import]   export DATABASE_URL="postgres://user:pass@host:port/dbname?sslmode=require"');
  console.error('[import] Or set individual vars: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
  process.exit(1);
}

// Log connection info (safe preview)
if (process.env.DATABASE_URL) {
  const url = process.env.DATABASE_URL;
  const preview = url.split('@')[1] || url.substring(0, 30) + '...';
  console.log(`[import] Using DATABASE_URL: ...@${preview}`);
}

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

// Resolve file path (support relative paths from repo root)
let resolvedPath = path.resolve(filePath);
if (!fs.existsSync(resolvedPath)) {
  // Try relative to repo root
  const repoRoot = path.resolve(__dirname, '../..');
  const altPath = path.join(repoRoot, filePath);
  if (fs.existsSync(altPath)) {
    resolvedPath = altPath;
  } else {
    console.error(`Error: File not found: ${resolvedPath}`);
    console.error(`Also tried: ${altPath}`);
    process.exit(1);
  }
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
