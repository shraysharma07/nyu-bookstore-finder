// backend/utils/csvParser.js
// Robust CSV parser for course catalog with validation and normalization
// Handles Excel-style CSV with commas, quotes, BOMs, and uneven columns

/**
 * Normalize header name (handle variations, trim whitespace, handle BOM)
 */
function normalizeHeaderName(header) {
  if (!header) return '';
  
  // Remove BOM if present
  let h = header.replace(/^\uFEFF/, '');
  
  // Trim whitespace
  h = h.trim();
  
  // Normalize to lowercase, remove spaces/punctuation for matching
  const normalized = h.toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9\s]/g, '');
  
  // Map common variations (case-insensitive, handles whitespace)
  const headerMap = {
    'course code': 'Course Code',
    'coursecode': 'Course Code',
    'class title': 'Class Title',
    'classtitle': 'Class Title',
    'teacher': 'Teacher',
    'professor': 'Teacher',
    'author': 'Author',
    'title': 'Title',
    'book title': 'Title',
    'isbn': 'ISBN',
    'required or supplemental': 'Required or Supplemental',
    'required': 'Required or Supplemental',
    'notes': 'Notes',
    'type of class': 'Type of Class',
    'digital': 'Digital?',
    'digital?': 'Digital?',
    'first year': 'First year/Notes',
    'first year/notes': 'First year/Notes',
  };
  
  // Try exact match first
  if (headerMap[normalized]) {
    return headerMap[normalized];
  }
  
  // Try partial matches
  for (const [key, value] of Object.entries(headerMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  
  // Return original (trimmed) if no match
  return h;
}

/**
 * Parse CSV content into structured catalog data
 * @param {string} csvContent - Raw CSV content
 * @returns {Object} { courses, books, errors, summary }
 */
function parseCSV(csvContent) {
  // Remove BOM if present
  let cleanContent = csvContent.replace(/^\uFEFF/, '');
  
  // Normalize line endings
  cleanContent = cleanContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  const lines = cleanContent
    .split('\n')
    .map((line, idx) => ({ line: line.trim(), rowNum: idx + 1 }))
    .filter(({ line }) => line.length > 0);

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse header with improved handling
  const headerLine = lines[0].line;
  const rawHeaders = parseCSVLine(headerLine).map(h => h.trim().replace(/^\uFEFF/, ''));
  
  // Normalize headers (trim, handle BOM, normalize variations)
  const headers = rawHeaders.map(normalizeHeaderName);
  
  const expectedHeaders = [
    'Teacher', 'Course Code', 'Class Title', 'Author', 'Title', 
    'ISBN', 'Required or Supplemental', 'Notes', 'Type of Class', 
    'Digital?', 'First year/Notes'
  ];

  // Build header map (normalized names)
  const headerMap = {};
  headers.forEach((h, idx) => {
    const normalized = h.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    expectedHeaders.forEach(expected => {
      const expectedNorm = expected.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
      if (normalized === expectedNorm || normalized.includes(expectedNorm) || expectedNorm.includes(normalized)) {
        headerMap[expected] = idx;
      }
    });
  });

  // Ensure we have at least Course Code (try multiple variations)
  if (headerMap['Course Code'] === undefined) {
    // Try to find it by searching raw headers
    const courseCodeIdx = rawHeaders.findIndex(h => {
      const norm = h.toLowerCase().trim().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
      return /coursecode/i.test(norm) || norm.includes('coursecode');
    });
    if (courseCodeIdx >= 0) {
      headerMap['Course Code'] = courseCodeIdx;
      headers[courseCodeIdx] = 'Course Code';
    } else {
      throw new Error(`CSV missing required "Course Code" column. Found headers: ${rawHeaders.slice(0, 5).join(', ')}...`);
    }
  }

  const courses = new Map(); // courseCode -> course data
  const books = [];
  const errors = [];
  const seenBooks = new Set(); // for deduplication: courseCode|isbn|title

  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    const { line, rowNum } = lines[i];
    
    try {
      // Parse line with fallback for messy CSV
      let values = parseCSVLine(line);
      
      // Fallback: if too many columns, rebuild row
      if (values.length > 10) {
        values = rebuildMessyRow(values, rawHeaders.length);
      }
      
      // Pad or truncate to match header count
      while (values.length < headers.length) {
        values.push('');
      }
      values = values.slice(0, headers.length);

      const row = {};
      headers.forEach((h, idx) => {
        row[h] = (values[idx] || '').trim();
      });

      // Extract fields using header map with validation and logging
      const teacher = normalizeTeacher(row[headers[headerMap['Teacher']] || '']);
      let courseCode = normalizeCourseCode(row[headers[headerMap['Course Code']] || '']);
      const classTitle = normalizeText(row[headers[headerMap['Class Title']] || '']);
      const author = normalizeText(row[headers[headerMap['Author']] || '']);
      const title = normalizeText(row[headers[headerMap['Title']] || '']);
      const isbn = normalizeISBN(row[headers[headerMap['ISBN']] || '']);
      const requiredText = normalizeText(row[headers[headerMap['Required or Supplemental']] || '']);
      let notes = normalizeText(row[headers[headerMap['Notes']] || '']);
      const typeOfClass = normalizeText(row[headers[headerMap['Type of Class']] || '']);
      const digital = normalizeDigital(row[headers[headerMap['Digital?']] || '']);
      const firstYear = normalizeText(row[headers[headerMap['First year/Notes']] || '']);
      
      // Merge notes if split across columns
      if (firstYear && !notes) {
        notes = firstYear;
      }

      // Skip rows without course code (log exact field that failed)
      if (!courseCode) {
        const courseCodeField = rawHeaders[headerMap['Course Code']] || 'Course Code';
        const rawValue = values[headerMap['Course Code']] || '';
        errors.push({ 
          row: rowNum, 
          reason: `Missing Course Code (column: "${courseCodeField}", value: "${rawValue.substring(0, 50)}")`, 
          data: { values: values.slice(0, 3) } 
        });
        continue;
      }

      // Create/update course entry
      if (!courses.has(courseCode)) {
        courses.set(courseCode, {
          code: courseCode,
          name: classTitle || courseCode,
          professor: teacher || null,
          typeOfClass: typeOfClass || null,
          semester: null,
          year: null,
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
      // Log exact row/field that failed
      errors.push({ 
        row: rowNum, 
        reason: `Parse error: ${err.message}`, 
        data: line.substring(0, 100),
        error: err.message 
      });
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
 * Rebuild messy row with too many columns
 * Strategy: Keep first 6, merge middle, keep last 3
 */
function rebuildMessyRow(values, expectedColCount) {
  if (values.length <= expectedColCount) {
    return values;
  }
  
  // Keep first 6 columns (typically: Teacher, Course Code, Class Title, Author, Title, ISBN)
  const first = values.slice(0, 6);
  
  // Keep last 3 columns (typically: Type of Class, Digital, First year/Notes)
  const last = values.slice(-3);
  
  // Merge middle columns into Notes
  const middle = values.slice(6, -3);
  const mergedNotes = middle.filter(v => v && v.trim()).join('; ');
  
  // Combine: first 6, merged notes, last 3
  const rebuilt = [...first, mergedNotes, ...last];
  
  // Pad or truncate to expected length
  while (rebuilt.length < expectedColCount) {
    rebuilt.push('');
  }
  
  return rebuilt.slice(0, expectedColCount);
}

/**
 * Parse a single CSV line handling quoted fields, escaped quotes, and commas inside fields
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const ch = line[i];
    
    if (ch === '"') {
      if (inQuotes) {
        // Check for escaped quote (two quotes)
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
          continue;
        }
        // Check if next char is comma or end of line
        if (i + 1 >= line.length || line[i + 1] === ',') {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        // Start of quoted field
        inQuotes = true;
        i++;
        continue;
      }
    }
    
    if (ch === ',' && !inQuotes) {
      values.push(current);
      current = '';
      i++;
      continue;
    }
    
    current += ch;
    i++;
  }
  
  // Push last value
  values.push(current);
  
  return values;
}

/**
 * Normalize course code (handle dots, spaces, etc.) - sanitize for DB
 */
function normalizeCourseCode(code) {
  if (!code) return '';
  return code
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\.\s*\./g, '.')
    .replace(/\s*\.\s*/g, '.')
    .toUpperCase();
}

/**
 * Normalize teacher/professor names
 */
function normalizeTeacher(teacher) {
  if (!teacher) return null;
  const normalized = teacher
    .trim()
    .replace(/\d+$/, '')
    .replace(/\s+/g, ' ');
  return normalized || null;
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
  
  if (normalized.includes('avialable')) {
    return 'Not available';
  }
  if (normalized.includes('not available') || normalized === 'not available') {
    return 'Not available';
  }
  if (normalized.startsWith('http')) {
    return digital.trim();
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
