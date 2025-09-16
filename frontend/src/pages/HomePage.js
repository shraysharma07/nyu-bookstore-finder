import React, { useState, useRef, useEffect } from 'react';
import BookstoreCard from '../components/BookstoreCard';
import { csvData } from '../course_catalogue'; // Import your CSV data

const Homepage = () => {
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

  // Dorms data
  const dorms = [
    'Select Dorm',
    'Chamberi',
    'Moncloa',
    'Malasaña'
  ];

  // Bookstores mapped to dorms
  const dormBookstores = {
    'Chamberi': [
      {
        name: 'Secret Kingdoms',
        address: 'Calle de Moratin, 7',
        distance: '29 min metro',
        phone: '+34 633 24 30 57',
        availability: 'In Stock'
      },
      {
        name: 'Parentisis',
        address: 'Calle de Valencia, 30, Centro',
        distance: '23 min metro', 
        phone: '+34 626 70 92 62',
        availability: 'In Stock'
      },
      {
        name: 'Desperate Literature',
        address: 'Calle de la Cava Baja, 8',
        distance: '27 min metro', 
        phone: '+34 626 70 92 62',
        availability: 'In Stock'
      }

    ],
    'Moncloa': [
      {
        name: 'Secret Kingdoms',
        address: 'Calle de Moratin, 7',
        distance: '22 min metro',
        phone: '+34 633 24 30 57',
        availability: 'In Stock'
      },
      {
        name: 'Parentisis',
        address: 'Calle de Valencia, 30, Centro',
        distance: '17 min metro', 
        phone: '+34 626 70 92 62',
        availability: 'In Stock'
      },
      {
        name: 'Desperate Literature',
        address: 'Calle de la Cava Baja, 8',
        distance: '20 min metro', 
        phone: '+34 911 88 80 89',
        availability: 'In Stock'
      }
    ],
    'Malasaña': [
      {
        name: 'Secret Kingdoms',
        address: 'Calle de Moratin, 7',
        distance: '23 min metro',
        phone: '+34 633 24 30 57',
        availability: 'In Stock'
      },
      {
        name: 'Parentisis',
        address: 'Calle de Valencia, 30, Centro',
        distance: '19 min metro', 
        phone: '+34 626 70 92 62',
        availability: 'In Stock'
      },
      {
        name: 'Desperate Literature',
        address: 'Calle de la Cava Baja, 8',
        distance: '19 min metro', 
        phone: '+34 911 88 80 89',
        availability: 'In Stock'
      }
    ]
  };

  // Load and parse CSV data on component mount
  useEffect(() => {
    // Parse the imported CSV data directly
    parseCSVData(csvData);
  }, []);

  // CSV parsing functions
  const parseCSVLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    return values;
  };

  const parseCSVData = (csvText) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const data = lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = parseCSVLine(line);
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] ? values[index].trim().replace(/"/g, '') : '';
        });
        return row;
      })
      .filter(row => row.Teacher); // Only filter by teacher, not by title (to include classes with no books)
      
    setCourseData(data);
    processTeacherNames(data);
  };

  const parseTeacherName = (teacherString) => {
    if (!teacherString) return [];
    
    // Remove numbers at the end (like "1", "2", etc.)
    let cleaned = teacherString.replace(/\d+$/, '');
    
    // Split by various separators
    const separators = ['/', '&', ',', ' and ', ' & '];
    let teachers = [cleaned];
    
    separators.forEach(separator => {
      const newTeachers = [];
      teachers.forEach(teacher => {
        if (teacher.includes(separator)) {
          newTeachers.push(...teacher.split(separator).map(t => t.trim()));
        } else {
          newTeachers.push(teacher);
        }
      });
      teachers = newTeachers;
    });
    
    // Filter out empty strings and return unique names
    return [...new Set(teachers.filter(name => name.trim().length > 0))];
  };

  const processTeacherNames = (data) => {
    const mapping = new Map();
    
    data.forEach(row => {
      const originalTeacher = row.Teacher;
      const individualTeachers = parseTeacherName(originalTeacher);
      
      individualTeachers.forEach(teacherName => {
        if (!mapping.has(teacherName)) {
          mapping.set(teacherName, []);
        }
        // Store the original row with the individual teacher name
        const newRow = { ...row, IndividualTeacher: teacherName };
        mapping.get(teacherName).push(newRow);
      });
    });
    
    setTeacherMapping(mapping);
  };

  // Get available class types
  const getClassTypes = () => {
    const types = [...new Set(courseData.map(row => row['Type of Class']).filter(Boolean))];
    return ['Select Course Type', ...types];
  };

  // Get available teachers based on selected class type
  const getAvailableTeachers = () => {
    if (!formData.classType || formData.classType === 'Select Course Type') {
      return ['Select Teacher'];
    }
    
    const teachersForType = new Set();
    Array.from(teacherMapping.entries()).forEach(([teacherName, courses]) => {
      const hasTypeMatch = courses.some(course => course['Type of Class'] === formData.classType);
      if (hasTypeMatch) {
        teachersForType.add(teacherName);
      }
    });
    
    const sortedTeachers = Array.from(teachersForType).sort();
    return ['Select Teacher', ...sortedTeachers];
  };

  // Get available classes based on selected class type and teacher
  const getAvailableClasses = () => {
    if (!formData.classType || !formData.teacher || formData.teacher === 'Select Teacher') {
      return ['Select Class'];
    }
    
    if (teacherMapping.has(formData.teacher)) {
      const teacherCourses = teacherMapping.get(formData.teacher);
      const classesForTeacher = teacherCourses
        .filter(course => course['Type of Class'] === formData.classType)
        .map(course => course['Class Title'])
        .filter(Boolean);
      
      const uniqueClasses = [...new Set(classesForTeacher)].sort();
      return ['Select Class', ...uniqueClasses];
    }
    
    return ['Select Class'];
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Reset dependent fields when parent fields change
      if (field === 'classType') {
        newData.teacher = '';
        newData.class = '';
      } else if (field === 'teacher') {
        newData.class = '';
      }
      
      return newData;
    });
  };

  const handleFindBooks = async () => {
    if (!formData.name || !formData.dorm || !formData.classType || !formData.teacher || !formData.class) {
      alert('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setShowBooks(true);
      
      // Scroll to books section
      setTimeout(() => {
        booksRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, 1500);
  };

  const getBooksForClass = () => {
    if (!formData.teacher || !formData.class || !teacherMapping.has(formData.teacher)) {
      return [];
    }
    
    const filteredBooks = teacherMapping.get(formData.teacher).filter(course =>
      course['Type of Class'] === formData.classType &&
      course['Class Title'] === formData.class
    );
    
    return filteredBooks;
  };

  const getDigitalBooks = () => {
    const books = getBooksForClass();
    return books.filter(book => 
      // Check if it's digital based on multiple criteria
      (book['Digital?'] && book['Digital?'].startsWith('http')) || // Has a URL in Digital column
      (book.Notes && book.Notes.toLowerCase().includes('brightspace')) ||
      (book.Notes && book.Notes.toLowerCase().includes('brightspacce')) ||// Notes mention Brightspace
      (book['First year/Notes'] && book['First year/Notes'].startsWith('http')) // URL in last column
    );
  };

  const getPhysicalBooks = () => {
    const books = getBooksForClass();
    return books.filter(book => 
      // Physical books are those that are NOT digital
      !(
        (book['Digital?'] && book['Digital?'].startsWith('http')) || 
        (book.Notes && book.Notes.toLowerCase().includes('brightspace')) ||
        (book.Notes && book.Notes.toLowerCase().includes('brightspacce')) ||
        (book['First year/Notes'] && book['First year/Notes'].startsWith('http'))
      ) &&
      // AND have actual book information (not empty rows)
      book.Title && book.Title.trim() !== ''
    );
  };

  const hasNoBooks = () => {
    const books = getBooksForClass();
    if (books.length === 0) return true;
    
    // Check if all books in the class are empty (no title, author, etc.)
    return books.every(book => 
      (!book.Title || book.Title.trim() === '') &&
      (!book.Author || book.Author.trim() === '')
    );
  };

  const getBookstoresForDorm = () => {
    return dormBookstores[formData.dorm] || [];
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* Header */}
      <header style={{ 
        background: 'linear-gradient(135deg, #4c1d95, #7c3aed, #8b5cf6)', 
        color: 'white', 
        padding: '2rem 0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* NYU Torch Logo */}
        <div style={{ 
          position: 'absolute', 
          top: '20px', 
          left: '50px', 
          opacity: '0.15'
        }}>
          <svg width="60" height="80" viewBox="0 0 60 80" fill="none">
            <ellipse cx="30" cy="20" rx="15" ry="25" fill="url(#flame1)" />
            <ellipse cx="30" cy="22" rx="10" ry="18" fill="url(#flame2)" />
            <ellipse cx="30" cy="25" rx="6" ry="12" fill="url(#flame3)" />
            <rect x="26" y="40" width="8" height="35" fill="#8B4513" rx="2" />
            <rect x="24" y="38" width="12" height="6" fill="#A0522D" rx="3" />
            <path d="M20 35 C20 32 25 30 30 30 C35 30 40 32 40 35 L38 42 L22 42 Z" fill="#CD853F" />
            <defs>
              <radialGradient id="flame1">
                <stop offset="0%" stopColor="#FFD700" />
                <stop offset="50%" stopColor="#FF8C00" />
                <stop offset="100%" stopColor="#FF4500" />
              </radialGradient>
              <radialGradient id="flame2">
                <stop offset="0%" stopColor="#FFFF00" />
                <stop offset="100%" stopColor="#FFD700" />
              </radialGradient>
              <radialGradient id="flame3">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#FFFF00" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        <div style={{ 
          position: 'absolute', 
          top: '30px', 
          right: '80px', 
          opacity: '0.1'
        }}>
          <svg width="45" height="60" viewBox="0 0 45 60" fill="none">
            <ellipse cx="22.5" cy="15" rx="11" ry="18" fill="url(#flame1)" />
            <ellipse cx="22.5" cy="16" rx="7" ry="13" fill="url(#flame2)" />
            <ellipse cx="22.5" cy="18" rx="4" ry="9" fill="url(#flame3)" />
            <rect x="19.5" y="30" width="6" height="26" fill="#8B4513" rx="1.5" />
            <rect x="18" y="28.5" width="9" height="4.5" fill="#A0522D" rx="2.25" />
            <path d="M15 26.25 C15 24 18.75 22.5 22.5 22.5 C26.25 22.5 30 24 30 26.25 L28.5 31.5 L16.5 31.5 Z" fill="#CD853F" />
          </svg>
        </div>
        
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: '800', 
            marginBottom: '0.5rem',
            letterSpacing: '-0.025em'
          }}>
            NYU Madrid Book Finder
          </h1>
          <div style={{ 
            background: 'rgba(255,255,255,0.15)', 
            padding: '8px 20px', 
            borderRadius: '25px', 
            display: 'inline-block',
            fontSize: '1rem',
            fontWeight: '600',
            backdropFilter: 'blur(10px)'
          }}>
            For NYU Madrid Students
          </div>
        </div>
      </header>

      {/* Main Form Section */}
      <section style={{ background: 'white', padding: '4rem 0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              color: '#1f2937',
              marginBottom: '1rem',
              lineHeight: '1.2'
            }}>
              Find Your Course Books
            </h2>
            <p style={{ 
              fontSize: '1.2rem', 
              color: '#6b7280',
              lineHeight: '1.6',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Enter your information to see what books you need and find local bookstores
            </p>
          </div>
          
          {/* Form */}
          <div style={{ 
            background: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* Name Input */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.9rem', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Your Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#7c3aed'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Dorm Dropdown */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.9rem', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Residence Hall
                </label>
                <select
                  value={formData.dorm}
                  onChange={(e) => handleInputChange('dorm', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    backgroundColor: 'white',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#7c3aed'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                >
                  {dorms.map(dorm => (
                    <option key={dorm} value={dorm === 'Select Dorm' ? '' : dorm}>
                      {dorm}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* Course Type Dropdown */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.9rem', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Course Type
                </label>
                <select
                  value={formData.classType}
                  onChange={(e) => handleInputChange('classType', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    backgroundColor: 'white',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#7c3aed'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                >
                  {getClassTypes().map(type => (
                    <option key={type} value={type === 'Select Course Type' ? '' : type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teacher Dropdown */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.9rem', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Professor
                </label>
                <select
                  value={formData.teacher}
                  onChange={(e) => handleInputChange('teacher', e.target.value)}
                  disabled={!formData.classType}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    backgroundColor: !formData.classType ? '#f9fafb' : 'white',
                    outline: 'none',
                    cursor: !formData.classType ? 'not-allowed' : 'pointer'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#7c3aed'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                >
                  {getAvailableTeachers().map(teacher => (
                    <option key={teacher} value={teacher === 'Select Teacher' ? '' : teacher}>
                      {teacher}
                    </option>
                  ))}
                </select>
              </div>

              {/* Class Dropdown */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.9rem', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Class
                </label>
                <select
                  value={formData.class}
                  onChange={(e) => handleInputChange('class', e.target.value)}
                  disabled={!formData.teacher}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    backgroundColor: !formData.teacher ? '#f9fafb' : 'white',
                    outline: 'none',
                    cursor: !formData.teacher ? 'not-allowed' : 'pointer'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#7c3aed'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                >
                  {getAvailableClasses().map(cls => (
                    <option key={cls} value={cls === 'Select Class' ? '' : cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Find Books Button */}
            <button
              onClick={handleFindBooks}
              disabled={isLoading}
              style={{
                width: '100%',
                background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                color: 'white',
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                transform: isLoading ? 'none' : 'translateY(0)',
                boxShadow: isLoading ? 'none' : '0 4px 15px rgba(124, 58, 237, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(124, 58, 237, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(124, 58, 237, 0.3)';
                }
              }}
            >
              {isLoading ? 'Finding Books...' : 'Find My Books'}
            </button>
          </div>
        </div>
      </section>

      {/* Loading State */}
      {isLoading && (
        <section style={{ padding: '4rem 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
            <div style={{ 
              fontSize: '1.2rem', 
              color: '#6b7280', 
              marginBottom: '2rem',
              fontWeight: '500'
            }}>
              Finding your books and local bookstores...
            </div>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              border: '4px solid #e5e7eb', 
              borderTop: '4px solid #7c3aed', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}></div>
          </div>
        </section>
      )}

      {/* Books Section */}
      {showBooks && !isLoading && (
        <section ref={booksRef} style={{ padding: '4rem 0', backgroundColor: '#f8fafc' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h3 style={{ 
                fontSize: '2rem', 
                fontWeight: '700',
                color: '#059669',
                marginBottom: '0.5rem'
              }}>
                Books for {formData.class}
              </h3>
              <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>
                Hello {formData.name}! Here are your books and nearby stores:
              </p>
            </div>

            {/* No books required message */}
            {hasNoBooks() && (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem',
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '2px solid #10b981'
              }}>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem'
                }}>
                  ✅
                </div>
                <h4 style={{ 
                  fontSize: '1.8rem', 
                  color: '#10b981',
                  marginBottom: '1rem',
                  fontWeight: '700'
                }}>
                  No Books Required!
                </h4>
                <p style={{ 
                  color: '#6b7280',
                  fontSize: '1.1rem'
                }}>
                  All course materials are available on Brightspace or provided by the professor.
                </p>
              </div>
            )}

            {/* Digital Books Section */}
            {!hasNoBooks() && getDigitalBooks().length > 0 && (
              <div style={{ marginBottom: '3rem' }}>
                <h4 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '600',
                  color: '#059669',
                  marginBottom: '1.5rem',
                  textAlign: 'center'
                }}>
                  📱 Available Online ({getDigitalBooks().length})
                </h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                  gap: '1.5rem'
                }}>
                  {getDigitalBooks().map((book, index) => (
                    <div key={index} style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      borderLeft: '4px solid #059669'
                    }}>
                      <h5 style={{ 
                        fontSize: '1.2rem', 
                        fontWeight: '700',
                        color: '#1f2937',
                        marginBottom: '0.5rem'
                      }}>
                        {book.Title}
                      </h5>
                      <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                        by {book.Author}
                      </p>
                      <div style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '1rem' }}>
                        <div><strong>Course:</strong> {book['Course Code']}</div>
                        <div><strong>Type:</strong> {book['Required or Supplemental']}</div>
                        {book.ISBN && <div><strong>ISBN:</strong> {book.ISBN}</div>}
                      </div>
                      {(book['Digital?'] && book['Digital?'].startsWith('http')) && (
                        <a 
                          href={book['Digital?']} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            background: '#059669',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            display: 'inline-block',
                            marginRight: '10px'
                          }}
                        >
                          📖 Access Online
                        </a>
                      )}
                      {(book['First year/Notes'] && book['First year/Notes'].startsWith('http')) && (
                        <a 
                          href={book['First year/Notes']} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            background: '#059669',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            display: 'inline-block'
                          }}
                        >
                          📖 Access Online
                        </a>
                      )}
                      {(book.Notes && book.Notes.toLowerCase().includes('brightspace')) && (
                        <div style={{
                          background: '#059669',
                          color: 'white',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          display: 'inline-block'
                        }}>
                          📚 Available on Brightspace
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Physical Books Section */}
            {!hasNoBooks() && getPhysicalBooks().length > 0 && (
              <div>
                <h4 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '600',
                  color: '#dc2626',
                  marginBottom: '1.5rem',
                  textAlign: 'center'
                }}>
                  🏪 Bookstore Required ({getPhysicalBooks().length})
                </h4>
                
                {/* For each physical book, show bookstore cards */}
                {getPhysicalBooks().map((book, bookIndex) => (
                  <div key={bookIndex} style={{ marginBottom: '3rem' }}>
                    <div style={{ 
                      textAlign: 'center',
                      marginBottom: '2rem',
                      padding: '2rem',
                      background: 'white',
                      borderRadius: '16px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      border: book['Required or Supplemental']?.toLowerCase().includes('required') ? '2px solid #dc2626' : '2px solid #e5e7eb'
                    }}>
                      <div style={{ 
                        background: book['Required or Supplemental']?.toLowerCase().includes('required') ? '#dc2626' : '#6b7280',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        display: 'inline-block',
                        marginBottom: '1rem'
                      }}>
                        {book['Required or Supplemental']?.toLowerCase().includes('required') ? 'REQUIRED' : 'RECOMMENDED'}
                      </div>
                      
                      <h5 style={{ 
                        fontSize: '1.8rem', 
                        fontWeight: '700',
                        color: '#1f2937',
                        marginBottom: '0.5rem',
                        lineHeight: '1.3'
                      }}>
                        {book.Title}
                      </h5>
                      
                      <p style={{ 
                        fontSize: '1.1rem',
                        color: '#6b7280',
                        marginBottom: '1rem'
                      }}>
                        by {book.Author}
                      </p>
                      
                      <div style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '1rem' }}>
                        <div><strong>Course:</strong> {book['Course Code']}</div>
                        <div><strong>Type:</strong> {book['Required or Supplemental']}</div>
                        {book.ISBN && <div><strong>ISBN:</strong> {book.ISBN}</div>}
                        {book.Notes && <div><strong>Notes:</strong> {book.Notes}</div>}
                      </div>

                      <p style={{ 
                        fontSize: '1rem',
                        color: '#6b7280'
                      }}>
                        Available at these stores near {formData.dorm}:
                      </p>
                    </div>

                    {/* Bookstores for this book */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
                      gap: '2rem'
                    }}>
                      {getBookstoresForDorm().map((store, storeIndex) => (
                        <BookstoreCard 
                          key={`${bookIndex}-${storeIndex}`}
                          store={store}
                          book={{
                            title: book.Title,
                            author: book.Author,
                            price: 29.99, // You can add price logic here
                            required: book['Required or Supplemental']?.toLowerCase().includes('required')
                          }}
                          studentName={formData.name}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No books found message - only show if there are books but they don't match the class */}
            {!hasNoBooks() && getBooksForClass().length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem',
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                <h4 style={{ 
                  fontSize: '1.5rem', 
                  color: '#6b7280',
                  marginBottom: '1rem'
                }}>
                  No books found for this class
                </h4>
                <p style={{ color: '#9ca3af' }}>
                  Please check your selections or contact your professor for more information.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{ 
        background: '#1f2937', 
        color: 'white', 
        textAlign: 'center', 
        padding: '3rem 0',
        marginTop: '4rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '3rem', 
            flexWrap: 'wrap'
          }}>
            <p style={{ margin: '0', fontSize: '1rem' }}>
              2025 NYU Madrid Local Bookstore Finder
            </p>
            <div style={{ 
              background: '#10b981', 
              padding: '10px 20px', 
              borderRadius: '25px', 
              fontWeight: '600',
              fontSize: '0.95rem'
            }}>
              Supporting Local Madrid Businesses
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Homepage;