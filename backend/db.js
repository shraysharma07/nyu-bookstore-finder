// db.js — single PG pool used everywhere (runtime and scripts)
const { Pool } = require('pg');

// Only load .env in non-production
if (process.env.NODE_ENV !== 'production') {
  const dotenv = require('dotenv');
  dotenv.config();
}

const host = process.env.DB_HOST || process.env.PGHOST || 'localhost';
const port = Number(process.env.DB_PORT || process.env.PGPORT || 5432);
const user = process.env.DB_USER || process.env.PGUSER || 'your_username';
const password = process.env.DB_PASSWORD || process.env.PGPASSWORD || 'your_password';
const database = process.env.DB_NAME || process.env.PGDATABASE || 'nyu_book_finder';

// Prefer a single DATABASE_URL if present (required in production)
const connectionString = process.env.DATABASE_URL || null;

// Enable SSL if either flag is set OR if DATABASE_URL contains sslmode=require
// Do NOT use NODE_TLS_REJECT_UNAUTHORIZED - use rejectUnauthorized: false in pool config
const sslRequired =
  process.env.DB_SSL === 'true' ||
  process.env.PGSSLMODE === 'require' ||
  (connectionString && connectionString.includes('sslmode=require')) ||
  (process.env.NODE_ENV === 'production' && !!process.env.AWS_EXECUTION_ENV);

// SSL config - use rejectUnauthorized: false for self-signed certificates (RDS)
const sslConfig = sslRequired ? { rejectUnauthorized: false } : false;

const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: sslConfig,
      }
    : {
        host,
        port,
        user,
        password,
        database,
        ssl: sslConfig,
      }
);

pool.on('error', (err) => {
  console.error('[pg] unexpected error on idle client:', err);
});

module.exports = { pool };
