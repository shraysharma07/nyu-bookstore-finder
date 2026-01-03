// routes/catalog.js — Fall/Spring PDF parser for NYU Madrid book list
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const pdf = require('pdf-parse');
const { pool } = require('../db');

const router = express.Router();

// ------- multer setup (temp files on EB instance) -------
const uploadDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    cb(new Error('Only PDF files are allowed'));
  }
});

// ------------ MAIN ENDPOINT ------------
// POST /api/catalog/upload
router.post('/upload', upload.single('catalog'), async (req, res) => {
  let tmpPath = req.file && req.file.path;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'no_file' });
    }

    const dataBuffer = fs.readFileSync(tmpPath);
    const pdfData = await pdf(dataBuffer);
    const text = String(pdfData && pdfData.text || '');

    const parsed = parseCatalogText(text);

    // save to DB (one semester at a time; delete+reinsert)
    try {
      await saveToDatabase(parsed, {
        semester: process.env.CATALOG_SEMESTER || 'Fall',
        year: Number(process.env.CATALOG_YEAR) || 2025,
      });
    } catch (dbErr) {
      console.warn('[catalog] saveToDatabase failed (continuing):', dbErr.message);
    }

    safeUnlink(tmpPath);
    tmpPath = null;

    return res.json({
      success: true,
      courses: parsed.courses,
      professors: parsed.professors,
      books: parsed.books,
    });
  } catch (err) {
    console.error('[catalog] upload/parse error:', err);
    if (tmpPath) safeUnlink(tmpPath);
    return res.status(500).json({ success: false, error: 'parse_failed' });
  }
});

// optional alias so /api/catalog/parse still works if anything calls it
router.post('/parse', upload.single('catalog'), async (req, res) => {
  req.url = '/upload';
  router.handle(req, res);
});

// ------- helpers -------

function safeUnlink(p) {
  try {
    if (p && fs.existsSync(p)) fs.unlinkSync(p);
  } catch (_) {}
}

/**
 * Heuristic parser tuned to the “2025 Fall List for Book-finding Site” PDF.
 *
 * High-level strategy:
 * - Split into lines, trim, drop blanks.
 * - Detect new course blocks by course-code patterns (SPAN-UA 9001, FINC-UB 9002.M01, etc.).
 * - Inside each course block:
 *    * Track “detail” lines.
 *    * Whenever we see an ISBN, create a book entry using:
 *        - title: the most recent line that looks like a book title
 *        - author: the most recent line that looks like an author list
 *        - required vs supplemental: based on nearby lines
 */
function parseCatalogText(raw) {
  const lines = String(raw || '')
    .split('\n')
    .map(l => l.replace(/\u00a0/g, ' ').trim()) // remove NBSP
    .filter(Boolean);

  const courses = [];
  const books = [];
  const professorsSet = new Set(); // this will remain mostly empty (catalog rarely lists profs)

  // Course codes look like SPAN-UA 9001, SPAN-UA. 9050, FINC-UB 9002.M01, ACA-UF 9101, etc.
  const courseCodeRegex =
    /^([A-Z]{2,8}-[A-Z]{1,3}\.? ?\d{3,4}(?:\.[A-Z0-9]+)?)\s*(.*)$/;

  const metaRegex =
    /(Required|Recomended|Recommended|Supplemental|Content|Bookstore|Brightspace|LS First Year Abroad|Type of Class|Digital\?|First year\?)/i;

  const likelyAuthorRegex =
    /^[A-ZÁÉÍÓÚÑ][^0-9]*,\s*[A-ZÁÉÍÓÚÑ][^0-9]*$/; // "Last, First" style

  let currentCourse = null;
  let buffer = [];

  function flushCourse() {
    if (!currentCourse) return;

    const details = buffer;
    let lastAuthor = null;
    let lastTitle = null;

    for (let i = 0; i < details.length; i++) {
      const line = details[i];

      // skip obvious catalog meta and bookstore notes
      if (metaRegex.test(line)) continue;

      // keep track of a “recent author-like” line
      if (likelyAuthorRegex.test(line)) {
        lastAuthor = line;
        continue;
      }

      // keep a candidate title: non-meta, no obvious urls, and not just course notes
      if (!/https?:\/\//i.test(line) && !/LS First Year Abroad/i.test(line)) {
        lastTitle = line;
      }

      const isbnMatch = line.match(/\b(\d{10,13})\b/);
      if (isbnMatch) {
        const isbn = isbnMatch[1];

        // Decide required vs supplemental from nearby lines
        let isRequired = false;
        let isSupplemental = false;

        for (let j = Math.max(0, i - 3); j <= Math.min(details.length - 1, i + 3); j++) {
          const context = details[j];
          if (/Required/i.test(context)) {
            isRequired = true;
            break;
          }
          if (/Supplemental|Recomended|Recommended/i.test(context)) {
            isSupplemental = true;
          }
        }

        const book = {
          title: lastTitle || null,
          author: lastAuthor || null,
          isbn,
          courseCode: currentCourse.code,
          isRequired: isRequired || !isSupplemental,
        };

        books.push(book);
        currentCourse.books.push(book);
      }
    }

    courses.push(currentCourse);
    currentCourse = null;
    buffer = [];
  }

  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (!line) continue;

    // Skip the header rows like "Course Code Class Title Author Title ISBN"
    if (/^Course Code\b/i.test(line)) continue;

    const m = line.match(courseCodeRegex);
    if (m) {
      // We hit a new course code -> flush previous one
      flushCourse();

      const code = m[1].replace(/\s+/g, ' ');
      const name = (m[2] || '').trim();

      currentCourse = {
        code,
        name,
        professor: null, // catalog PDF doesn’t list instructors consistently
        books: [],
        description: ''
      };
      buffer = [];
      continue;
    }

    if (!currentCourse) {
      // Ignore text that appears before the first course entry
      continue;
    }

    buffer.push(line);
  }

  flushCourse();

  const professors = Array.from(professorsSet); // currently unused/empty but kept for API shape

  console.log(
    `[catalog] parsed → courses=${courses.length}, books=${books.length}`
  );

  return { courses, professors, books };
}

