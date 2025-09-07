import React, { useState, useRef } from 'react';
import BookstoreCard from '../components/BookstoreCard';

const Homepage = () => {
  const [formData, setFormData] = useState({
    name: '',
    dorm: '',
    class: '',
    teacher: ''
  });
  const [showBooks, setShowBooks] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const booksRef = useRef(null);

  // Sample data
  const dorms = [
    'Select Dorm',
    'Chamberi',
    'Moncloa',
    'Malasaña'
  ];

  const classes = [
    'Select Class',
    'MATH-UA 121 - Calculus I',
    'PHYS-UA 91 - Physics I',
    'CHEM-UA 125 - General Chemistry',
    'ECON-UA 1 - Principles of Microeconomics',
    'PSYC-UA 1 - Introduction to Psychology',
    'ENGL-UA 1 - Writing the Essay',
    'HIST-UA 1 - Global History',
    'BIOL-UA 11 - Principles of Biology'
  ];

  // Teachers mapped to classes
  const classTeachers = {
    'MATH-UA 121 - Calculus I': ['Dr. Rodriguez', 'Prof. Martinez', 'Dr. Lopez'],
    'PHYS-UA 91 - Physics I': ['Dr. Garcia', 'Prof. Fernandez', 'Dr. Sanchez'],
    'CHEM-UA 125 - General Chemistry': ['Dr. Morales', 'Prof. Jimenez', 'Dr. Herrera'],
    'ECON-UA 1 - Principles of Microeconomics': ['Dr. Castro', 'Prof. Vargas', 'Dr. Ruiz'],
    'PSYC-UA 1 - Introduction to Psychology': ['Dr. Mendoza', 'Prof. Ortega', 'Dr. Silva'],
    'ENGL-UA 1 - Writing the Essay': ['Dr. Thompson', 'Prof. Wilson', 'Dr. Anderson'],
    'HIST-UA 1 - Global History': ['Dr. Gutierrez', 'Prof. Romero', 'Dr. Torres'],
    'BIOL-UA 11 - Principles of Biology': ['Dr. Navarro', 'Prof. Delgado', 'Dr. Moreno']
  };

  // Book data mapped to classes
  const classBooks = {
    'MATH-UA 121 - Calculus I': [
      { title: 'don quixote', author: 'James Stewart', price: 299.99, required: true },
      { title: 'Student Study Guide for Calculus', author: 'Stewart/Clegg', price: 89.99, required: false }
    ],
    'PHYS-UA 91 - Physics I': [
      { title: 'University Physics with Modern Physics', author: 'Young & Freedman', price: 349.99, required: true },
      { title: 'Physics Lab Manual', author: 'NYU Physics Dept', price: 45.00, required: true }
    ],
    'CHEM-UA 125 - General Chemistry': [
      { title: 'Chemistry: The Central Science', author: 'Brown, LeMay, Bursten', price: 389.99, required: true },
      { title: 'Chemistry Lab Safety Manual', author: 'NYU Chemistry', price: 25.00, required: true }
    ],
    'ECON-UA 1 - Principles of Microeconomics': [
      { title: 'Principles of Economics', author: 'N. Gregory Mankiw', price: 279.99, required: true },
      { title: 'Study Guide for Principles of Economics', author: 'Mankiw Study Group', price: 79.99, required: false }
    ],
    'PSYC-UA 1 - Introduction to Psychology': [
      { title: 'Psychology: The Science of Mind and Behaviour', author: 'Passer & Smith', price: 319.99, required: true }
    ],
    'ENGL-UA 1 - Writing the Essay': [
      { title: 'The Norton Field Guide to Writing', author: 'Richard Bullock', price: 129.99, required: true },
      { title: 'They Say / I Say', author: 'Graff & Birkenstein', price: 89.99, required: true }
    ],
    'HIST-UA 1 - Global History': [
      { title: 'A History of World Societies', author: 'McKay, Hill, Buckler', price: 399.99, required: true }
    ],
    'BIOL-UA 11 - Principles of Biology': [
      { title: 'Campbell Biology', author: 'Urry, Cain, Wasserman', price: 459.99, required: true },
      { title: 'Biology Lab Manual', author: 'NYU Biology Dept', price: 65.00, required: true }
    ]
  };

  // Bookstores mapped to dorms
  const dormBookstores = {
    'Chamberi': [
      {
        name: 'Librería Central',
        address: 'Calle de Fuencarral, 15',
        distance: '3 min walk',
        phone: '+34 915 21 48 98',
        availability: 'In Stock'
      },
      {
        name: 'Books & More Madrid',
        address: 'Calle de Sagasta, 8',
        distance: '5 min walk', 
        phone: '+34 914 47 82 34',
        availability: 'In Stock'
      }
    ],
    'Moncloa': [
      {
        name: 'Librería Complutense',
        address: 'Calle de Isaac Peral, 3',
        distance: '2 min walk',
        phone: '+34 915 49 67 12',
        availability: 'In Stock'
      },
      {
        name: 'Papelería Universidad',
        address: 'Calle de la Princesa, 25',
        distance: '4 min walk',
        phone: '+34 915 43 89 76',
        availability: 'Limited Stock'
      }
    ],
    'Malasaña': [
      {
        name: 'La Casa del Libro Fuencarral',
        address: 'Calle de Fuencarral, 119',
        distance: '6 min walk',
        phone: '+34 915 21 83 46',
        availability: 'In Stock'
      },
      {
        name: 'Librería Berkana',
        address: 'Calle de Hortaleza, 64',
        distance: '8 min walk',
        phone: '+34 915 22 95 99',
        availability: 'In Stock'
      }
    ]
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // If class changes, reset teacher selection
      if (field === 'class') {
        newData.teacher = '';
      }
      
      return newData;
    });
  };

  // Get available teachers based on selected class
  const getAvailableTeachers = () => {
    if (!formData.class || formData.class === 'Select Class') {
      return ['Select Teacher'];
    }
    return ['Select Teacher', ...classTeachers[formData.class]];
  };

  const handleFindBooks = async () => {
    if (!formData.name || !formData.dorm || !formData.class || !formData.teacher) {
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
    return classBooks[formData.class] || [];
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
            {/* Torch flame */}
            <ellipse cx="30" cy="20" rx="15" ry="25" fill="url(#flame1)" />
            <ellipse cx="30" cy="22" rx="10" ry="18" fill="url(#flame2)" />
            <ellipse cx="30" cy="25" rx="6" ry="12" fill="url(#flame3)" />
            
            {/* Torch handle */}
            <rect x="26" y="40" width="8" height="35" fill="#8B4513" rx="2" />
            <rect x="24" y="38" width="12" height="6" fill="#A0522D" rx="3" />
            
            {/* Torch bowl */}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* Class Dropdown */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.9rem', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Course
                </label>
                <select
                  value={formData.class}
                  onChange={(e) => handleInputChange('class', e.target.value)}
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
                  {classes.map(cls => (
                    <option key={cls} value={cls === 'Select Class' ? '' : cls}>
                      {cls}
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
                  disabled={!formData.class || formData.class === 'Select Class'}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    backgroundColor: (!formData.class || formData.class === 'Select Class') ? '#f9fafb' : 'white',
                    outline: 'none',
                    cursor: (!formData.class || formData.class === 'Select Class') ? 'not-allowed' : 'pointer'
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
                Books Required for {formData.class}
              </h3>
              <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>
                Hello {formData.name}! Here are your books and nearby stores:
              </p>
            </div>

            {/* For each book, show bookstore cards */}
            {getBooksForClass().map((book, bookIndex) => (
              <div key={bookIndex} style={{ marginBottom: '4rem' }}>
                <div style={{ 
                  textAlign: 'center',
                  marginBottom: '2rem',
                  padding: '2rem',
                  background: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  border: book.required ? '2px solid #dc2626' : '2px solid #e5e7eb'
                }}>
                  <div style={{ 
                    background: book.required ? '#dc2626' : '#6b7280',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    display: 'inline-block',
                    marginBottom: '1rem'
                  }}>
                    {book.required ? 'REQUIRED' : 'RECOMMENDED'}
                  </div>
                  
                  <h4 style={{ 
                    fontSize: '1.8rem', 
                    fontWeight: '700',
                    color: '#1f2937',
                    marginBottom: '0.5rem',
                    lineHeight: '1.3'
                  }}>
                    {book.title}
                  </h4>
                  
                  <p style={{ 
                    fontSize: '1.1rem',
                    color: '#6b7280',
                    marginBottom: '1rem'
                  }}>
                    by {book.author}
                  </p>
                  
                  <div style={{ 
                    fontSize: '1.8rem',
                    fontWeight: '700',
                    color: '#059669',
                    marginBottom: '1rem'
                  }}>
                    ${book.price}
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
                      book={book}
                      studentName={formData.name}
                    />
                  ))}
                </div>
              </div>
            ))}
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