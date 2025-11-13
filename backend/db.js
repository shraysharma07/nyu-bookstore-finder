// db.js — single PG pool used everywhere
const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pick = (keys, env = process.env) =>
  keys.find((k) => env[k] && env[k].length > 0) || null;

const host = process.env.DB_HOST || process.env.PGHOST || 'localhost';
const port = Number(process.env.DB_PORT || process.env.PGPORT || 5432);
const user = process.env.DB_USER || process.env.PGUSER || 'your_username';
const password = process.env.DB_PASSWORD || process.env.PGPASSWORD || 'your_password';
const database = process.env.DB_NAME || process.env.PGDATABASE || 'nyu_book_finder';

// Prefer a single DATABASE_URL if present
const connectionString = process.env.DATABASE_URL || null;

// Enable SSL if either flag is set
const sslRequired =
  process.env.DB_SSL === 'true' ||
  process.env.PGSSLMODE === 'require' ||
  (process.env.NODE_ENV === 'production' && !!process.env.AWS_EXECUTION_ENV);

const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: sslRequired ? { rejectUnauthorized: false } : false,
      }
    : {
        host,
        port,
        user,
        password,
        database,
        ssl: sslRequired ? { rejectUnauthorized: false } : false,
      }
);

pool.on('error', (err) => {
  console.error('[pg] unexpected error on idle client:', err);
});

module.exports = { pool };
