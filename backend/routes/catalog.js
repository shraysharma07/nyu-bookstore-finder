// backend/routes/catalog.js
const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const fs = require('fs');
const { pool } = require('../server');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Parse course catalog PDF
router.post('/parse', upload.single('catalog'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read the PDF file
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdf(dataBuffer);
    
    // Extract text from PDF
    const text = pdfData.text;
    
    // Parse the text to extract course information
    const parsedData = parseCatalogText(text);
    
    // Save to database
    await saveToDatabase(parsedData);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      courses: parsedData.courses,
      professors: parsedData.professors,
      books: parsedData.books
    });
    
  } catch (error) {
    console.error('PDF parsing error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to parse PDF' });
  }
});

// Function to parse catalog text
function parseCatalogText(text) {
  const courses = [];
  const professors = new Set();
  const books = [];
  
  // Split text into lines
  const lines = text.split('\n');
  
  let currentCourse = null;
  let currentSection = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Pattern matching for course codes (e.g., "PSYC-UA 1" or "MATH-UA 121")
    const coursePattern = /^([A-Z]{3,4})-UA\s+(\d+)\s+(.+)/;
    const courseMatch = line.match(coursePattern);
    
    if (courseMatch) {
      // Save previous course if exists
      if (currentCourse) {
        courses.push(currentCourse);
      }
      
      // Start new course
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
    
    // Pattern for professor names (e.g., "Professor: Dr. Jane Smith" or "Instructor: John Doe")
    const profPattern = /^(Professor|Instructor|Prof\.|Dr\.):?\s+(.+)/i;
    const profMatch = line.match(profPattern);
    
    if (profMatch && currentCourse) {
      currentCourse.professor = profMatch[2].trim();
      professors.add(profMatch[2].trim());
      continue;
    }
    
    // Pattern for required texts section
    if (line.match(/^(Required Text|Required Reading|Required Book|Textbook)/i)) {
      currentSection = 'books';
      continue;
    }
    
    // Pattern for ISBN
    const isbnPattern = /ISBN[:\s-]*(\d{10}|\d{13})/i;
    const isbnMatch = line.match(isbnPattern);
    
    // Pattern for book entries (various formats)
    if (currentSection === 'books' && currentCourse) {
      // Format 1: "Title by Author (Year)"
      const bookPattern1 = /^(.+)\s+by\s+(.+)\s*\((\d{4})\)/;
      const bookMatch1 = line.match(bookPattern1);
      
      // Format 2: "Author, Title, Publisher"
      const bookPattern2 = /^([^,]+),\s*"?([^",]+)"?,\s*(.+)/;
      const bookMatch2 = line.match(bookPattern2);
      
      // Format 3: Bullet point or numbered list
      const bookPattern3 = /^[\d\-\*•]\s*(.+)/;
      const bookMatch3 = line.match(bookPattern3);
      
      let bookInfo = null;
      
      if (bookMatch1) {
        bookInfo = {
          title: bookMatch1[1].trim(),
          author: bookMatch1[2].trim(),
          year: bookMatch1[3],
          isbn: null,
          courseCode: currentCourse.code,
          isRequired: true
        };
      } else if (bookMatch2 && !isbnMatch) {
        bookInfo = {
          title: bookMatch2[2].trim(),
          author: bookMatch2[1].trim(),
          publisher: bookMatch2[3].trim(),
          isbn: null,
          courseCode: currentCourse.code,
          isRequired: true
        };
      } else if (bookMatch3) {
        // Try to parse the content after bullet point
        const content = bookMatch3[1];
        const byIndex = content.toLowerCase().indexOf(' by ');
        
        if (byIndex > -1) {
          bookInfo = {
            title: content.substring(0, byIndex).trim(),
            author: content.substring(byIndex + 4).trim(),
            isbn: null,
            courseCode: currentCourse.code,
            isRequired: true
          };
        }
      }
      
      // Add ISBN if found
      if (bookInfo && isbnMatch) {
        bookInfo.isbn = isbnMatch[1];
      }
      
      if (bookInfo) {
        books.push(bookInfo);
        currentCourse.books.push(bookInfo);
      }
    }
    
    // Collect description lines
    if (currentSection === 'course' && currentCourse && !line.match(/^(Professor|Instructor|Required)/i)) {
      currentCourse.description += line + ' ';
    }
  }
  
  // Add last course
  if (currentCourse) {
    courses.push(currentCourse);
  }
  
  return {
    courses: courses,
    professors: Array.from(professors),
    books: books
  };
}

// Save parsed data to database
async function saveToDatabase(data) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insert subjects (derive from course codes)
    const subjects = new Set();
    data.courses.forEach(course => {
      const subjectCode = course.code.split('-')[0];
      subjects.add(subjectCode);
    });
    
    const subjectMap = {};
    for (const subject of subjects) {
      const result = await client.query(
        'INSERT INTO subjects (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = $1 RETURNING id',
        [subject]
      );
      subjectMap[subject] = result.rows[0].id;
    }
    
    // Insert courses
    for (const course of data.courses) {
      const subjectCode = course.code.split('-')[0];
      const subjectId = subjectMap[subjectCode];
      
      await client.query(
        `INSERT INTO courses (code, name, professor, subject_id, semester, year) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         ON CONFLICT (code, professor) DO UPDATE 
         SET name = $2, subject_id = $4`,
        [course.code, course.name, course.professor, subjectId, 'Fall', 2025]
      );
    }
    
    // Insert books
    for (const book of data.books) {
      // Check if book exists
      let bookResult = await client.query(
        'SELECT id FROM books WHERE LOWER(title) = LOWER($1) AND LOWER(author) = LOWER($2)',
        [book.title, book.author]
      );
      
      let bookId;
      if (bookResult.rows.length === 0) {
        // Insert new book
        const insertResult = await client.query(
          'INSERT INTO books (title, author, isbn) VALUES ($1, $2, $3) RETURNING id',
          [book.title, book.author, book.isbn]
        );
        bookId = insertResult.rows[0].id;
      } else {
        bookId = bookResult.rows[0].id;
        
        // Update ISBN if it was missing
        if (book.isbn) {
          await client.query(
            'UPDATE books SET isbn = $1 WHERE id = $2 AND isbn IS NULL',
            [book.isbn, bookId]
          );
        }
      }
      
      // Link book to course
      if (book.courseCode) {
        const courseResult = await client.query(
          'SELECT id FROM courses WHERE code = $1',
          [book.courseCode]
        );
        
        if (courseResult.rows.length > 0) {
          await client.query(
            `INSERT INTO course_books (course_id, book_id, is_required) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (course_id, book_id) DO NOTHING`,
            [courseResult.rows[0].id, bookId, book.isRequired]
          );
        }
      }
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Get all parsed data summary
router.get('/summary', async (req, res) => {
  try {
    const coursesResult = await pool.query('SELECT COUNT(*) as count FROM courses');
    const booksResult = await pool.query('SELECT COUNT(*) as count FROM books');
    const professorsResult = await pool.query('SELECT COUNT(DISTINCT professor) as count FROM courses');
    
    res.json({
      courses: coursesResult.rows[0].count,
      books: booksResult.rows[0].count,
      professors: professorsResult.rows[0].count
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

module.exports = router;