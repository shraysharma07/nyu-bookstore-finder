const express = require('express');
const { pool } = require('../server');
const { authenticateToken } = require('../middleware/auth');

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
    
    let params = [courseCode];
    
    if (professor) {
      query += ' AND c.professor = $2';
      params.push(professor);
    }
    
    query += ' ORDER BY cb.is_required DESC, b.title';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      books: result.rows
    });

  } catch (error) {
    console.error('Error fetching books for course:', error);
    res.status(500).json({ error: 'Server error fetching books' });
  }
});

// Get all books with inventory info for a bookstore
router.get('/inventory/:bookstoreId', authenticateToken, async (req, res) => {
  try {
    const { bookstoreId } = req.params;

    // Verify the authenticated user owns this bookstore
    if (req.user.id !== parseInt(bookstoreId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(`
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
    `, [bookstoreId]);

    res.json({
      success: true,
      inventory: result.rows
    });

  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Server error fetching inventory' });
  }
});

// Add new book to inventory
router.post('/inventory', authenticateToken, async (req, res) => {
  try {
    const { title, author, isbn, subject, price, quantity } = req.body;
    const bookstoreId = req.user.id;

    if (!title || !author || !subject || !price || !quantity) {
      return res.status(400).json({ error: 'All fields except ISBN are required' });
    }

    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get or create subject
      let subjectResult = await client.query(
        'SELECT id FROM subjects WHERE name = $1',
        [subject]
      );

      let subjectId;
      if (subjectResult.rows.length === 0) {
        // Create new subject
        const newSubject = await client.query(
          'INSERT INTO subjects (name) VALUES ($1) RETURNING id',
          [subject]
        );
        subjectId = newSubject.rows[0].id;
      } else {
        subjectId = subjectResult.rows[0].id;
      }

      // Check if book already exists
      let bookResult = await client.query(
        'SELECT id FROM books WHERE title = $1 AND author = $2',
        [title, author]
      );

      let bookId;
      if (bookResult.rows.length === 0) {
        // Create new book
        const newBook = await client.query(
          'INSERT INTO books (title, author, isbn, subject_id) VALUES ($1, $2, $3, $4) RETURNING id',
          [title, author, isbn || null, subjectId]
        );
        bookId = newBook.rows[0].id;
      } else {
        bookId = bookResult.rows[0].id;
        
        // Check if this bookstore already has this book
        const existingInventory = await client.query(
          'SELECT id FROM inventory WHERE bookstore_id = $1 AND book_id = $2',
          [bookstoreId, bookId]
        );
        
        if (existingInventory.rows.length > 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'This book is already in your inventory' });
        }
      }

      // Add to inventory
      const availability = quantity > 0 ? 'In Stock' : 'Out of Stock';
      await client.query(
        'INSERT INTO inventory (bookstore_id, book_id, price, quantity, availability_status) VALUES ($1, $2, $3, $4, $5)',
        [bookstoreId, bookId, price, quantity, availability]
      );

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Book added to inventory successfully'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error adding book to inventory:', error);
    res.status(500).json({ error: 'Server error adding book' });
  }
});

// Update inventory item
router.put('/inventory/:inventoryId', authenticateToken, async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { title, author, isbn, subject, price, quantity } = req.body;
    const bookstoreId = req.user.id;

    // Verify ownership
    const ownershipCheck = await pool.query(
      'SELECT book_id FROM inventory WHERE id = $1 AND bookstore_id = $2',
      [inventoryId, bookstoreId]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const bookId = ownershipCheck.rows[0].book_id;

    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update book details
      if (title || author || isbn || subject) {
        let subjectId = null;
        
        if (subject) {
          let subjectResult = await client.query(
            'SELECT id FROM subjects WHERE name = $1',
            [subject]
          );

          if (subjectResult.rows.length === 0) {
            const newSubject = await client.query(
              'INSERT INTO subjects (name) VALUES ($1) RETURNING id',
              [subject]
            );
            subjectId = newSubject.rows[0].id;
          } else {
            subjectId = subjectResult.rows[0].id;
          }
        }

        let bookUpdateQuery = 'UPDATE books SET ';
        let updateParams = [];
        let paramCount = 0;

        if (title) {
          updateParams.push(title);
          bookUpdateQuery += `title = $${++paramCount}, `;
        }
        if (author) {
          updateParams.push(author);
          bookUpdateQuery += `author = $${++paramCount}, `;
        }
        if (isbn !== undefined) {
          updateParams.push(isbn || null);
          bookUpdateQuery += `isbn = $${++paramCount}, `;
        }
        if (subjectId) {
          updateParams.push(subjectId);
          bookUpdateQuery += `subject_id = $${++paramCount}, `;
        }

        bookUpdateQuery += `updated_at = CURRENT_TIMESTAMP WHERE id = $${++paramCount}`;
        updateParams.push(bookId);

        await client.query(bookUpdateQuery, updateParams);
      }

      // Update inventory
      if (price !== undefined || quantity !== undefined) {
        const availability = (quantity !== undefined ? quantity : 0) > 0 ? 'In Stock' : 'Out of Stock';
        
        let inventoryUpdateQuery = 'UPDATE inventory SET ';
        let inventoryParams = [];
        let paramCount = 0;

        if (price !== undefined) {
          inventoryParams.push(price);
          inventoryUpdateQuery += `price = $${++paramCount}, `;
        }
        if (quantity !== undefined) {
          inventoryParams.push(quantity);
          inventoryUpdateQuery += `quantity = $${++paramCount}, `;
          inventoryParams.push(availability);
          inventoryUpdateQuery += `availability_status = $${++paramCount}, `;
        }

        inventoryUpdateQuery += `updated_at = CURRENT_TIMESTAMP WHERE id = $${++paramCount}`;
        inventoryParams.push(inventoryId);

        await client.query(inventoryUpdateQuery, inventoryParams);
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Inventory updated successfully'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ error: 'Server error updating inventory' });
  }
});

// Delete inventory item
router.delete('/inventory/:inventoryId', authenticateToken, async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const bookstoreId = req.user.id;

    // Verify ownership and delete
    const result = await pool.query(
      'DELETE FROM inventory WHERE id = $1 AND bookstore_id = $2 RETURNING id',
      [inventoryId, bookstoreId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json({
      success: true,
      message: 'Book removed from inventory'
    });

  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Server error deleting inventory item' });
  }
});

module.exports = router;