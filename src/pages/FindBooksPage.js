// frontend/src/pages/HomePage.js
// Simplified version - search by class name only

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BookstoreCard from '../components/BookstoreCard';
import { csvData } from '../course_catalogue';

void BookstoreCard;

// ---- stable helpers (outside component) ----
const parseCSVLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === ',' && !inQuotes) { values.push(current); current = ''; }
    else current += ch;
  }
  values.push(current);
  return values;
};

const HomePage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    dorm: '',
    class: ''
  });
  const [showBooks, setShowBooks] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [courseData, setCourseData] = useState([]);
  const booksRef = useRef(null);

  void setShowBooks;
  void setIsLoading;

  useEffect(() => {
    const prev = document.title;
    document.title = 'NYU Madrid Book Finder';
    return () => { document.title = prev; };
  }, []);

  const dorms = ['Select Dorm', 'Chamberi', 'Moncloa', 'Malasaña'];

  const dormBookstores = {
    Chamberi: [
      { name: 'Secret Kingdoms', address: 'Calle de Moratin, 7', distance: '29 min metro', phone: '+34 633 24 30 57', availability: 'In Stock' },
      { name: 'Parentisis', address: 'Calle de Valencia, 30, Centro', distance: '23 min metro', phone: '+34 626 70 92 62', availability: 'In Stock' },
      { name: 'Desperate Literature', address: 'Calle de la Cava Baja, 8', distance: '27 min metro', phone: '+34 911 88 80 89', availability: 'In Stock' },
      { name: 'Booksellers.es', address: 'Calle de Fernández de la Hoz, 40, 28010 Madrid', distance: '10 min metro / walking', phone: '+34 914 427 959', availability: 'In Stock' }
    ],
    Moncloa: [
      { name: 'Secret Kingdoms', address: 'Calle de Moratin, 7', distance: '22 min metro', phone: '+34 633 24 30 57', availability: 'In Stock' },
      { name: 'Parentisis', address: 'Calle de Valencia, 30, Centro', distance: '17 min metro', phone: '+34 626 70 92 62', availability: 'In Stock' },
      { name: 'Desperate Literature', address: 'Calle de la Cava Baja, 8', distance: '20 min metro', phone: '+34 911 88 80 89', availability: 'In Stock' },
      { name: 'Booksellers.es', address: 'Calle de Fernández de la Hoz, 40, 28010 Madrid', distance: '20 min metro / walking', phone: '+34 914 427 959', availability: 'In Stock' }
    ],
    Malasaña: [
      { name: 'Secret Kingdoms', address: 'Calle de Moratin, 7', distance: '23 min metro', phone: '+34 633 24 30 57', availability: 'In Stock' },
      { name: 'Parentisis', address: 'Calle de Valencia, 30, Centro', distance: '19 min metro', phone: '+34 626 70 92 62', availability: 'In Stock' },
      { name: 'Desperate Literature', address: 'Calle de la Cava Baja, 8', distance: '19 min metro', phone: '+34 911 88 80 89', availability: 'In Stock' },
      { name: 'Booksellers.es', address: 'Calle de Fernández de la Hoz, 40, 28010 Madrid', distance: '15 min metro / walking', phone: '+34 914 427 959', availability: 'In Stock' }
    ]
  };

  const parseCSVData = useCallback((csvText) => {
    const lines = (csvText || '').trim().split('\n');
    if (!lines.length) { setCourseData([]); return; }

    const headers = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const vals = parseCSVLine(line);
        const row = {};
        headers.forEach((header, i) => {
          row[header] = vals[i] ? vals[i].trim().replace(/"/g, '') : '';
        });
        return row;
      });

    setCourseData(data);
  }, []);

  useEffect(() => {
    parseCSVData(csvData);
  }, [parseCSVData]);

  // Get all unique class names for the dropdown
  const getAvailableClasses = () => {
    const classes = [...new Set(courseData
      .map(r => r['Class Title'])
      .filter(Boolean)
    )].sort();
    return ['Select Class', ...classes];
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Get all books for the selected class (search by class title only)
  const getBooksForClass = () => {
    if (!formData.class) {
      console.log('No class selected');
      return [];
    }
    
    console.log('=== SEARCHING FOR BOOKS ===');
    console.log('Looking for class:', formData.class);
    
    // Find all rows that match this class title
    const courseRows = courseData.filter(row => 
      row['Class Title'] === formData.class
    );
    
    console.log('Courses matching class title:', courseRows.length);
    
    if (courseRows.length > 0) {
      console.log('Sample course row:', courseRows[0]);
    }
    
    // Each row represents ONE book
    const allBooks = [];
    
    courseRows.forEach((row, index) => {
      console.log(`\nProcessing row ${index + 1}:`, {
        title: row.Title,
        author: row.Author,
        requiredOrSupplemental: row['Required or Supplemental'],
        hasTitle: !!row.Title
      });
      
      // Only process rows that have a book title
      if (!row.Title || !row.Title.trim()) {
        console.log(`  ❌ Row ${index + 1} skipped - no title`);
        return;
      }
      
      const requiredOrSupplemental = (row['Required or Supplemental'] || '').trim();
      const isRequired = requiredOrSupplemental.toLowerCase().includes('required');
      const isSupplemental = requiredOrSupplemental.toLowerCase().includes('supplemental') || 
                            requiredOrSupplemental.toLowerCase().includes('recommended');
      
      const book = {
        title: row.Title.trim(),
        author: row.Author || '',
        isbn: row.ISBN || '',
        required: requiredOrSupplemental,
        is_required: isRequired,
        is_supplemental: isSupplemental,
        digital: row['Digital?'] || row.Digital || '',
        notes: row.Notes || '',
        firstYearNotes: row['First Year'] || '',
        courseCode: row['Course Code'] || '',
        bookType: isSupplemental ? 'supplemental' : (isRequired ? 'required' : 'other'),
        ...row
      };
      
      console.log(`  ✅ Added book:`, book.title, `(${book.bookType})`);
      allBooks.push(book);
    });
    
    console.log('\n=== BOOK EXTRACTION SUMMARY ===');
    console.log('Total books found:', allBooks.length);
    console.log('Required books:', allBooks.filter(b => b.is_required).length);
    console.log('Supplemental books:', allBooks.filter(b => b.is_supplemental).length);
    console.log('All book titles:');
    allBooks.forEach((b, i) => {
      console.log(`  ${i + 1}. ${b.title} - ${b.bookType}`);
    });
    console.log('==============================\n');
    
    return allBooks;
  };

  const handleFindBooks = async () => {
    if (!formData.name || !formData.dorm || !formData.class) {
      alert('Please fill in all fields');
      return;
    }
    
    const books = getBooksForClass();
    console.log('Total books found:', books.length);
    
    const dormStores = dormBookstores[formData.dorm] || [];
    const onlineUrl = getOnlineUrlForClass();
    
    // Determine if it's a language class from the Type of Class field
    const classTypeFromData = courseData.find(r => r['Class Title'] === formData.class)?.['Type of Class'] || '';
    const isLanguage = /(^|\b)language(s)?(\b|$)/i.test(classTypeFromData.trim());

    navigate('/results', {
      state: {
        student: formData,
        books,
        dormStores,
        onlineUrl,
        isLanguage
      }
    });
  };

  // Improved digital book detection
  const getDigitalBooks = () => {
    const books = getBooksForClass();
    return books.filter(b => {
      const digitalField = (b['Digital?'] || b.digital || b.Digital || '').trim();
      const notesField = (b.Notes || b.notes || b['First Year'] || '').trim().toLowerCase();
      
      return (
        digitalField.startsWith('http') ||
        notesField.includes('brightspace') ||
        notesField.includes('online') ||
        notesField.includes('digital')
      );
    });
  };

  const getPhysicalBooks = () => {
    const books = getBooksForClass();
    const digital = getDigitalBooks();
    const digitalTitles = new Set(digital.map(b => b.title));
    
    return books.filter(b => 
      !digitalTitles.has(b.title) && 
      b.title && 
      b.title.trim() !== ''
    );
  };

  const hasNoBooks = () => {
    const books = getBooksForClass();
    if (!books.length) return true;
    return books.every(b => (!b.title || !b.title.trim()) && (!b.author || !b.author.trim()));
  };

  const getBookstoresForDorm = () => dormBookstores[formData.dorm] || [];

  void getPhysicalBooks;
  void hasNoBooks;
  void getBookstoresForDorm;

  const getOnlineUrlForClass = () => {
    const digital = getDigitalBooks();
    if (!digital.length) return null;
    
    for (const b of digital) {
      const digitalField = b['Digital?'] || b.digital || b.Digital || '';
      const notesField = b.Notes || b.notes || b['First Year'] || '';
      
      if (digitalField.startsWith('http')) return digitalField;
      if (notesField.startsWith('http')) return notesField;
    }
    
    const hasBrightspaceNote = digital.some(b => {
      const notes = (b.Notes || b.notes || '').toLowerCase();
      return notes.includes('brightspace');
    });
    
    return hasBrightspaceNote ? 'https://brightspace.nyu.edu' : null;
  };

  // -------------- UI ----------------
  return (
    <div>
      {/* Hero */}
      <header style={{ 
        background: 'linear-gradient(135deg, #4c1d95, #7c3aed, #8b5cf6)', 
        color: 'white', padding: '2.5rem 0', position: 'relative', overflow: 'hidden'
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h1>NYU Madrid Book Finder</h1>
          <div className="badge badge-info" style={{ marginTop: 8 }}>
            For NYU Madrid Students
          </div>
        </div>
      </header>

      {/* Form */}
      <section className="section" style={{ background:'#fff', boxShadow:'var(--shadow-sm)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2>Find Your Course Books</h2>
            <p>Enter your details to see required books and nearby bookstores.</p>
          </div>

          <div className="card">
            {/* row 1 */}
            <div className="grid grid-3" style={{ marginBottom: '1.25rem' }}>
              <div>
                <label className="label" htmlFor="name">Your Name</label>
                <input
                  id="name"
                  className="input"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="label" htmlFor="dorm">Residence Hall</label>
                <select
                  id="dorm"
                  className="select"
                  value={formData.dorm}
                  onChange={(e) => handleInputChange('dorm', e.target.value)}
                >
                  {dorms.map(dorm => (
                    <option key={dorm} value={dorm === 'Select Dorm' ? '' : dorm}>
                      {dorm}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label" htmlFor="class">Class Name</label>
                <select
                  id="class"
                  className="select"
                  value={formData.class}
                  onChange={(e) => handleInputChange('class', e.target.value)}
                >
                  {getAvailableClasses().map(cls => (
                    <option key={cls} value={cls === 'Select Class' ? '' : cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleFindBooks}
              disabled={isLoading}
              style={{ width:'100%' }}
            >
              {isLoading ? 'Finding Books…' : 'Find My Books'}
            </button>
          </div>
        </div>
      </section>

      {/* Loading */}
      {isLoading && (
        <section className="section">
          <div className="container" style={{ textAlign:'center' }}>
            <div className="skeleton" style={{ width:260, height:18, margin:'0 auto 1rem' }} />
            <div className="skeleton" style={{ width:420, height:18, margin:'0 auto 2rem' }} />
            <div className="skeleton" style={{ width:60, height:60, borderRadius:'50%', margin:'0 auto' }} />
          </div>
        </section>
      )}

      {/* Results (kept untouched; no longer used since we navigate) */}
      {showBooks && !isLoading && (
        <section ref={booksRef} className="section">
          <div className="container">
            {/* ...leaving your original inline results intact, but navigation will be used instead */}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{ background:'#1f2937', color:'#fff', textAlign:'center', padding:'2.5rem 0', marginTop:'2rem' }}>
        <div className="container" style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:'2rem', flexWrap:'wrap' }}>
          <p style={{ margin:0 }}>2025 NYU Madrid Local Bookstore Finder</p>
          <div className="badge" style={{ background:'#10b981', color:'#062e23' }}>
            Supporting Local Madrid Businesses
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;