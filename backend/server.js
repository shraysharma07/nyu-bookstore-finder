// backend/server.js
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

// ✅ strict CORS for production, dev-friendly in dev
const rawAllowed = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const defaultDevOrigins = ['http://localhost:3000', 'http://localhost:3001'];

const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? rawAllowed
    : [...new Set([...rawAllowed, ...defaultDevOrigins])];

console.log('[CORS] allowed origins:', allowedOrigins);

const corsOptions = {
  origin: (origin, cb) => {
    // allow curl/Postman/etc with no origin
    if (!origin) return cb(null, true);

    if (allowedOrigins.includes(origin)) return cb(null, true);

    console.error('[CORS] blocked origin:', origin);
    return cb(null, false);
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

// Basic root
app.get('/', (_req, res) => res.status(200).send('ok'));

// API health
app.get('/api/health', (_req, res) => res.status(200).json({ ok: true }));

// ✅ EB health check endpoint
app.get('/health', (_req, res) => res.status(200).json({ ok: true }));

// ✅ verify DB on boot (non-fatal)
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
app.use('/api/books', require('./routes/books'));
app.use('/api/students', require('./routes/students'));
app.use('/api/bookstores', require('./routes/bookstores'));

// ✅ Catch-all
app.use('*', (_req, res) => res.status(404).json({ error: 'Route not found' }));

app.listen(PORT, () => console.log(`API running → http://localhost:${PORT}`));
