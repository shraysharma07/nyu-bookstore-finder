import React from 'react';
import PropTypes from 'prop-types';

const BookstoreCard = ({ store }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  // Safeguard against missing data
  if (!store) {
    return (
      <div style={{ 
        background: '#fee2e2', 
        padding: '1.5rem', 
        borderRadius: '15px', 
        textAlign: 'center',
        color: '#dc2626'
      }}>
        ⚠️ Store information unavailable
      </div>
    );
  }

  const handleContact = () => {
    try {
      // In the real version, this would open contact details or make a phone call
      alert(`Contact ${store.name}\n\nPhone: ${store.phone}\n\nThis demo shows how the contact system would work. In the real app, this would:\n• Show detailed contact info\n• Allow book reservation\n• Provide walking directions`);
    } catch (error) {
      console.error('Contact action failed:', error);
      alert('Unable to show contact details right now. Please try again.');
    }
  };

  const cardStyle = {
    background: 'white',
    borderRadius: '15px',
    padding: '1.5rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    border: '1px solid #f3f4f6',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer'
  };

  const cardHoverStyle = {
    ...cardStyle,
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
  };

  return (
    <div 
      style={isHovered ? cardHoverStyle : cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Store Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          background: 'linear-gradient(135deg, #10b981, #059669)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>
          {store.initials || '??'}
        </div>
        <div style={{ flex: '1' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#1f2937' }}>
            {store.name || 'Unknown Store'}
          </div>
        </div>
        <span style={{ 
          background: store.availability === 'In Stock' ? '#10b981' : '#f59e0b',
          color: 'white',
          padding: '4px 10px',
          borderRadius: '15px',
          fontSize: '0.8rem',
          fontWeight: '600'
        }}>
          {store.availability === 'In Stock' ? '✓' : '⏳'} {store.availability || 'Unknown'}
        </span>
      </div>

      {/* Book Info */}
      <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', marginBottom: '1rem' }}>
        <div style={{ fontWeight: '600', color: '#374151', marginBottom: '0.5rem', lineHeight: '1.4' }}>
          {store.bookTitle || 'Book information unavailable'}
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#059669' }}>
          {store.price || 'Price unavailable'}
        </div>
      </div>

      {/* Store Details */}
      <div style={{ marginBottom: '1rem', color: '#6b7280' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ minWidth: '20px' }}>📍</span> 
          <span>{store.address || 'Address unavailable'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span>🚶‍♂️</span> 
          <span>{store.walkTime || 'Distance unavailable'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span>📞</span> 
          <span>{store.phone || 'Phone unavailable'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <span style={{ minWidth: '20px' }}>🕒</span> 
          <span>{store.hours || 'Hours unavailable'}</span>
        </div>
      </div>

      {/* Contact Button */}
      <button
        onClick={handleContact}
        style={{
          background: '#4f46e5',
          color: 'white',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          fontWeight: '600',
          cursor: 'pointer',
          width: '100%',
          transition: 'background-color 0.2s ease'
        }}
        onMouseOver={(e) => e.target.style.background = '#3730a3'}
        onMouseOut={(e) => e.target.style.background = '#4f46e5'}
      >
        📞 Contact Store & Reserve
      </button>
    </div>
  );
};

// Define expected props for type safety
BookstoreCard.propTypes = {
  store: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    initials: PropTypes.string,
    availability: PropTypes.string,
    bookTitle: PropTypes.string,
    price: PropTypes.string,
    address: PropTypes.string,
    walkTime: PropTypes.string,
    phone: PropTypes.string,
    hours: PropTypes.string
  })
};

export default BookstoreCard;