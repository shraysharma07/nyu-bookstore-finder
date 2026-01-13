// backend/utils/csvParser.js
// Robust CSV parser for course catalog with validation and normalization

/**
 * Parse CSV content into structured catalog data
 * @param {string} csvContent - Raw CSV content
 * @returns {Object} { courses, books, errors, summary }
 */
function parseCSV(csvContent) {
  const lines = csvContent
    .split('\n')
    .map((line, idx) => ({ line: line.trim(), rowNum: idx + 1 }))
    .filter(({ line }) => line.length > 0);

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse header
  const headerLine = lines[0].line;
  const headers = parseCSVLine(headerLine).map(h => h.trim());
  
  const expectedHeaders = [
    'Teacher', 'Course Code', 'Class Title', 'Author', 'Title', 
    'ISBN', 'Required or Supplemental', 'Notes', 'Type of Class', 
    'Digital?', 'First year/Notes'
  ];

  // Validate headers (case-insensitive, allow variations)
  const headerMap = {};
  headers.forEach((h, idx) => {
    const normalized = h.toLowerCase().trim();
    expectedHeaders.forEach(expected => {
      if (normalized.includes(expected.toLowerCase().replace(/\s+/g, ''))) {
        headerMap[expected] = idx;
      }
    });
  });

  // Ensure we have at least Course Code
  if (headerMap['Course Code'] === undefined) {
    throw new Error('CSV missing required "Course Code" column');
  }

  const courses = new Map(); // courseCode -> course data
  const books = [];
  const errors = [];
  const seenBooks = new Set(); // for deduplication: courseCode|isbn|title

  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    const { line, rowNum } = lines[i];
    const values = parseCSVLine(line);

    try {
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = (values[idx] || '').trim();
      });

      // Extract fields using header map
      const teacher = normalizeTeacher(row[headers[headerMap['Teacher']] || '']);
      const courseCode = normalizeCourseCode(row[headers[headerMap['Course Code']] || '']);
      const classTitle = normalizeText(row[headers[headerMap['Class Title']] || '']);
      const author = normalizeText(row[headers[headerMap['Author']] || '']);
      const title = normalizeText(row[headers[headerMap['Title']] || '']);
      const isbn = normalizeISBN(row[headers[headerMap['ISBN']] || '']);
      const requiredText = normalizeText(row[headers[headerMap['Required or Supplemental']] || '']);
      const notes = normalizeText(row[headers[headerMap['Notes']] || '']);
      const typeOfClass = normalizeText(row[headers[headerMap['Type of Class']] || '']);
      const digital = normalizeDigital(row[headers[headerMap['Digital?']] || '']);
      const firstYear = normalizeText(row[headers[headerMap['First year/Notes']] || '']);

      // Skip rows without course code
      if (!courseCode) {
        errors.push({ row: rowNum, reason: 'Missing Course Code', data: row });
        continue;
      }

      // Create/update course entry
      if (!courses.has(courseCode)) {
        courses.set(courseCode, {
          code: courseCode,
          name: classTitle || courseCode,
          professor: teacher || null,
          typeOfClass: typeOfClass || null,
          semester: null, // CSV doesn't have semester
          year: null, // CSV doesn't have year
        });
      } else {
        // Update course if we have more info
        const course = courses.get(courseCode);
        if (classTitle && !course.name) course.name = classTitle;
        if (teacher && !course.professor) course.professor = teacher;
        if (typeOfClass && !course.typeOfClass) course.typeOfClass = typeOfClass;
      }

      // Create book entry if we have title or ISBN
      if (title || isbn) {
        const isRequired = /required/i.test(requiredText);
        const dedupeKey = `${courseCode}|${isbn || ''}|${title.toLowerCase()}`;

        if (!seenBooks.has(dedupeKey)) {
          seenBooks.add(dedupeKey);
          books.push({
            courseCode,
            title: title || null,
            author: author || null,
            isbn: isbn || null,
            isRequired,
            notes: notes || null,
            digital: digital || null,
          });
        }
      }
    } catch (err) {
      errors.push({ row: rowNum, reason: err.message || 'Parse error', data: line });
    }
  }

  return {
    courses: Array.from(courses.values()),
    books,
    errors,
    summary: {
      totalRows: lines.length - 1,
      coursesFound: courses.size,
      booksFound: books.length,
      errorsFound: errors.length,
    },
  };
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  values.push(current);
  return values;
}

/**
 * Normalize course code (handle dots, spaces, etc.)
 */
function normalizeCourseCode(code) {
  if (!code) return '';
  return code
    .trim()
    .replace(/\s+/g, ' ') // normalize spaces
    .replace(/\.\s*\./g, '.') // fix double dots
    .replace(/\s*\.\s*/g, '.') // normalize dot spacing
    .toUpperCase();
}

/**
 * Normalize teacher/professor names
 */
function normalizeTeacher(teacher) {
  if (!teacher) return null;
  return teacher
    .trim()
    .replace(/\d+$/, '') // remove trailing numbers
    .replace(/\s+/g, ' ')
    || null;
}

/**
 * Normalize text fields
 */
function normalizeText(text) {
  if (!text) return null;
  const normalized = text.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

/**
 * Normalize ISBN (remove dashes, spaces)
 */
function normalizeISBN(isbn) {
  if (!isbn) return null;
  const cleaned = isbn.trim().replace(/[-\s]/g, '');
  // Validate ISBN format (10 or 13 digits)
  if (/^\d{10,13}$/.test(cleaned)) {
    return cleaned;
  }
  return null;
}

/**
 * Normalize Digital field (fix typos)
 */
function normalizeDigital(digital) {
  if (!digital) return null;
  const normalized = digital.trim().toLowerCase();
  
  // Fix common typos
  if (normalized.includes('avialable')) {
    return 'Not available';
  }
  if (normalized.includes('not available') || normalized === 'not available') {
    return 'Not available';
  }
  if (normalized.startsWith('http')) {
    return digital.trim(); // Keep URL as-is
  }
  if (normalized === 'yes' || normalized === 'y') {
    return 'Yes';
  }
  if (normalized === 'no' || normalized === 'n') {
    return 'No';
  }
  
  return digital.trim() || null;
}

module.exports = { parseCSV, parseCSVLine };
