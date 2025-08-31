const express = require('express');
const { pool } = require('../server');

const router = express.Router();

// Log student search for analytics
router.post('/search', async (req, res) => {
  try {
    const { name, dorm, course, professor } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (!name || !dorm || !course) {
      return res.status(400).json({ error: 'Name, dorm, and course are required' });
    }

    // Get dorm ID
    const dormResult = await pool.query('SELECT id FROM dorms WHERE name = $1', [dorm]);
    if (dormResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid dorm name' });
    }
    const dormId = dormResult.rows[0].id;

    // Get course ID
    let courseQuery = 'SELECT id FROM courses WHERE code = $1';
    let courseParams = [course];
    
    if (professor) {
      courseQuery += ' AND professor = $2';
      courseParams.push(professor);
    }

    const courseResult = await pool.query(courseQuery, courseParams);
    if (courseResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid course or professor' });
    }
    const courseId = courseResult.rows[0].id;

    // Log the search
    await pool.query(
      'INSERT INTO student_searches (student_name, dorm_id, course_id, ip_address) VALUES ($1, $2, $3, $4)',
      [name, dormId, courseId, ipAddress]
    );

    // Get books for the course
    const booksResult = await pool.query(`
      SELECT 
        b.id,
        b.title,
        b.author,
        b.isbn,
        s.name as subject,
        cb.is_required
      FROM books b
      JOIN course_books cb ON b.id = cb.book_id
      JOIN subjects s ON b.subject_id = s.id
      WHERE cb.course_id = $1
      ORDER BY cb.is_required DESC, b.title
    `, [courseId]);

    // Get bookstores with these books near the dorm
    const bookstoresResult = await pool.query(`
      SELECT DISTINCT
        bs.id,
        bs.name,
        bs.phone,
        bs.address,
        bd.walking_distance,
        bd.distance_minutes,
        CASE 
          WHEN COUNT(i.id) > 0 THEN 'In Stock'
          ELSE 'Limited Stock'
        END as availability_status
      FROM bookstores bs
      JOIN bookstore_distances bd ON bs.id = bd.bookstore_id
      JOIN inventory i ON bs.id = i.bookstore_id
      JOIN books b ON i.book_id = b.id
      JOIN course_books cb ON b.id = cb.book_id
      WHERE bd.dorm_id = $1 AND cb.course_id = $2 AND i.quantity > 0
      GROUP BY bs.id, bs.name, bs.phone, bs.address, bd.walking_distance, bd.distance_minutes
      ORDER BY bd.distance_minutes ASC
    `, [dormId, courseId]);

    // Get detailed inventory for each bookstore
    const detailedBookstores = await Promise.all(
      bookstoresResult.rows.map(async (store) => {
        const inventoryResult = await pool.query(`
          SELECT 
            b.id as book_id,
            b.title,
            b.author,
            b.isbn,
            i.price,
            i.quantity,
            i.availability_status,
            cb.is_required,
            s.name as subject
          FROM inventory i
          JOIN books b ON i.book_id = b.id
          JOIN subjects s ON b.subject_id = s.id
          JOIN course_books cb ON b.id = cb.book_id
          WHERE i.bookstore_id = $1 AND cb.course_id = $2 AND i.quantity > 0
          ORDER BY cb.is_required DESC, b.title
        `, [store.id, courseId]);

        return {
          ...store,
          books: inventoryResult.rows
        };
      })
    );

    res.json({
      success: true,
      student: { name, dorm, course, professor },
      requiredBooks: booksResult.rows,
      bookstores: detailedBookstores
    });

  } catch (error) {
    console.error('Error processing student search:', error);
    res.status(500).json({ error: 'Server error processing search' });
  }
});

// Get popular searches (for analytics)
router.get('/popular-searches', async (req, res) => {
  try {
    const { limit = 10, days = 30 } = req.query;

    const result = await pool.query(`
      SELECT 
        c.code,
        c.name,
        c.professor,
        s.name as subject,
        COUNT(*) as search_count
      FROM student_searches ss
      JOIN courses c ON ss.course_id = c.id
      JOIN subjects s ON c.subject_id = s.id
      WHERE ss.search_timestamp >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
      GROUP BY c.id, c.code, c.name, c.professor, s.name
      ORDER BY search_count DESC
      LIMIT $1
    `, [parseInt(limit)]);

    res.json({
      success: true,
      popularSearches: result.rows
    });

  } catch (error) {
    console.error('Error fetching popular searches:', error);
    res.status(500).json({ error: 'Server error fetching popular searches' });
  }
});

// Get search analytics by dorm
router.get('/analytics/dorms', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const result = await pool.query(`
      SELECT 
        d.name as dorm_name,
        COUNT(*) as search_count,
        COUNT(DISTINCT ss.student_name) as unique_students
      FROM student_searches ss
      JOIN dorms d ON ss.dorm_id = d.id
      WHERE ss.search_timestamp >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
      GROUP BY d.id, d.name
      ORDER BY search_count DESC
    `);

    res.json({
      success: true,
      dormAnalytics: result.rows
    });

  } catch (error) {
    console.error('Error fetching dorm analytics:', error);
    res.status(500).json({ error: 'Server error fetching dorm analytics' });
  }
});

module.exports = router;