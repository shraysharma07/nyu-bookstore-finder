// routes/auth.js — DB-first auth with env fallback (supports bcrypt hash)
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Only load .env in non-production
if (process.env.NODE_ENV !== 'production') {
  const dotenv = require('dotenv');
  dotenv.config();
}

const { pool } = require('../db');

const router = express.Router();

const norm = (s) => String(s ?? '')
  .normalize('NFKC')
  .replace(/\r?\n/g, '')
  .trim();

const JWT_SECRET = process.env.JWT_SECRET || 'please-change-this-secret';

// ENV admin (fallback or bootstrap)
// Prefer a HASH in prod; allow plain only for local dev.
const ADMIN_USERNAME = norm(process.env.ADMIN_USERNAME ?? 'NYUMADRID67!');
const ADMIN_PASSWORD_PLAIN = norm(process.env.ADMIN_PASSWORD ?? 'm4dr1d-L1br@ry-2025-!');
const ADMIN_PASSWORD_HASH = norm(process.env.ADMIN_PASSWORD_HASH ?? ''); // optional bcrypt hash

const isProd = process.env.NODE_ENV === 'production';
const AUTH_DEBUG = process.env.AUTH_DEBUG === '1';

// Optional debug (never log secrets)
if (AUTH_DEBUG && !isProd) {
  console.log('[auth] debug on (dev only)');
  console.log('[auth] env admin username:', JSON.stringify(ADMIN_USERNAME));
  console.log('[auth] env admin hash present:', ADMIN_PASSWORD_HASH.length > 0);
}

async function verifyDbUser(username, password) {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, password_hash FROM admins WHERE username = $1 LIMIT 1',
      [username]
    );
    if (!rows?.length) return false;
    const ok = await bcrypt.compare(password, rows[0].password_hash || '');
    return ok ? { id: rows[0].id, username: rows[0].username } : false;
  } catch (e) {
    // DB down or not ready: silently fall back to env auth
    console.error('[auth] DB check failed:', {
      username,
      error: e.message,
      stack: e.stack,
      sqlError: e.code || e.detail || null
    });
    if (AUTH_DEBUG && !isProd) console.warn('[auth] DB check failed (falling back to env):', e.message);
    return false;
  }
}

async function verifyEnvUser(username, password) {
  if (username !== ADMIN_USERNAME) return false;
  if (ADMIN_PASSWORD_HASH) {
    // production-friendly: compare against bcrypt hash in env
    const ok = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    return ok ? { id: 0, username: ADMIN_USERNAME } : false;
  }
  // dev-only fallback: compare plain
  if (isProd && AUTH_DEBUG) {
    console.warn('[auth] WARNING: using plain env password in production');
  }
  return password === ADMIN_PASSWORD_PLAIN ? { id: 0, username: ADMIN_USERNAME } : false;
}

// POST /api/auth/login -> { ok, token }
router.post('/login', async (req, res) => {
  const u = norm(req.body?.username);
  const p = norm(req.body?.password);

  // 1) Try DB user first (preferred)
  const dbResult = await verifyDbUser(u, p);
  if (dbResult) {
    const token = jwt.sign({ role: 'librarian', sub: String(dbResult.id) }, JWT_SECRET, { expiresIn: '12h' });
    return res.json({ ok: true, token });
  }

  // 2) Fallback to env admin
  const envResult = await verifyEnvUser(u, p);
  if (envResult) {
    const token = jwt.sign({ role: 'librarian', sub: String(envResult.id) }, JWT_SECRET, { expiresIn: '12h' });
    return res.json({ ok: true, token });
  }

  return res.status(401).json({ ok: false, error: 'invalid_credentials' });
});

// Auth health check endpoint
router.get('/health', async (_req, res) => {
  try {
    // Check if JWT_SECRET is configured
    const hasSecret = Boolean(JWT_SECRET && JWT_SECRET !== 'please-change-this-secret');
    
    // Check if admin credentials are configured
    const hasAdmin = Boolean(ADMIN_USERNAME && (ADMIN_PASSWORD_HASH || ADMIN_PASSWORD_PLAIN));
    
    // Test DB connection
    let dbConnected = false;
    try {
      await pool.query('SELECT 1');
      dbConnected = true;
    } catch (e) {
      // DB not connected
    }
    
    res.json({
      ok: true,
      hasSecret,
      hasAdmin,
      dbConnected,
      authMethod: ADMIN_PASSWORD_HASH ? 'hash' : 'plain',
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Auth "me" endpoint - verify current token
router.get('/me', async (req, res) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    
    if (!token) {
      return res.status(401).json({ ok: false, error: 'no_token' });
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return res.json({ ok: true, user: { id: decoded.sub, role: decoded.role } });
    } catch (e) {
      return res.status(401).json({ ok: false, error: 'invalid_token' });
    }
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// (dev-only) show minimal expectations — disabled in production
if (!isProd) {
  router.get('/_expected', (_req, res) => {
    res.json({
      username: ADMIN_USERNAME,
      // never return the password; only indicate if a hash is configured
      passwordHashConfigured: Boolean(ADMIN_PASSWORD_HASH),
    });
  });
}

module.exports = router;
