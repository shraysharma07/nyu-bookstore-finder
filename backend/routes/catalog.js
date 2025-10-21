// routes/catalog.js — PDF parser (librarian use)
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const pdf = require('pdf-parse');
const { pool } = require('../db');

const router = express.Router();

// make sure uploads dir exists
const uploadDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  }
});

// POST /api/catalog/parse  (you can add auth middleware later)
router.post('/parse', upload.single('catalog'), async (req, res) => {
  let tmpPath = req.file?.path;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'no_file' });
    }

    const dataBuffer = fs.readFileSync(tmpPath);
    const pdfData = await pdf(dataBuffer);
    const text = pdfData?.text || '';

    const parsed = parseCatalogText(text);

    try {
      await saveToDatabase(parsed);
    } catch (dbErr) {
      console.warn('[catalog] saveToDatabase failed (continuing):', dbErr.message);
    }

    cleanup(tmpPath);
    tmpPath = null;

    return res.json({
      success: true,
      courses: parsed.courses,
      professors: parsed.professors,
      books: parsed.books
    });
  } catch (err) {
    console.error('[catalog] parse error:', err);
    if (tmpPath) cleanup(tmpPath);
    return res.status(500).json({ success: false, error: 'parse_failed' });
  }
});

function cleanup(p) {
  try { fs.existsSync(p) && fs.unlinkSync(p); } catch {}
}

// ------- your existing parsing logic (kept) -------
function parseCatalogText(text) {
  const courses = [];
  const professors = new Set();
  const books = [];

  const lines = String(text || '').split('\n');
  let currentCourse = null;
  let currentSection = '';

  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] || '').trim();
    if (!line) continue;

    const coursePattern = /^([A-Z]{3,4})-UA\s+(\d+)\s+(.+)/;
    const courseMatch = line.match(coursePattern);

    if (courseMatch) {
      if (currentCourse) courses.push(currentCourse);
      currentCourse = {
        code: `${courseMatch[1]}-UA ${courseMatch[2]}`,
        name: courseMatch[3].trim(),
        professor: null,
        books: [],
        description: ''
      };
      currentSection = 'course';
      continue;
    }

    const profPattern = /^(Professor|Instructor|Prof\.|Dr\.):?\s+(.+)/i;
    const profMatch = line.match(profPattern);
    if (profMatch && currentCourse) {
      currentCourse.professor = profMatch[2].trim();
      professors.add(profMatch[2].trim());
      continue;
    }

    if (/^(Required Text|Required Reading|Required Book|Textbook)/i.test(line)) {
      currentSection = 'books';
      continue;
    }

    const isbnMatch = line.match(/ISBN[:\s-]*(\d{10}|\d{13})/i);

    if (currentSection === 'books' && currentCourse) {
      const bookPattern1 = /^(.+)\s+by\s+(.+)\s*\((\d{4})\)/;
      const bookMatch1 = line.match(bookPattern1);
      const bookPattern2 = /^([^,]+),\s*"?([^",]+)"?,\s*(.+)/;
      const bookMatch2 = line.match(bookPattern2);
      const bookPattern3 = /^[\d\-\*•]\s*(.+)/;
      const bookMatch3 = line.match(bookPattern3);

      let bookInfo = null;

      if (bookMatch1) {
        bookInfo = { title: bookMatch1[1].trim(), author: bookMatch1[2].trim(), year: bookMatch1[3], isbn: null, courseCode: currentCourse.code, isRequired: true };
      } else if (bookMatch2 && !isbnMatch) {
        bookInfo = { title: bookMatch2[2].trim(), author: bookMatch2[1].trim(), publisher: bookMatch2[3].trim(), isbn: null, courseCode: currentCourse.code, isRequired: true };
      } else if (bookMatch3) {
        const content = bookMatch3[1];
        const byIndex = content.toLowerCase().indexOf(' by ');
        if (byIndex > -1) {
          bookInfo = { title: content.substring(0, byIndex).trim(), author: content.substring(byIndex + 4).trim(), isbn: null, courseCode: currentCourse.code, isRequired: true };
        }
      }

      if (bookInfo && isbnMatch) bookInfo.isbn = isbnMatch[1];

      if (bookInfo) {
        books.push(bookInfo);
        currentCourse.books.push(bookInfo);
      }
    }

    if (currentSection === 'course' && currentCourse && !/^(Professor|Instructor|Required)/i.test(line)) {
      currentCourse.description += line + ' ';
    }
  }

  if (currentCourse) courses.push(currentCourse);

  return { courses, professors: Array.from(professors), books };
}

async function saveToDatabase(data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const subjects = new Set();
    data.courses.forEach(c => subjects.add(c.code.split('-')[0]));

    const subjectMap = {};
    for (const subject of subjects) {
      const r = await client.query(
        'INSERT INTO subjects (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = $1 RETURNING id',
        [subject]
      );
      subjectMap[subject] = r.rows[0].id;
    }

    for (const course of data.courses) {
      const subjectId = subjectMap[course.code.split('-')[0]];
      await client.query(
        `INSERT INTO courses (code, name, professor, subject_id, semester, year)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (code, professor) DO UPDATE SET name=$2, subject_id=$4`,
        [course.code, course.name, course.professor, subjectId, 'Fall', 2025]
      );
    }

    for (const book of data.books) {
      const exist = await client.query(
        'SELECT id FROM books WHERE LOWER(title)=LOWER($1) AND LOWER(author)=LOWER($2)',
        [book.title, book.author]
      );
      let bookId = exist.rows[0]?.id;
      if (!bookId) {
        const ins = await client.query(
          'INSERT INTO books (title, author, isbn) VALUES ($1,$2,$3) RETURNING id',
          [book.title, book.author, book.isbn || null]
        );
        bookId = ins.rows[0].id;
      } else if (book.isbn) {
        await client.query('UPDATE books SET isbn=$1 WHERE id=$2 AND isbn IS NULL', [book.isbn, bookId]);
      }

      if (book.courseCode) {
        const cr = await client.query('SELECT id FROM courses WHERE code=$1', [book.courseCode]);
        if (cr.rows[0]) {
          await client.query(
            `INSERT INTO course_books (course_id, book_id, is_required)
             VALUES ($1,$2,$3) ON CONFLICT (course_id, book_id) DO NOTHING`,
            [cr.rows[0].id, bookId, !!book.isRequired]
          );
        }
      }
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// summary
router.get('/summary', async (_req, res) => {
  try {
    const coursesResult = await pool.query('SELECT COUNT(*) AS count FROM courses');
    const booksResult = await pool.query('SELECT COUNT(*) AS count FROM books');
    const professorsResult = await pool.query('SELECT COUNT(DISTINCT professor) AS count FROM courses');
    res.json({
      courses: Number(coursesResult.rows[0].count || 0),
      books: Number(booksResult.rows[0].count || 0),
      professors: Number(professorsResult.rows[0].count || 0),
    });
  } catch (e) {
    console.error('[catalog] summary error:', e);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

module.exports = router;
