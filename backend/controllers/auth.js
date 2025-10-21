// backend/controllers/auth.js
// librarian-only login that returns a JWT

const jwt = require('jsonwebtoken');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'NYUMADRID67!';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'm4dr1d-L1br@ry-2025-!#%';
const JWT_SECRET     = process.env.JWT_SECRET     || 'please-change-this-secret';

// POST /api/auth/login -> { ok, token }
const login = (req, res) => {
  const { username, password } = req.body || {};
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: 'invalid_credentials' });
  }
  const token = jwt.sign({ role: 'librarian' }, JWT_SECRET, { expiresIn: '12h' });
  return res.json({ ok: true, token });
};

module.exports = { login };
