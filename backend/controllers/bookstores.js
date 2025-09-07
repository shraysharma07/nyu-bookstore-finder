// backend/routes/bookstores.js
const express = require('express');
const { pool } = require('../server');

const router = express.Router();

// Get bookstores near a dorm with books for a specific course
router.get('/search', async (req, res) => {
  try {
    const { dorm, course, professor } = req.query;

    if (!dorm || !course) {
      return res.status(400).json({ error: 'Dorm and course are required' });
    }

    let query = `
      SELECT DISTINCT
        bs.id,
        bs.name,
        bs.phone,
        bs.address,
        bd.walking_distance,
        bd.distance_minutes,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'book_id', b.id,
            'title', b.title,
            'author', b.author,
            'isbn', b.isbn,
            'price', i.price,
            'quantity', i.quantity,
            'availability', i.availability_status,
            'is_required', cb.is_required,
            'subject', s.name
          )
        ) as available_books
      FROM bookstores bs
      JOIN bookstore_distances bd ON bs.id = bd.bookstore_id
      JOIN dorms d ON bd.dorm_id = d.id
      JOIN inventory i ON bs.id = i.bookstore_id
      JOIN books b ON i.book_id = b.id
      JOIN subjects s ON b.subject_id = s.id
      JOIN course_books cb ON b.id = cb.book_id
      JOIN courses c ON cb.course_id = c.id
      WHERE d.name = $1 AND c.code = $2 AND i.quantity > 0
    `;
    
    let params = [dorm, course];
    
    if (professor) {
      query += ' AND c.professor = $3';
      params.push(professor);
    }
    
    query += `
      GROUP BY bs.id, bs.name, bs.phone, bs.address, bd.walking_distance, bd.distance_minutes
      ORDER BY bd.distance_minutes ASC
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      bookstores: result.rows
    });

  } catch (error) {
    console.error('Error searching bookstores:', error);
    res.status(500).json({ error: 'Server error searching bookstores' });
  }
});

// Get all bookstores with distance from a specific dorm
router.get('/near/:dormName', async (req, res) => {
  try {
    const { dormName } = req.params;

    const result = await pool.query(`
      SELECT 
        bs.id,
        bs.name,
        bs.phone,
        bs.address,
        bd.walking_distance,
        bd.distance_minutes
      FROM bookstores bs
      JOIN bookstore_distances bd ON bs.id = bd.bookstore_id
      JOIN dorms d ON bd.dorm_id = d.id
      WHERE d.name = $1
      ORDER BY bd.distance_minutes ASC
    `, [dormName]);

    res.json({
      success: true,
      bookstores: result.rows
    });

  } catch (error) {
    console.error('Error fetching nearby bookstores:', error);
    res.status(500).json({ error: 'Server error fetching bookstores' });
  }
});

// Get all available dorms
router.get('/dorms', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, address FROM dorms ORDER BY name');

    res.json({
      success: true,
      dorms: result.rows
    });

  } catch (error) {
    console.error('Error fetching dorms:', error);
    res.status(500).json({ error: 'Server error fetching dorms' });
  }
});

// Get all available courses
router.get('/courses', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.code,
        c.name,
        c.professor,
        s.name as subject
      FROM courses c
      JOIN subjects s ON c.subject_id = s.id
      ORDER BY c.code, c.professor
    `);

    res.json({
      success: true,
      courses: result.rows
    });

  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Server error fetching courses' });
  }
});

module.exports = router;