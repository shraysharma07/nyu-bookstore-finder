// backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Only load .env in non-production
if (process.env.NODE_ENV !== 'production') {
  const dotenv = require('dotenv');
  dotenv.config();
}

const { pool } = require('./db');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// ✅ Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow API responses
  crossOriginEmbedderPolicy: false,
}));

// ✅ trust AWS load balancer (for HTTPS/cookies later)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ✅ Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ✅ strict CORS for production, dev-friendly in dev
// Support both CORS_ALLOWED_ORIGINS and ALLOWED_ORIGINS
const corsEnvVar = process.env.CORS_ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS || '';
const rawAllowed = corsEnvVar
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const defaultDevOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];

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

    // Log but don't crash - return JSON error
    console.error('[CORS] blocked origin:', origin);
    // Return false to reject, but don't throw
    return cb(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ✅ Body parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Basic root
app.get('/', (_req, res) => res.status(200).send('ok'));

// API health
app.get('/api/health', (_req, res) => res.status(200).json({ ok: true }));

// ✅ EB health check endpoint
app.get('/health', (_req, res) => res.status(200).json({ ok: true }));

// ✅ verify DB on boot (non-fatal, but log clearly)
(async () => {
  try {
    const result = await pool.query('SELECT 1 as test');
    console.log('[db] ✅ Connected to PostgreSQL successfully');
    
    // Check if courses table exists and has data
    try {
      const courseCount = await pool.query('SELECT COUNT(*) as count FROM courses');
      const count = parseInt(courseCount.rows[0]?.count || 0);
      if (count === 0) {
        console.warn('[db] ⚠️  WARNING: courses table is empty. Catalog data needs to be imported.');
      } else {
        console.log(`[db] ✅ Catalog has ${count} courses`);
      }
    } catch (tableError) {
      console.warn('[db] ⚠️  Could not check courses table:', tableError.message);
    }
  } catch (e) {
    console.error('[db] ❌ Cannot reach PostgreSQL:', e.message);
    if (e.message && e.message.includes('certificate')) {
      console.error('[db] ❌ SSL certificate error. Check DB_SSL_INSECURE or RDS CA bundle configuration.');
    }
    console.warn('[db] ⚠️  Server will continue, but database operations will fail.');
  }
})();

// ✅ Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/catalog', require('./routes/catalog'));
app.use('/api/books', require('./routes/books'));
app.use('/api/students', require('./routes/students'));
app.use('/api/bookstores', require('./routes/bookstores'));

// ✅ Centralized error handling
app.use((err, req, res, next) => {
  console.error('[server] Error:', {
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    path: req.path,
    method: req.method,
  });

  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: 'CORS policy violation', message: 'Origin not allowed' });
  }

  // JSON errors in production, full stack in dev
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

// ✅ Catch-all
app.use('*', (_req, res) => res.status(404).json({ error: 'Route not found' }));

// Export app for testing
if (require.main === module) {
  app.listen(PORT, () => console.log(`API running → http://localhost:${PORT}`));
}

module.exports = app;
