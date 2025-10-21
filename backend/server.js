// server.js — safe minimal boot
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const { pool } = require('./db');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

// quick DB ping (won’t crash if DB is down)
(async () => {
  try { await pool.query('SELECT 1'); console.log('[db] Connected to PostgreSQL ✅'); }
  catch (e) { console.warn('[db] Cannot reach PostgreSQL (continuing):', e.message); }
})();

// ✅ mount only stable routes for now
app.use('/api/auth', require('./routes/auth'));
app.use('/api/catalog', require('./routes/catalog'));

// ❌ temporarily DISABLE the broken route until we fix it
// app.use('/api/books', require('./routes/books'));

app.get('/api/health', (_req, res) => res.json({ message: 'Server is running!' }));
app.use('*', (_req, res) => res.status(404).json({ error: 'Route not found' }));

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
