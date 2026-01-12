// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'please-change-this-secret';

// keep one canonical name
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) return res.status(401).json({ ok: false, error: 'no_token' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: 'invalid_token' });
  }
}

// ✅ backwards-compatible alias so old code keeps working
const authenticateToken = requireAuth;

module.exports = { requireAuth, authenticateToken };