/**
 * Save parsed catalog to DB.
 *
 * Behavior:
 * - Treats everything as one semester/year (from options or env).
 * - On each upload, it DELETES previous courses+course_books for that semester/year,
 *   then re-inserts from the new catalog. So uploads do NOT "stack"; they replace.
 */
async function saveToDatabase(data, { semester, year }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) Clear existing data for this semester/year
    const existingCourses = await client.query(
      'SELECT id FROM courses WHERE semester = $1 AND year = $2',
      [semester, year]
    );
    const existingCourseIds = existingCourses.rows.map(r => r.id);

    if (existingCourseIds.length) {
      await client.query(
        'DELETE FROM course_books WHERE course_id = ANY($1::int[])',
        [existingCourseIds]
      );
      await client.query(
        'DELETE FROM courses WHERE id = ANY($1::int[])',
        [existingCourseIds]
      );
    }

    // 2) Upsert subjects
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

    // 3) Insert courses
    const courseIdByCode = {};
    for (const course of data.courses) {
      const subjectCode = course.code ? course.code.split('-')[0] : null;
      const subjectId = subjectCode ? subjectMap[subjectCode] : null;

      const r = await client.query(
        `INSERT INTO courses (code, name, professor, subject_id, semester, year)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING id`,
        [course.code, course.name, course.professor, subjectId, semester, year]
      );

      courseIdByCode[course.code] = r.rows[0].id;
    }

    // 4) Insert books + course_books (dedupe by title+author+isbn)
    for (const book of data.books) {
      if (!book.title && !book.isbn) continue;

      const existing = await client.query(
        `SELECT id FROM books
         WHERE (LOWER(title) = LOWER($1) OR $1 IS NULL)
           AND (LOWER(author) = LOWER($2) OR $2 IS NULL)
           AND (isbn = $3 OR $3 IS NULL)`,
        [book.title || null, book.author || null, book.isbn || null]
      );

      let bookId;
      if (existing.rows[0]) {
        bookId = existing.rows[0].id;
        // if we have an ISBN now and the existing row didn't, update it
        if (book.isbn) {
          await client.query(
            'UPDATE books SET isbn = COALESCE(isbn, $1) WHERE id = $2',
            [book.isbn, bookId]
          );
        }
      } else {
        const ins = await client.query(
          'INSERT INTO books (title, author, isbn) VALUES ($1,$2,$3) RETURNING id',
          [book.title || null, book.author || null, book.isbn || null]
        );
        bookId = ins.rows[0].id;
      }

      const courseId = courseIdByCode[book.courseCode];
      if (!courseId) continue;

      await client.query(
        `INSERT INTO course_books (course_id, book_id, is_required)
         VALUES ($1,$2,$3)
         ON CONFLICT (course_id, book_id) DO UPDATE SET is_required = EXCLUDED.is_required`,
        [courseId, bookId, !!book.isRequired]
      );
    }

    await client.query('COMMIT');
    console.log(
      `[catalog] saved to DB → courses=${data.courses.length}, books=${data.books.length}, semester=${semester}, year=${year}`
    );
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[catalog] saveToDatabase error:', e);
    throw e;
  } finally {
    client.release();
  }
}

// summary endpoint used by the admin dashboard
router.get('/summary', async (_req, res) => {
  try {
    const coursesResult = await pool.query(
      'SELECT COUNT(*) AS count FROM courses'
    );
    const booksResult = await pool.query(
      'SELECT COUNT(*) AS count FROM books'
    );
    const professorsResult = await pool.query(
      'SELECT COUNT(DISTINCT professor) AS count FROM courses WHERE professor IS NOT NULL'
    );
    res.json({
      courses: Number(coursesResult.rows[0].count || 0),
      books: Number(booksResult.rows[0].count || 0),
      professors: Number(professorsResult.rows[0].count || 0)
    });
  } catch (e) {
    console.error('[catalog] summary error:', e);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

module.exports = router;
