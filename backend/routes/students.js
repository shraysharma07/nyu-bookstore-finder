const express = require('express');
const { pool } = require('../db');
const { normalizeCourseCode } = require('../utils/normalize');

const router = express.Router();

// Timeout guard - 10 seconds max
const TIMEOUT_MS = 10000;

// Helper to create timeout promise
const createTimeout = (ms) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), ms);
  });
};

// Log student search for analytics
router.post('/search', async (req, res) => {
  const startTime = Date.now();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Log request start (log received keys only, not sensitive values)
  const receivedKeys = Object.keys(req.body || {});
  console.log(`[students/search] ${requestId} START`, {
    bodyKeys: receivedKeys,
    ip: req.ip || req.connection.remoteAddress,
    origin: req.headers.origin || req.headers.host
  });

  try {
    // Support BOTH payload formats for backwards compatibility:
    // Format 1: { name, dorm, course }
    // Format 2: { dorm, course, professor } (professor optional)
    const { name, dorm, course, professor } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Validation: require dorm and course (name and professor are optional)
    if (!dorm || !course) {
      const elapsed = Date.now() - startTime;
      const missingFields = [];
      if (!dorm) missingFields.push('dorm');
      if (!course) missingFields.push('course');
      
      console.log(`[students/search] ${requestId} VALIDATION_ERROR ${elapsed}ms`, {
        receivedKeys,
        missingFields,
        error: 'dorm and course are required'
      });
      
      return res.status(400).json({ 
        error: 'Validation error',
        message: 'dorm and course are required',
        missingFields 
      });
    }

    // Normalize course code for matching
    const normalizedCourse = normalizeCourseCode(course);
    const studentName = name || 'Student';

    // Quick check: if courses table is empty, return 503 immediately
    try {
      const courseCountResult = await pool.query('SELECT COUNT(*) as count FROM courses LIMIT 1');
      const courseCount = parseInt(courseCountResult.rows[0]?.count || 0);
      if (courseCount === 0) {
        const elapsed = Date.now() - startTime;
        console.log(`[students/search] ${requestId} NO_DATA_503 ${elapsed}ms (courses table empty)`);
        return res.status(503).json({ 
          error: 'Service unavailable',
          message: 'Catalog data is not available. Please try again later.' 
        });
      }
    } catch (dbError) {
      console.error(`[students/search] ${requestId} DB_CHECK_ERROR:`, dbError.message);
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Database connection failed. Please try again later.'
      });
    }

    // Wrap entire handler in timeout
    const result = await Promise.race([
      (async () => {
        try {
          // Step 1: Get dorm ID
          const step1Start = Date.now();
          const dormResult = await pool.query('SELECT id FROM dorms WHERE name = $1', [dorm]);
          const step1Time = Date.now() - step1Start;
          console.log(`[students/search] ${requestId} STEP1: dorm lookup ${step1Time}ms`);
          
          if (dormResult.rows.length === 0) {
            return res.status(400).json({ 
              error: 'Validation error',
              message: 'Invalid dorm name',
              field: 'dorm',
              value: dorm
            });
          }
          const dormId = dormResult.rows[0].id;

          // Step 2: Get course ID using normalized course code
          const step2Start = Date.now();
          
          // Try to find course using code_normalized first, fallback to code if column doesn't exist
          let courseQuery = `
            SELECT id, code 
            FROM courses 
            WHERE code_normalized = $1
          `;
          let courseParams = [normalizedCourse];
          
          // Normalize professor for matching (optional)
          const normalizedProfessor = professor ? professor.trim().replace(/\s+/g, ' ') : null;
          
          if (normalizedProfessor) {
            courseQuery += ' AND (professor = $2 OR professor IS NULL OR LOWER(TRIM(professor)) = LOWER($2))';
            courseParams.push(normalizedProfessor);
          }

          let courseResult = await pool.query(courseQuery, courseParams);
          
          // Fallback: if code_normalized column doesn't exist, try using code directly (normalized)
          if (courseResult.rows.length === 0) {
            const fallbackQuery = `
              SELECT id, code 
              FROM courses 
              WHERE UPPER(TRIM(REPLACE(REPLACE(code, '.', ' '), '-', ' '))) = $1
            `;
            courseResult = await pool.query(fallbackQuery, [normalizedCourse]);
          }
          
          const step2Time = Date.now() - step2Start;
          console.log(`[students/search] ${requestId} STEP2: course lookup ${step2Time}ms (normalized: ${normalizedCourse}, professor: ${normalizedProfessor || 'none'})`);
          
          if (courseResult.rows.length === 0) {
            return res.status(400).json({ 
              error: 'Validation error',
              message: 'Invalid course or professor',
              field: 'course',
              value: course,
              professor: professor || null
            });
          }
          const courseId = courseResult.rows[0].id;
          const matchedCourseCode = courseResult.rows[0].code;

          // Step 3: Log the search (async, don't wait)
          const step3Start = Date.now();
          pool.query(
            'INSERT INTO student_searches (student_name, dorm_id, course_id, ip_address) VALUES ($1, $2, $3, $4)',
            [studentName, dormId, courseId, ipAddress]
          ).catch(err => console.error(`[students/search] ${requestId} Log insert error:`, err.message));
          const step3Time = Date.now() - step3Start;
          console.log(`[students/search] ${requestId} STEP3: log search ${step3Time}ms`);

          // Step 4: Get books for the course (optimized)
          const step4Start = Date.now();
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
          const step4Time = Date.now() - step4Start;
          console.log(`[students/search] ${requestId} STEP4: books query ${step4Time}ms (${booksResult.rows.length} books)`);

          // Separate required and optional books
          const requiredBooks = booksResult.rows.filter(b => b.is_required);
          const optionalBooks = booksResult.rows.filter(b => !b.is_required);

          // Step 5: Get bookstores with inventory in ONE optimized query (eliminates N+1)
          const step5Start = Date.now();
          const bookstoresResult = await pool.query(`
            WITH bookstore_books AS (
              SELECT DISTINCT
                bs.id as bookstore_id,
                bs.name,
                bs.phone,
                bs.address,
                bd.walking_distance,
                bd.distance_minutes,
                CASE 
                  WHEN COUNT(i.id) FILTER (WHERE i.quantity > 0) > 0 THEN 'In Stock'
                  ELSE 'Limited Stock'
                END as availability_status
              FROM bookstores bs
              JOIN bookstore_distances bd ON bs.id = bd.bookstore_id
              JOIN inventory i ON bs.id = i.bookstore_id
              JOIN books b ON i.book_id = b.id
              JOIN course_books cb ON b.id = cb.book_id
              WHERE bd.dorm_id = $1 AND cb.course_id = $2 AND i.quantity > 0
              GROUP BY bs.id, bs.name, bs.phone, bs.address, bd.walking_distance, bd.distance_minutes
            )
            SELECT 
              bb.*,
              COALESCE(
                JSON_AGG(
                  JSON_BUILD_OBJECT(
                    'book_id', b.id,
                    'title', b.title,
                    'author', b.author,
                    'isbn', b.isbn,
                    'price', i.price,
                    'quantity', i.quantity,
                    'availability_status', i.availability_status,
                    'is_required', cb.is_required,
                    'subject', s.name
                  )
                  ORDER BY cb.is_required DESC, b.title
                ) FILTER (WHERE b.id IS NOT NULL),
                '[]'::json
              ) as books
            FROM bookstore_books bb
            LEFT JOIN inventory i ON bb.bookstore_id = i.bookstore_id AND i.quantity > 0
            LEFT JOIN books b ON i.book_id = b.id
            LEFT JOIN subjects s ON b.subject_id = s.id
            LEFT JOIN course_books cb ON b.id = cb.book_id AND cb.course_id = $2
            GROUP BY bb.bookstore_id, bb.name, bb.phone, bb.address, bb.walking_distance, bb.distance_minutes, bb.availability_status
            ORDER BY bb.distance_minutes ASC
          `, [dormId, courseId]);
          const step5Time = Date.now() - step5Start;
          console.log(`[students/search] ${requestId} STEP5: bookstores query ${step5Time}ms (${bookstoresResult.rows.length} stores)`);

          // Transform results (books are already JSON aggregated)
          const detailedBookstores = bookstoresResult.rows.map(store => ({
            id: store.bookstore_id,
            name: store.name,
            phone: store.phone,
            address: store.address,
            walking_distance: store.walking_distance,
            distance_minutes: store.distance_minutes,
            availability_status: store.availability_status,
            books: Array.isArray(store.books) ? store.books : []
          }));

          const totalTime = Date.now() - startTime;
          console.log(`[students/search] ${requestId} SUCCESS ${totalTime}ms`, {
            requiredBooks: requiredBooks.length,
            optionalBooks: optionalBooks.length,
            bookstores: detailedBookstores.length
          });

          // Return response with both requiredBooks and books (for backwards compatibility)
          return res.json({
            ok: true,
            success: true, // Also include for backwards compatibility
            requiredBooks: requiredBooks,
            optionalBooks: optionalBooks,
            books: requiredBooks, // Alias for backwards compatibility
            bookstores: detailedBookstores,
            meta: {
              normalizedCourse,
              matchedCourseCode,
              courseId,
              studentName,
              professor: normalizedProfessor || null
            }
          });
        } catch (stepError) {
          console.error(`[students/search] ${requestId} STEP_ERROR:`, {
            error: stepError.message,
            stack: stepError.stack,
            sqlError: stepError.code || stepError.detail || null
          });
          throw stepError;
        }
      })(),
      createTimeout(TIMEOUT_MS)
    ]);

    // If we get here, result is the response (already sent)
    return result;

  } catch (error) {
    const elapsed = Date.now() - startTime;
    
    if (error.message === 'Request timeout') {
      console.error(`[students/search] ${requestId} TIMEOUT ${elapsed}ms`);
      return res.status(504).json({ 
        error: 'Request timeout', 
        message: 'The request took too long to process. Please try again.' 
      });
    }

    console.error(`[students/search] ${requestId} ERROR ${elapsed}ms`, {
      receivedKeys: Object.keys(req.body || {}),
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
      sqlError: error.code || error.detail || null
    });
    
    res.status(500).json({ 
      error: 'Server error processing search',
      message: process.env.NODE_ENV === 'production' ? 'Please try again later' : error.message
    });
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
    console.error('[students] Error fetching popular searches:', {
      limit: req.query?.limit,
      days: req.query?.days,
      error: error.message,
      stack: error.stack,
      sqlError: error.code || error.detail || null
    });
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
    console.error('[students] Error fetching dorm analytics:', {
      days: req.query?.days,
      error: error.message,
      stack: error.stack,
      sqlError: error.code || error.detail || null
    });
    res.status(500).json({ error: 'Server error fetching dorm analytics' });
  }
});

module.exports = router;
