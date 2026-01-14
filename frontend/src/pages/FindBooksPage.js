// frontend/src/pages/FindBooksPage.js
// Home → Find My Books
// Simplified UI: Dorm, Course Type, Course (no name/professor fields)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { csvData } from '../course_catalogue';
import Api from '../services/api';

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

  // Simplified form state: only dorm, courseType, course
  const [formData, setFormData] = useState({
    dorm: '',
    courseType: '',
    course: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [courseData, setCourseData] = useState([]);

  useEffect(() => {
    const prev = document.title;
    document.title = 'NYU Madrid Book Finder';
    return () => { document.title = prev; };
  }, []);

  // dorms stay hardcoded
  const dorms = ['Select Dorm', 'Chamberi', 'Moncloa', 'Malasaña'];

  // curated nearby stores by dorm
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

  // Parse CSV data on mount
  useEffect(() => {
    const lines = (csvData || '').trim().split('\n');
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
      })
      .filter(row => row['Course Code'] && row['Course Code'].trim()); // Only rows with course codes

    setCourseData(data);
  }, []);

  // Get unique course types from CSV
  const getCourseTypes = () => {
    const types = [...new Set(courseData.map(r => r['Type of Class']).filter(Boolean))];
    return ['Select Course Type', ...types.sort()];
  };

  // Get courses filtered by courseType
  const getCourses = () => {
    if (!formData.courseType || formData.courseType === 'Select Course Type') {
      return ['Select Course'];
    }
    const courses = courseData
      .filter(row => row['Type of Class'] === formData.courseType && row['Course Code'])
      .map(row => ({
        code: row['Course Code'].trim(),
        title: row['Class Title'] || row['Course Code']
      }));
    
    // Deduplicate by course code
    const uniqueCourses = [];
    const seenCodes = new Set();
    courses.forEach(c => {
      if (!seenCodes.has(c.code)) {
        seenCodes.add(c.code);
        uniqueCourses.push(c);
      }
    });
    
    return ['Select Course', ...uniqueCourses.sort((a, b) => a.code.localeCompare(b.code))];
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      // Reset dependent fields
      if (field === 'courseType') {
        next.course = '';
      }
      return next;
    });
  };

  const getBookstoresForDorm = () => dormBookstores[formData.dorm] || [];

  const handleFindBooks = async () => {
    // Validation
    if (!formData.dorm || !formData.courseType || !formData.course) {
      setError('Please fill in all fields: Dorm, Course Type, and Course');
      return;
    }

    if (formData.dorm === 'Select Dorm' || formData.courseType === 'Select Course Type' || formData.course === 'Select Course') {
      setError('Please select valid values for all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Send payload: { dorm, course, courseType }
      const payload = {
        dorm: formData.dorm,
        course: formData.course,
        courseType: formData.courseType
      };

      console.log('[FindBooks] Calling API with payload:', payload);
      if (process.env.NODE_ENV === 'development') {
        console.log('[FindBooks] API base URL:', process.env.REACT_APP_API_URL || 'not set (using default)');
      }
      
      const json = await Api.searchBooks(payload);
      console.log('[FindBooks] backend search response:', json);

      let finalBooks = [];

      // Handle response: use requiredBooks (fallback to books for backwards compatibility)
      const booksFromApi = json.requiredBooks || json.books || [];
      
      if (json && (json.ok || json.success) && Array.isArray(booksFromApi) && booksFromApi.length > 0) {
        // Map backend books into the shape ResultsPage expects
        finalBooks = booksFromApi.map(b => ({
          Title: b.title || '',
          Author: b.author || '',
          ISBN: b.isbn || '',
          'Course Code': json.meta?.matchedCourseCode || formData.course,
          'Required or Supplemental': b.is_required ? 'Required' : 'Recommended',
          Notes: ''
        }));
      } else if (json && (json.ok || json.success) && Array.isArray(json.optionalBooks) && json.optionalBooks.length > 0) {
        // If no required books, but optional books exist, use them
        finalBooks = json.optionalBooks.map(b => ({
          Title: b.title || '',
          Author: b.author || '',
          ISBN: b.isbn || '',
          'Course Code': json.meta?.matchedCourseCode || formData.course,
          'Required or Supplemental': b.is_required ? 'Required' : 'Recommended',
          Notes: ''
        }));
      } else {
        // No books found
        setError('No books found for this course in the catalog.');
        return;
      }

      const dormStores = getBookstoresForDorm();
      const isLanguage = /(^|\b)language(s)?(\b|$)/i.test((formData.courseType || '').trim());

      navigate('/results', {
        state: {
          student: { dorm: formData.dorm, courseType: formData.courseType, course: formData.course },
          books: finalBooks,
          dormStores,
          onlineUrl: null, // No longer using CSV-based online URL
          isLanguage
        }
      });
    } catch (err) {
      console.error('[FindBooks] search error:', err);
      console.error('[FindBooks] Error details:', {
        message: err.message,
        status: err.status,
        isTimeout: err.isTimeout,
        isNetworkError: err.isNetworkError,
        data: err.data
      });
      
      // Set user-friendly error message
      let errorMessage = 'Something went wrong while searching. Please try again.';
      
      if (err.status === 400) {
        errorMessage = err.data?.message || 'Invalid search parameters. Please check your input.';
      } else if (err.status === 404) {
        errorMessage = err.data?.message || 'Course not found in the catalog. Please check the course code.';
      } else if (err.status === 503) {
        errorMessage = err.data?.message || 'Catalog data is not available. Please try again later.';
        if (err.data?.message && err.data.message.includes('not been seeded')) {
          errorMessage = 'Catalog data is not available. The database has not been seeded with course data.';
        }
      } else if (err.status === 504) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (err.isTimeout || err.message?.includes('timeout')) {
        errorMessage = 'Request timed out after 15 seconds. Please try again.';
      } else if (err.isNetworkError || err.message?.includes('fetch') || err.message?.includes('Network')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const courses = getCourses();

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
            {/* Form fields */}
            <div className="grid grid-3" style={{ marginBottom: '1.25rem' }}>
              <div>
                <label className="label" htmlFor="dorm">Residence Hall</label>
                <select
                  id="dorm"
                  className="select"
                  value={formData.dorm}
                  onChange={(e) => handleInputChange('dorm', e.target.value)}
                  disabled={isLoading}
                >
                  {dorms.map(dorm => (
                    <option key={dorm} value={dorm === 'Select Dorm' ? '' : dorm}>
                      {dorm}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label" htmlFor="courseType">Course Type</label>
                <select
                  id="courseType"
                  className="select"
                  value={formData.courseType}
                  onChange={(e) => handleInputChange('courseType', e.target.value)}
                  disabled={isLoading}
                >
                  {getCourseTypes().map(type => (
                    <option key={type} value={type === 'Select Course Type' ? '' : type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label" htmlFor="course">Course</label>
                <select
                  id="course"
                  className="select"
                  value={formData.course}
                  onChange={(e) => handleInputChange('course', e.target.value)}
                  disabled={!formData.courseType || isLoading}
                >
                  {courses.map(course => {
                    const isSelectOption = typeof course === 'string' && course === 'Select Course';
                    const optionValue = isSelectOption ? '' : (typeof course === 'string' ? course : course.code);
                    const optionLabel = isSelectOption ? course : (typeof course === 'string' ? course : `${course.code} - ${course.title}`);
                    return (
                      <option key={optionValue || 'select'} value={optionValue}>
                        {optionLabel}
                      </option>
                    );
                  })}
                </select>
                {!formData.courseType && <div className="help">Pick a course type first</div>}
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleFindBooks}
              disabled={isLoading || !formData.dorm || !formData.courseType || !formData.course}
              style={{ width:'100%' }}
            >
              {isLoading ? 'Finding Books…' : 'Find My Books'}
            </button>
            
            {/* Error Display */}
            {error && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                color: '#991b1b'
              }}>
                <strong>Error:</strong> {error}
                <button
                  onClick={() => setError(null)}
                  style={{
                    marginLeft: '1rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Dismiss
                </button>
              </div>
            )}
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
