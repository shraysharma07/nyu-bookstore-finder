// frontend/src/pages/FindBooksPage.js
// Home → Find My Books
// Now: still uses CSV for dropdowns + online URL, but book list comes from backend /api/students/search
// with a fallback to CSV if the backend has no matches.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BookstoreCard from '../components/BookstoreCard';
import { csvData } from '../course_catalogue';
import Api from '../services/api';

// mark imported component as "used" to satisfy eslint (we keep it per your request)
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

const parseTeacherName = (teacherString) => {
  if (!teacherString) return [];
  let cleaned = teacherString.replace(/\d+$/, ''); // strip trailing numbers
  const separators = ['/', '&', ',', ' and ', ' & '];
  let teachers = [cleaned];
  separators.forEach(sep => {
    const next = [];
    teachers.forEach(t => {
      if (t.includes(sep)) next.push(...t.split(sep).map(s => s.trim()));
      else next.push(t);
    });
    teachers = next;
  });
  return [...new Set(teachers.filter(Boolean))];
};

const HomePage = () => {
  const navigate = useNavigate();

  // form + results state
  const [formData, setFormData] = useState({
    name: '',
    dorm: '',
    classType: '',
    teacher: '',
    class: ''
  });
  const [showBooks, setShowBooks] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [courseData, setCourseData] = useState([]);
  const [teacherMapping, setTeacherMapping] = useState(new Map());
  const booksRef = useRef(null);

  // silence "setters not used" for showBooks (we navigate to /results now)
  void setShowBooks;

  useEffect(() => {
    const prev = document.title;
    document.title = 'NYU Madrid Book Finder';
    return () => { document.title = prev; };
  }, []);

  // dorms stay hardcoded (these are the ones students actually recognize)
  const dorms = ['Select Dorm', 'Chamberi', 'Moncloa', 'Malasaña'];

  // curated nearby stores by dorm — leaving exactly as you had it
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

  // stable callback that builds teacherMapping
  const processTeacherNames = useCallback((data) => {
    const mapping = new Map();
    data.forEach(row => {
      const people = parseTeacherName(row.Teacher);
      people.forEach(name => {
        if (!mapping.has(name)) mapping.set(name, []);
        mapping.get(name).push({ ...row, IndividualTeacher: name });
      });
    });
    setTeacherMapping(mapping);
  }, []);

  const parseCSVData = useCallback((csvText) => {
    const lines = (csvText || '').trim().split('\n');
    if (!lines.length) { setCourseData([]); setTeacherMapping(new Map()); return; }

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
      })
      .filter(row => row.Teacher);

    setCourseData(data);
    processTeacherNames(data);
  }, [processTeacherNames]);

  useEffect(() => {
    parseCSVData(csvData);
  }, [parseCSVData]);

  // --- dropdown helpers (unchanged logic) ---
  const getClassTypes = () => {
    const types = [...new Set(courseData.map(r => r['Type of Class']).filter(Boolean))];
    return ['Select Course Type', ...types];
  };

  const getAvailableTeachers = () => {
    if (!formData.classType || formData.classType === 'Select Course Type') return ['Select Teacher'];
    const set = new Set();
    Array.from(teacherMapping.entries()).forEach(([teacherName, courses]) => {
      if (courses.some(c => c['Type of Class'] === formData.classType)) set.add(teacherName);
    });
    return ['Select Teacher', ...Array.from(set).sort()];
  };

  const getAvailableClasses = () => {
    if (!formData.classType || !formData.teacher || formData.teacher === 'Select Teacher') return ['Select Class'];
    if (!teacherMapping.has(formData.teacher)) return ['Select Class'];
    const classes = teacherMapping
      .get(formData.teacher)
      .filter(c => c['Type of Class'] === formData.classType)
      .map(c => c['Class Title'])
      .filter(Boolean);
    return ['Select Class', ...[...new Set(classes)].sort()];
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'classType') { next.teacher = ''; next.class = ''; }
      else if (field === 'teacher') { next.class = ''; }
      return next;
    });
  };

  // rows for the selected class (from CSV)
  const getBooksForClass = () => {
    if (!formData.teacher || !formData.class || !teacherMapping.has(formData.teacher)) return [];
    return teacherMapping
      .get(formData.teacher)
      .filter(c => c['Type of Class'] === formData.classType && c['Class Title'] === formData.class);
  };

  // detect "digital" the same way (for Online card)
  const getDigitalBooks = () => {
    const books = getBooksForClass();
    return books.filter(b =>
      (b['Digital?'] && b['Digital?'].startsWith('http')) ||
      (b['First year/Notes'] && b['First year/Notes'].startsWith('http')) ||
      ((b.Notes || '').toLowerCase().includes('brightspace')) ||
      ((b.Notes || '').toLowerCase().includes('brightspacce'))
    );
  };

  // build an Online link for the class, if any — becomes a fake "store" LAST
  const getOnlineUrlForClass = () => {
    const digital = getDigitalBooks();
    if (!digital.length) return null;
    for (const b of digital) {
      if (b['Digital?'] && b['Digital?'].startsWith('http')) return b['Digital?'];
      if (b['First year/Notes'] && b['First year/Notes'].startsWith('http')) return b['First year/Notes'];
    }
    const hasBrightspaceNote = digital.some(b => (b.Notes || '').toLowerCase().includes('brightspace') || (b.Notes || '').toLowerCase().includes('brightspacce'));
    return hasBrightspaceNote ? 'https://brightspace.nyu.edu' : null;
  };

  const getBookstoresForDorm = () => dormBookstores[formData.dorm] || [];

  // NEW: real search → backend, with fallback to CSV
  const handleFindBooks = async () => {
    if (!formData.name || !formData.dorm || !formData.classType || !formData.teacher || !formData.class) {
      alert('Please fill in all fields');
      return;
    }

    const csvBooks = getBooksForClass();
    if (!csvBooks.length) {
      alert('No books found for this class in the seed catalog yet.');
      return;
    }

    const courseCode = (csvBooks[0]['Course Code'] || '').trim();
    if (!courseCode) {
      alert('No course code found for this class in the seed data.');
      return;
    }

    const dormStores = getBookstoresForDorm();
    const onlineUrl = getOnlineUrlForClass();
    const isLanguage = /(^|\b)language(s)?(\b|$)/i.test((formData.classType || '').trim());

    setIsLoading(true);
    try {
      const payload = {
        course: courseCode,
        professor: formData.teacher || undefined,
        dorm: formData.dorm || undefined,
      };

      const json = await Api.searchBooks(payload);
      console.log('[FindBooks] backend search response:', json);

      let finalBooks = csvBooks;

      if (json && json.success && Array.isArray(json.books) && json.books.length) {
        // map backend books into the shape ResultsPage expects
        finalBooks = json.books.map(b => ({
          Title: b.title || '',
          Author: b.author || '',
          ISBN: b.isbn || '',
          'Course Code': (json.course && json.course.code) || courseCode,
          'Required or Supplemental': b.isRequired ? 'Required' : 'Recommended',
          Notes: ''
        }));
      }

      navigate('/results', {
        state: {
          student: formData,   // { name, dorm, classType, teacher, class }
          books: finalBooks,   // unified shape, from backend or CSV fallback
          dormStores,
          onlineUrl,
          isLanguage
        }
      });
    } catch (err) {
      console.error('[FindBooks] search error:', err);
      alert('Something went wrong while searching. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // these helpers aren’t used on this page anymore for rendering, keep them to avoid future breakage:
  const getPhysicalBooks = () => {
    const books = getBooksForClass();
    return books.filter(b =>
      !(
        (b['Digital?'] && b['Digital?'].startsWith('http')) ||
        (b['First year/Notes'] && b['First year/Notes'].startsWith('http')) ||
        ((b.Notes || '').toLowerCase().includes('brightspace')) ||
        ((b.Notes || '').toLowerCase().includes('brightspacce'))
      ) &&
      b.Title && b.Title.trim() !== ''
    );
  };

  const hasNoBooks = () => {
    const books = getBooksForClass();
    if (!books.length) return true;
    return books.every(b => (!b.Title || !b.Title.trim()) && (!b.Author || !b.Author.trim()));
  };

  void getPhysicalBooks;
  void hasNoBooks;
  void getBookstoresForDorm;

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
            <div className="grid grid-2" style={{ marginBottom: '1.25rem' }}>
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
            </div>

            {/* row 2 */}
            <div className="grid grid-3" style={{ marginBottom: '1.25rem' }}>
              <div>
                <label className="label" htmlFor="ctype">Course Type</label>
                <select
                  id="ctype"
                  className="select"
                  value={formData.classType}
                  onChange={(e) => handleInputChange('classType', e.target.value)}
                >
                  {getClassTypes().map(type => (
                    <option key={type} value={type === 'Select Course Type' ? '' : type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label" htmlFor="teacher">Professor</label>
                <select
                  id="teacher"
                  className="select"
                  value={formData.teacher}
                  onChange={(e) => handleInputChange('teacher', e.target.value)}
                  disabled={!formData.classType}
                >
                  {getAvailableTeachers().map(teacher => (
                    <option key={teacher} value={teacher === 'Select Teacher' ? '' : teacher}>
                      {teacher}
                    </option>
                  ))}
                </select>
                {!formData.classType && <div className="help">Pick a course type first</div>}
              </div>

              <div>
                <label className="label" htmlFor="class">Class</label>
                <select
                  id="class"
                  className="select"
                  value={formData.class}
                  onChange={(e) => handleInputChange('class', e.target.value)}
                  disabled={!formData.teacher}
                >
                  {getAvailableClasses().map(cls => (
                    <option key={cls} value={cls === 'Select Class' ? '' : cls}>
                      {cls}
                    </option>
                  ))}
                </select>
                {!formData.teacher && <div className="help">Pick a professor first</div>}
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
