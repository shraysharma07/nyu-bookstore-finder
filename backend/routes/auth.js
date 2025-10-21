// routes/auth.js — single librarian login with normalization + optional debug
const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const router = express.Router();

// normalize helper to avoid hidden spaces/newlines or Unicode weirdness
const norm = (s) => String(s ?? '')
  .normalize('NFKC')
  .replace(/\r?\n/g, '')
  .trim();

const JWT_SECRET = process.env.JWT_SECRET || 'please-change-this-secret';

// read & normalize expected creds from .env (or use defaults)
const ADMIN_USERNAME = norm(process.env.ADMIN_USERNAME ?? 'NYUMADRID67!');
const ADMIN_PASSWORD = norm(process.env.ADMIN_PASSWORD ?? 'm4dr1d-L1br@ry-2025-!#%');

// optional console debugging if you set AUTH_DEBUG=1 in .env
if (process.env.AUTH_DEBUG === '1') {
  console.log('[auth] expected username:', JSON.stringify(ADMIN_USERNAME));
  console.log('[auth] expected password length:', ADMIN_PASSWORD.length);
}

// POST /api/auth/login  -> returns { ok, token } if creds match
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const u = norm(username);
  const p = norm(password);

  if (u !== ADMIN_USERNAME || p !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: 'invalid_credentials' });
  }

  const token = jwt.sign({ role: 'librarian' }, JWT_SECRET, { expiresIn: '12h' });
  return res.json({ ok: true, token });
});

// (optional) quick check of what the server expects (never expose in prod)
router.get('/_expected', (_req, res) => {
  res.json({ username: ADMIN_USERNAME, passwordLength: ADMIN_PASSWORD.length });
});

module.exports = router;
