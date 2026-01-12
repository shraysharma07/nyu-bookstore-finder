// backend/routes/books.js
const express = require('express');
const { pool } = require('../db'); // ✅ correct: db.js exports pool
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Get books for a specific course
router.get('/course/:courseCode', async (req, res) => {
  try {
    const { courseCode } = req.params;
    const { professor } = req.query;

    let query = `
      SELECT 
        b.id,
        b.title,
        b.author,
        b.isbn,
        s.name as subject,
        cb.is_required
      FROM books b
      JOIN course_books cb ON b.id = cb.book_id
      JOIN courses c ON cb.course_id = c.id
      JOIN subjects s ON b.subject_id = s.id
      WHERE c.code = $1
    `;

    const params = [courseCode];

    if (professor) {
      query += ' AND c.professor = $2';
      params.push(professor);
    }

    query += ' ORDER BY cb.is_required DESC, b.title';

    const result = await pool.query(query, params);

    res.json({ success: true, books: result.rows });
  } catch (error) {
    console.error('[books] Error fetching books for course:', {
      courseCode: req.params.courseCode,
      professor: req.query.professor,
      error: error.message,
      stack: error.stack,
      sqlError: error.code || error.detail || null
    });
    res.status(500).json({ error: 'Server error fetching books' });
  }
});

// Get all books with inventory info for a bookstore
router.get('/inventory/:bookstoreId', requireAuth, async (req, res) => {
  try {
    const { bookstoreId } = req.params;

    if (req.user.id !== parseInt(bookstoreId, 10)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `
      SELECT 
        b.id,
        b.title,
        b.author,
        b.isbn,
        s.name as subject,
        i.price,
        i.quantity,
        i.availability_status,
        TO_CHAR(i.created_at, 'YYYY-MM-DD') as added_date
      FROM books b
      JOIN inventory i ON b.id = i.book_id
      JOIN subjects s ON b.subject_id = s.id
      WHERE i.bookstore_id = $1
      ORDER BY i.created_at DESC
      `,
      [bookstoreId]
    );

    res.json({ success: true, inventory: result.rows });
  } catch (error) {
    console.error('[books] Error fetching inventory:', {
      bookstoreId: req.params.bookstoreId,
      error: error.message,
      stack: error.stack,
      sqlError: error.code || error.detail || null
    });
    res.status(500).json({ error: 'Server error fetching inventory' });
  }
});

// Add new book to inventory
router.post('/inventory', requireAuth, async (req, res) => {
  try {
    const { title, author, isbn, subject, price, quantity } = req.body;
    const bookstoreId = req.user.id;

    if (!title || !author || !subject || !price || !quantity) {
      return res.status(400).json({ error: 'All fields except ISBN are required' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let subjectResult = await client.query(
        'SELECT id FROM subjects WHERE name = $1',
        [subject]
      );

      let subjectId;
      if (subjectResult.rows.length === 0) {
        const newSubject = await client.query(
          'INSERT INTO subjects (name) VALUES ($1) RETURNING id',
          [subject]
        );
        subjectId = newSubject.rows[0].id;
      } else {
        subjectId = subjectResult.rows[0].id;
      }

      let bookResult = await client.query(
        'SELECT id FROM books WHERE title = $1 AND author = $2',
        [title, author]
      );

      let bookId;
      if (bookResult.rows.length === 0) {
        const newBook = await client.query(
          'INSERT INTO books (title, author, isbn, subject_id) VALUES ($1, $2, $3, $4) RETURNING id',
          [title, author, isbn || null, subjectId]
        );
        bookId = newBook.rows[0].id;
      } else {
        bookId = bookResult.rows[0].id;

        const existingInventory = await client.query(
          'SELECT id FROM inventory WHERE bookstore_id = $1 AND book_id = $2',
          [bookstoreId, bookId]
        );

        if (existingInventory.rows.length > 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'This book is already in your inventory' });
        }
      }

      const availability = Number(quantity) > 0 ? 'In Stock' : 'Out of Stock';
      await client.query(
        'INSERT INTO inventory (bookstore_id, book_id, price, quantity, availability_status) VALUES ($1, $2, $3, $4, $5)',
        [bookstoreId, bookId, price, quantity, availability]
      );

      await client.query('COMMIT');

      res.status(201).json({ success: true, message: 'Book added to inventory successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[books] Error adding book to inventory:', {
      bookstoreId: req.user?.id,
      error: error.message,
      stack: error.stack,
      sqlError: error.code || error.detail || null
    });
    res.status(500).json({ error: 'Server error adding book' });
  }
});

// Update inventory item
router.put('/inventory/:inventoryId', requireAuth, async (req, res) => {
  // (leave your existing logic as-is)
});

// Delete inventory item
router.delete('/inventory/:inventoryId', requireAuth, async (req, res) => {
  // (leave your existing logic as-is)
});

module.exports = router;
