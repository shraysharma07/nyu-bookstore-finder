import React, { useState } from 'react';

const SearchForm = ({ onSearch }) => {
  const [formData, setFormData] = useState({
    studentName: '',
    dorm: '',
    course: '',
    professor: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Sample data
  const dorms = [
    { value: 'chamberi', label: 'Chamberí' },
    { value: 'moncloa', label: 'Moncloa' },
    { value: 'malasana', label: 'Malasaña' }
  ];

  const courses = [
    { value: 'psyc-101', label: 'Introduction to Psychology', professor: 'Dr. Sarah Martinez' },
    { value: 'econ-201', label: 'Principles of Economics', professor: 'Prof. James Wilson' },
    { value: 'hist-150', label: 'Modern European History', professor: 'Dr. Elena Rodriguez' },
    { value: 'lit-300', label: 'Contemporary Spanish Literature', professor: 'Prof. Carlos Mendez' },
    { value: 'bus-250', label: 'International Business', professor: 'Dr. Michael Thompson' },
    { value: 'art-180', label: 'History of Art', professor: 'Prof. Isabella Garcia' }
  ];

  const booksByCourse = {
    'psyc-101': [
      { title: 'Introduction to Psychology', author: 'David G. Myers', type: 'Required', isbn: '9781464140815' },
      { title: 'Psychology: A Concise Introduction', author: 'Richard A. Griggs', type: 'Recommended', isbn: '9781464154232' }
    ],
    'econ-201': [
      { title: 'Principles of Economics', author: 'N. Gregory Mankiw', type: 'Required', isbn: '9781337516853' },
      { title: 'Economics in One Lesson', author: 'Henry Hazlitt', type: 'Recommended', isbn: '9780517548233' }
    ],
    'hist-150': [
      { title: 'A History of Modern Europe', author: 'John Merriman', type: 'Required', isbn: '9780393667684' },
      { title: 'The Pursuit of Power: Europe 1815-1914', author: 'Richard J. Evans', type: 'Recommended', isbn: '9780670024570' }
    ],
    'lit-300': [
      { title: 'Contemporary Spanish Literature', author: 'Various Authors', type: 'Required', isbn: '9788437635789' },
      { title: 'The Spanish Civil War', author: 'Helen Graham', type: 'Recommended', isbn: '9780199696727' }
    ],
    'bus-250': [
      { title: 'International Business', author: 'John J. Wild', type: 'Required', isbn: '9781260547788' },
      { title: 'The World Is Flat', author: 'Thomas L. Friedman', type: 'Recommended', isbn: '9780374292799' }
    ],
    'art-180': [
      { title: 'Gardner\'s Art Through the Ages', author: 'Fred S. Kleiner', type: 'Required', isbn: '9781305577800' },
      { title: 'Ways of Seeing', author: 'John Berger', type: 'Recommended', isbn: '9780140135152' }
    ]
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.studentName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!formData.dorm) {
      setError('Please select your dorm');
      return;
    }

    if (!formData.course) {
      setError('Please select a course');
      return;
    }

    setIsLoading(true);

    try {
      // Get selected course info
      const selectedCourse = courses.find(course => course.value === formData.course);
      const courseBooks = booksByCourse[formData.course] || [];
      
      await onSearch({
        ...formData,
        courseName: selectedCourse.label,
        professor: selectedCourse.professor,
        books: courseBooks
      });
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCourse = courses.find(course => course.value === formData.course);
  const selectedBooks = formData.course ? booksByCourse[formData.course] || [] : [];

  const inputStyle = {
    width: '100%',
    padding: '1rem 1.25rem',
    fontSize: '1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    backgroundColor: 'white',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit'
  };

  const focusStyle = {
    outline: 'none',
    borderColor: '#7c3aed',
    boxShadow: '0 0 0 3px rgba(124, 58, 237, 0.1)'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.75rem',
    fontWeight: '600',
    color: '#374151',
    fontSize: '1rem'
  };

  const iconStyle = {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    marginRight: '8px',
    borderRadius: '2px',
    verticalAlign: 'middle'
  };

  return (
    <div style={{ 
      background: 'white', 
      padding: '2.5rem', 
      borderRadius: '20px', 
      boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #f3f4f6'
    }}>
      {error && (
        <div style={{ 
          background: '#fee2e2', 
          color: '#dc2626', 
          padding: '1rem 1.25rem', 
          borderRadius: '12px', 
          marginBottom: '1.5rem',
          border: '1px solid #fecaca',
          fontSize: '0.95rem'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Student Name */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={labelStyle}>
            <div style={{...iconStyle, background: 'linear-gradient(135deg, #7c3aed, #a855f7)'}}></div>
            Your Name
          </label>
          <input
            type="text"
            name="studentName"
            value={formData.studentName}
            onChange={handleInputChange}
            placeholder="Enter your full name"
            style={inputStyle}
            onFocus={(e) => Object.assign(e.target.style, focusStyle)}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = 'none';
            }}
            disabled={isLoading}
          />
        </div>

        {/* Dorm Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={labelStyle}>
            <div style={{
              ...iconStyle, 
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '4px',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '2px',
                left: '2px',
                right: '2px',
                bottom: '6px',
                border: '1px solid white',
                borderRadius: '2px'
              }}></div>
              <div style={{
                position: 'absolute',
                bottom: '2px',
                left: '4px',
                right: '4px',
                height: '2px',
                background: 'white'
              }}></div>
            </div>
            Your Dorm
          </label>
          <select
            name="dorm"
            value={formData.dorm}
            onChange={handleInputChange}
            style={{...inputStyle, cursor: 'pointer'}}
            disabled={isLoading}
          >
            <option value="">Select your dorm</option>
            {dorms.map(dorm => (
              <option key={dorm.value} value={dorm.value}>
                {dorm.label}
              </option>
            ))}
          </select>
        </div>

        {/* Course Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={labelStyle}>
            <div style={{
              ...iconStyle,
              background: 'linear-gradient(135deg, #f59e0b, #f97316)',
              borderRadius: '2px',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '1px',
                left: '1px',
                right: '1px',
                height: '6px',
                background: 'white',
                borderRadius: '1px'
              }}></div>
              <div style={{
                position: 'absolute',
                bottom: '1px',
                left: '3px',
                right: '3px',
                height: '2px',
                background: 'white'
              }}></div>
              <div style={{
                position: 'absolute',
                bottom: '4px',
                left: '3px',
                right: '3px',
                height: '1px',
                background: 'white'
              }}></div>
            </div>
            Course
          </label>
          <select
            name="course"
            value={formData.course}
            onChange={handleInputChange}
            style={{...inputStyle, cursor: 'pointer'}}
            disabled={isLoading}
          >
            <option value="">Select your course</option>
            {courses.map(course => (
              <option key={course.value} value={course.value}>
                {course.label}
              </option>
            ))}
          </select>
        </div>

        {/* Professor Display */}
        {selectedCourse && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>
              <div style={{
                ...iconStyle,
                background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                borderRadius: '50%',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: '50%',
                  width: '6px',
                  height: '6px',
                  background: 'white',
                  borderRadius: '50%',
                  transform: 'translateX(-50%)'
                }}></div>
                <div style={{
                  position: 'absolute',
                  bottom: '1px',
                  left: '2px',
                  right: '2px',
                  height: '6px',
                  background: 'white',
                  borderRadius: '0 0 50% 50%'
                }}></div>
              </div>
              Professor
            </label>
            <div style={{
              ...inputStyle,
              backgroundColor: '#f9fafb',
              color: '#6b7280',
              border: '2px solid #f3f4f6'
            }}>
              {selectedCourse.professor}
            </div>
          </div>
        )}

        {/* Required Books Preview */}
        {selectedBooks.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <label style={labelStyle}>
              <div style={{
                ...iconStyle,
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                borderRadius: '2px',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: '2px',
                  right: '4px',
                  height: '12px',
                  background: 'white',
                  borderRadius: '1px'
                }}></div>
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  left: '4px',
                  right: '6px',
                  height: '1px',
                  background: '#8b5cf6'
                }}></div>
                <div style={{
                  position: 'absolute',
                  top: '7px',
                  left: '4px',
                  right: '6px',
                  height: '1px',
                  background: '#8b5cf6'
                }}></div>
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '4px',
                  width: '4px',
                  height: '1px',
                  background: '#8b5cf6'
                }}></div>
              </div>
              Books for this course
            </label>
            <div style={{
              background: '#f8fafc',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.25rem'
            }}>
              {selectedBooks.map((book, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: index < selectedBooks.length - 1 ? '1rem' : '0',
                  paddingBottom: index < selectedBooks.length - 1 ? '1rem' : '0',
                  borderBottom: index < selectedBooks.length - 1 ? '1px solid #e5e7eb' : 'none'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.95rem' }}>
                      {book.title}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                      by {book.author}
                    </div>
                  </div>
                  <span style={{
                    background: book.type === 'Required' ? '#dbeafe' : '#f0fdf4',
                    color: book.type === 'Required' ? '#1e40af' : '#166534',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}>
                    {book.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #7c3aed, #4c1d95)',
            color: 'white',
            border: 'none',
            padding: '1.25rem 2rem',
            borderRadius: '12px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit'
          }}
          onMouseOver={(e) => !isLoading && (e.target.style.transform = 'translateY(-1px)')}
          onMouseOut={(e) => !isLoading && (e.target.style.transform = 'translateY(0)')}
        >
          {isLoading ? 'Finding Books...' : 'Find Books in Local Stores'}
        </button>
      </form>
    </div>
  );
};

export default SearchForm;