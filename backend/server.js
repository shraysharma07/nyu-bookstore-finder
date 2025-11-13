// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const { pool } = require('./db');
const app = express();
const PORT = Number(process.env.PORT) || 5000;

// ✅ trust AWS load balancer (for HTTPS/cookies later)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ✅ strict CORS for production
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error("CORS blocked: " + origin));
  },
  credentials: true
}));


app.use(express.json());

// ✅ verify DB on boot
(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('[db] Connected to PostgreSQL ✅');
  } catch (e) {
    console.warn('[db] Cannot reach PostgreSQL (continuing):', e.message);
  }
})();

// ✅ Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/catalog', require('./routes/catalog'));

// ❌ books route disabled until fixed
// app.use('/api/books', require('./routes/books'));

// ✅ EB health check (THIS NAME MATTERS)
app.get('/health', (req, res) => res.status(200).json({ ok: true }));

// ✅ Catch-all
app.use('*', (_req, res) => res.status(404).json({ error: 'Route not found' }));

app.listen(PORT, () => console.log(`API running → http://localhost:${PORT}`));
