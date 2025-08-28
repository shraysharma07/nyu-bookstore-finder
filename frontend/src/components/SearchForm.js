import React, { useState } from 'react';

const SearchForm = ({ onSearch }) => {
  const [courseCode, setCourseCode] = useState('PSYC-UA 101');
  const [bookSearch, setBookSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const searchQuery = courseCode.trim() || bookSearch.trim();
    
    // Validation
    if (!searchQuery) {
      setError('Please enter a course code or book title');
      return;
    }

    if (searchQuery.length < 2) {
      setError('Search query must be at least 2 characters');
      return;
    }

    setIsLoading(true);
    
    try {
      await onSearch(searchQuery);
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    padding: '1rem',
    fontSize: '1.1rem',
    border: error ? '2px solid #ef4444' : '2px solid #e5e7eb',
    borderRadius: '10px',
    width: '100%',
    marginBottom: '1rem'
  };

  const buttonStyle = {
    background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #7c3aed, #4c1d95)',
    color: 'white',
    border: 'none',
    padding: '1rem 2rem',
    fontSize: '1.1rem',
    fontWeight: '600',
    borderRadius: '10px',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    width: '100%'
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto' }}>
      {error && (
        <div style={{ 
          background: '#fee2e2', 
          color: '#dc2626', 
          padding: '1rem', 
          borderRadius: '10px', 
          marginBottom: '1rem',
          border: '1px solid #fecaca'
        }}>
          {error}
        </div>
      )}
      
      <input
        type="text"
        style={inputStyle}
        placeholder="Enter course code (e.g., PSYC-UA 101)"
        value={courseCode}
        onChange={(e) => setCourseCode(e.target.value)}
        disabled={isLoading}
      />
      
      <input
        type="text"
        style={inputStyle}
        placeholder="Or search by book title or author"
        value={bookSearch}
        onChange={(e) => setBookSearch(e.target.value)}
        disabled={isLoading}
      />
      
      <button type="submit" style={buttonStyle} disabled={isLoading}>
        {isLoading ? '🔍 Searching...' : '🔍 Find Books in Local Stores'}
      </button>
    </form>
  );
};

export default SearchForm;