import React, { useState } from 'react';
import SearchForm from '../components/SearchForm';
import BookstoreCard from '../components/BookstoreCard';

const HomePage = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (searchQuery) => {
    console.log('Searching for:', searchQuery);
    setIsLoading(true);
    setError('');
    setShowResults(false);
    
    try {
      // Simulate API delay (remove this when connecting to real backend)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Chen Chen put real API call here
      const fakeResults = [
        {
          id: 1,
          name: "Antonio Machado",
          initials: "AM",
          availability: "In Stock",
          bookTitle: "Psychology: The Science of Mind and Behaviour (8th Edition)",
          price: "€45.90",
          address: "Calle Fernando VI, 17, Madrid",
          walkTime: "8 min walk from NYU Madrid",
          phone: "+34 915 21 21 13",
          hours: "Mon-Fri: 10:00-20:30, Sat: 10:00-14:00"
        },
        {
          id: 2,
          name: "Pasajes Internacional",
          initials: "PI",
          availability: "In Stock",
          bookTitle: "Psychology: The Science of Mind and Behaviour (8th Edition)",
          price: "€42.50",
          address: "Calle Génova, 3, Madrid",
          walkTime: "12 min walk from NYU Madrid",
          phone: "+34 915 57 12 29",
          hours: "Mon-Sat: 9:30-21:00, Sun: 11:00-14:00"
        },
        {
          id: 3,
          name: "La Central",
          initials: "LC",
          availability: "In Stock",
          bookTitle: "Psychology: The Science of Mind and Behaviour (8th Edition)",
          price: "€47.20",
          address: "Calle Postigo de San Martín, 8, Madrid",
          walkTime: "15 min walk from NYU Madrid",
          phone: "+34 915 48 69 40",
          hours: "Mon-Sat: 9:30-21:30, Sun: 11:00-21:00"
        }
      ];

      // Simulate random failures 10% of the time for testing
      if (Math.random() < 0.1) {
        throw new Error('Network error');
      }

      setSearchResults(fakeResults);
      setShowResults(true);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Unable to search at the moment. Please try again.');
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #4c1d95, #7c3aed)', color: 'white', padding: '1rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>📚 Madrid Book Finder</h1>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>
            For NYU Madrid Students
          </span>
        </div>
      </header>

      {/* Search Section */}
      <section style={{ background: 'white', padding: '3rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }}>
            Find Your Textbooks Locally
          </h2>
          <p style={{ fontSize: '1.2rem', color: '#6b7280', marginBottom: '2rem' }}>
            Support Madrid bookstores while getting your required course materials
          </p>
          
          <SearchForm onSearch={handleSearch} />

          {/* Global Error Message */}
          {error && !isLoading && (
            <div style={{ 
              background: '#fee2e2', 
              color: '#dc2626', 
              padding: '1rem', 
              borderRadius: '10px', 
              marginTop: '1rem',
              border: '1px solid #fecaca',
              maxWidth: '600px',
              margin: '1rem auto 0'
            }}>
              {error}
            </div>
          )}
        </div>
      </section>

      {/* Loading State */}
      {isLoading && (
        <section style={{ marginBottom: '3rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', color: '#6b7280', marginBottom: '2rem' }}>
              🔍 Searching local bookstores...
            </div>
            {/* Simple loading animation */}
            <div style={{ 
              width: '50px', 
              height: '50px', 
              border: '4px solid #e5e7eb', 
              borderTop: '4px solid #7c3aed', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}>
            </div>
          </div>
        </section>
      )}

      {/* Results Section */}
      {showResults && !isLoading && searchResults.length > 0 && (
        <section style={{ marginBottom: '3rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#059669' }}>
                ✅ Found at Local Madrid Bookstores
              </h3>
              <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>
                {searchResults.length} stores near NYU Madrid campus have your book in stock
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
              {searchResults.map(store => (
                <BookstoreCard key={store.id} store={store} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* No Results State */}
      {showResults && !isLoading && searchResults.length === 0 && !error && (
        <section style={{ marginBottom: '3rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', color: '#6b7280', marginBottom: '1rem' }}>
              📚 No books found
            </div>
            <p style={{ color: '#9ca3af' }}>
              Try searching with a different course code or book title
            </p>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{ background: '#1f2937', color: 'white', textAlign: 'center', padding: '2rem 0', marginTop: '3rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <p>© 2025 NYU Madrid Local Bookstore Finder</p>
            <div style={{ background: '#10b981', padding: '8px 16px', borderRadius: '20px', fontWeight: '600' }}>
              ❤️ Supporting Local Madrid Businesses
            </div>
          </div>
        </div>
      </footer>

      {/* CSS for loading spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default HomePage;