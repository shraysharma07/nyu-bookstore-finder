// db.js — single PG pool used everywhere
const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
  user:     process.env.DB_USER     || 'your_username',
  host:     process.env.DB_HOST     || 'localhost',
  database: process.env.DB_NAME     || 'nyu_book_finder',
  password: process.env.DB_PASSWORD || 'your_password',
  port:     Number(process.env.DB_PORT) || 5432,
  // if you later deploy to a managed PG that requires SSL:
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  console.error('[pg] unexpected error on idle client:', err);
});

module.exports = { pool };
