// backend/utils/catalogImporter.js
// Production-ready catalog importer that replaces ALL catalog data
// Idempotent: running twice produces the same result
// Atomic: uses transaction to ensure all-or-nothing import

const { pool } = require('../db');

/**
 * Import catalog data and replace ALL existing catalog data (atomic transaction)
 * @param {Object} data - { courses: [], books: [] }
 * @returns {Object} Import summary with counts and errors
 */
async function importCatalog(data) {
  const client = await pool.connect();
  const summary = {
    coursesCreated: 0,
    coursesUpdated: 0,
    booksCreated: 0,
    booksUpdated: 0,
    relationshipsCreated: 0,
    duplicatesSkipped: 0,
    errors: [],
  };

  try {
    await client.query('BEGIN');

    // 1) TRUNCATE ALL existing catalog data (complete replacement, atomic)
    // Use TRUNCATE CASCADE for guaranteed replacement with FK safety
    await client.query('TRUNCATE TABLE course_books CASCADE');
    await client.query('TRUNCATE TABLE courses CASCADE');
    // Note: We keep books table as it might be referenced by inventory
    // But we'll update/create books as needed

    // 2) Upsert subjects (extract from course codes)
    const subjects = new Set();
    data.courses.forEach(c => {
      if (c.code) {
        const subj = c.code.split('-')[0];
        if (subj) subjects.add(subj);
      }
    });

    const subjectMap = {};
    for (const subject of subjects) {
      const r = await client.query(
        'INSERT INTO subjects (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
        [subject]
      );
      subjectMap[subject] = r.rows[0].id;
    }

    // 3) Insert/update courses (sanitized course codes)
    const courseIdByCode = {};
    for (const course of data.courses) {
      if (!course.code) {
        summary.errors.push({ type: 'course', reason: 'Missing course code', data: course });
        continue;
      }

      // Sanitize course code (already normalized by parser, but double-check)
      const sanitizedCode = course.code.trim().replace(/\s+/g, ' ').replace(/\s*\.\s*/g, '.').toUpperCase();
      
      const subjectCode = sanitizedCode.split('-')[0];
      const subjectId = subjectCode ? subjectMap[subjectCode] : null;

      // Check if course exists (by code + professor + semester + year)
      const existing = await client.query(
        'SELECT id FROM courses WHERE code = $1 AND (professor = $2 OR ($2 IS NULL AND professor IS NULL)) AND (semester = $3 OR ($3 IS NULL AND semester IS NULL)) AND (year = $4 OR ($4 IS NULL AND year IS NULL))',
        [sanitizedCode, course.professor || null, course.semester || null, course.year || null]
      );

      if (existing.rows[0]) {
        // Update existing
        await client.query(
          'UPDATE courses SET name = $1, subject_id = $2 WHERE id = $3',
          [course.name || sanitizedCode, subjectId, existing.rows[0].id]
        );
        courseIdByCode[sanitizedCode] = existing.rows[0].id;
        summary.coursesUpdated++;
      } else {
        // Insert new
        const r = await client.query(
          `INSERT INTO courses (code, name, professor, subject_id, semester, year)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [
            sanitizedCode,
            course.name || sanitizedCode,
            course.professor || null,
            subjectId,
            course.semester || null,
            course.year || null,
          ]
        );
        courseIdByCode[sanitizedCode] = r.rows[0].id;
        summary.coursesCreated++;
      }
    }

    // 4) Insert/update books and create course_books relationships
    const bookIdByKey = {}; // key: isbn|title|author -> bookId

    for (const book of data.books) {
      if (!book.title && !book.isbn) {
        summary.duplicatesSkipped++;
        continue;
      }

      // Find course code (sanitize to match what was inserted)
      const sanitizedCourseCode = book.courseCode ? book.courseCode.trim().replace(/\s+/g, ' ').replace(/\s*\.\s*/g, '.').toUpperCase() : null;
      const courseId = sanitizedCourseCode ? courseIdByCode[sanitizedCourseCode] : null;
      
      if (!courseId) {
        summary.errors.push({ 
          type: 'book', 
          reason: 'Course not found', 
          courseCode: book.courseCode 
        });
        continue;
      }

      // Create dedupe key for books
      const bookKey = `${book.isbn || ''}|${(book.title || '').toLowerCase()}|${(book.author || '').toLowerCase()}`;

      let bookId;
      if (bookIdByKey[bookKey]) {
        // Already processed this book
        bookId = bookIdByKey[bookKey];
      } else {
        // Find or create book
        const existing = await client.query(
          `SELECT id FROM books
           WHERE (isbn = $1 OR ($1 IS NULL AND isbn IS NULL))
             AND LOWER(title) = LOWER($2)
             AND (LOWER(author) = LOWER($3) OR ($3 IS NULL AND author IS NULL))`,
          [book.isbn || null, book.title || null, book.author || null]
        );

        if (existing.rows[0]) {
          bookId = existing.rows[0].id;
          // Update ISBN if missing
          if (book.isbn) {
            await client.query('UPDATE books SET isbn = COALESCE(isbn, $1) WHERE id = $2', [book.isbn, bookId]);
          }
          summary.booksUpdated++;
        } else {
          // Get subject for book (from course)
          const subjectCode = sanitizedCourseCode ? sanitizedCourseCode.split('-')[0] : null;
          const subjectId = subjectCode ? subjectMap[subjectCode] : null;

          const ins = await client.query(
            'INSERT INTO books (title, author, isbn, subject_id) VALUES ($1, $2, $3, $4) RETURNING id',
            [book.title || null, book.author || null, book.isbn || null, subjectId]
          );
          bookId = ins.rows[0].id;
          summary.booksCreated++;
        }
        bookIdByKey[bookKey] = bookId;
      }

      // Create course_books relationship
      const existingRel = await client.query(
        'SELECT id FROM course_books WHERE course_id = $1 AND book_id = $2',
        [courseId, bookId]
      );

      if (!existingRel.rows[0]) {
        await client.query(
          'INSERT INTO course_books (course_id, book_id, is_required) VALUES ($1, $2, $3)',
          [courseId, bookId, !!book.isRequired]
        );
        summary.relationshipsCreated++;
      } else {
        // Update is_required if changed
        await client.query(
          'UPDATE course_books SET is_required = $1 WHERE course_id = $2 AND book_id = $3',
          [!!book.isRequired, courseId, bookId]
        );
      }
    }

    await client.query('COMMIT');
    return summary;
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[catalogImporter] Transaction failed:', {
      error: e.message,
      stack: e.stack,
      sqlError: e.code || e.detail || null
    });
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { importCatalog };
