const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../server');

const router = express.Router();

// Login bookstore
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find bookstore by username
    const result = await pool.query(
      'SELECT id, name, username, password_hash FROM bookstores WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const bookstore = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, bookstore.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: bookstore.id, 
        username: bookstore.username,
        name: bookstore.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: bookstore.id,
        name: bookstore.name,
        username: bookstore.username
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Register new bookstore (for future use)
router.post('/register', async (req, res) => {
  try {
    const { name, username, password, email, phone, address } = req.body;

    if (!name || !username || !password || !address) {
      return res.status(400).json({ error: 'Name, username, password, and address are required' });
    }

    // Check if username already exists
    const existingUser = await pool.query(
      'SELECT id FROM bookstores WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new bookstore
    const result = await pool.query(
      `INSERT INTO bookstores (name, username, password_hash, email, phone, address) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, username`,
      [name, username, passwordHash, email, phone, address]
    );

    const newBookstore = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: newBookstore.id, 
        username: newBookstore.username,
        name: newBookstore.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newBookstore.id,
        name: newBookstore.name,
        username: newBookstore.username
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

module.exports = router;