import React, { useState } from 'react';
import PropTypes from 'prop-types';

const BookstoreCard = ({ store, book, studentName }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Safeguard against missing data
  if (!store) {
    return (
      <div style={{ 
        background: '#fee2e2', 
        padding: '1.5rem', 
        borderRadius: '16px', 
        textAlign: 'center',
        color: '#dc2626',
        border: '1px solid #fecaca'
      }}>
        Store information unavailable
      </div>
    );
  }

  const handleContact = () => {
    try {
      const message = `Contact ${store.name}

Phone: ${store.phone}
Address: ${store.address}
Distance: ${store.distance}

${book ? `Book: ${book.title}
Author: ${book.author}
Price: $${book.price}` : 'Book information not available'}

${studentName ? `Student: ${studentName}` : ''}

This demo shows how the contact system would work. In the real app, this would:
- Show detailed contact information
- Allow book reservation
- Provide walking directions
- Send SMS/WhatsApp to the store`;

      alert(message);
    } catch (error) {
      console.error('Contact action failed:', error);
      alert('Unable to show contact details right now. Please try again.');
    }
  };

  const handleDirections = () => {
    try {
      // Google Maps integration for directions
      const destination = encodeURIComponent(store.address + ", Madrid, Spain");
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`;
      
      // Open Google Maps in new tab
      window.open(mapsUrl, '_blank');
    } catch (error) {
      console.error('Directions failed:', error);
      alert('Unable to open directions. Please try again.');
    }
  };

  const handleViewOnMap = () => {
    try {
      // Google Maps integration to view location
      const location = encodeURIComponent(store.address + ", Madrid, Spain");
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${location}`;
      
      // Open Google Maps in new tab
      window.open(mapsUrl, '_blank');
    } catch (error) {
      console.error('Map view failed:', error);
      alert('Unable to open map. Please try again.');
    }
  };

  const cardStyle = {
    background: 'white',
    borderRadius: '20px',
    padding: '2rem',
    boxShadow: isHovered ? '0 20px 40px -4px rgba(0, 0, 0, 0.15)' : '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #f3f4f6',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden'
  };

  const getAvailabilityColor = (availability) => {
    switch (availability) {
      case 'In Stock': return { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' };
      case 'Limited Stock': return { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' };
      case 'Out of Stock': return { bg: '#fee2e2', color: '#dc2626', border: '#fecaca' };
      default: return { bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db' };
    }
  };

  const availabilityStyle = getAvailabilityColor(store.availability);

  // Custom icon components
  const LocationIcon = () => (
    <div style={{
      width: '16px',
      height: '16px',
      position: 'relative',
      display: 'inline-block',
      marginRight: '8px'
    }}>
      <div style={{
        width: '12px',
        height: '12px',
        border: '2px solid #7c3aed',
        borderRadius: '50% 50% 50% 0',
        transform: 'rotate(-45deg)',
        position: 'absolute',
        top: '0',
        left: '2px'
      }}>
        <div style={{
          width: '6px',
          height: '6px',
          background: '#7c3aed',
          borderRadius: '50%',
          position: 'absolute',
          top: '1px',
          left: '1px',
          transform: 'rotate(45deg)'
        }}></div>
      </div>
    </div>
  );

  const WalkIcon = () => (
    <div style={{
      width: '16px',
      height: '16px',
      position: 'relative',
      display: 'inline-block',
      marginRight: '8px'
    }}>
      <div style={{
        width: '4px',
        height: '4px',
        background: '#7c3aed',
        borderRadius: '50%',
        position: 'absolute',
        top: '0',
        left: '6px'
      }}></div>
      <div style={{
        width: '2px',
        height: '8px',
        background: '#7c3aed',
        position: 'absolute',
        top: '4px',
        left: '7px'
      }}></div>
      <div style={{
        width: '3px',
        height: '2px',
        background: '#7c3aed',
        position: 'absolute',
        top: '8px',
        left: '5px'
      }}></div>
      <div style={{
        width: '3px',
        height: '2px',
        background: '#7c3aed',
        position: 'absolute',
        top: '8px',
        left: '8px'
      }}></div>
    </div>
  );

  const PhoneIcon = () => (
    <div style={{
      width: '16px',
      height: '16px',
      position: 'relative',
      display: 'inline-block',
      marginRight: '8px'
    }}>
      <div style={{
        width: '10px',
        height: '14px',
        border: '2px solid #7c3aed',
        borderRadius: '3px',
        position: 'absolute',
        top: '0',
        left: '3px'
      }}>
        <div style={{
          width: '6px',
          height: '1px',
          background: '#7c3aed',
          position: 'absolute',
          top: '2px',
          left: '2px'
        }}></div>
        <div style={{
          width: '4px',
          height: '1px',
          background: '#7c3aed',
          position: 'absolute',
          bottom: '2px',
          left: '3px'
        }}></div>
      </div>
    </div>
  );

  const CheckIcon = () => (
    <div style={{
      width: '16px',
      height: '16px',
      position: 'relative',
      display: 'inline-block'
    }}>
      <div style={{
        width: '2px',
        height: '6px',
        background: 'currentColor',
        transform: 'rotate(45deg)',
        position: 'absolute',
        top: '3px',
        left: '10px'
      }}></div>
      <div style={{
        width: '2px',
        height: '3px',
        background: 'currentColor',
        transform: 'rotate(-45deg)',
        position: 'absolute',
        top: '6px',
        left: '6px'
      }}></div>
    </div>
  );

  const WarningIcon = () => (
    <div style={{
      width: '16px',
      height: '16px',
      position: 'relative',
      display: 'inline-block'
    }}>
      <div style={{
        width: '0',
        height: '0',
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderBottom: '14px solid currentColor',
        position: 'absolute',
        top: '1px'
      }}></div>
      <div style={{
        width: '2px',
        height: '6px',
        background: 'white',
        position: 'absolute',
        top: '4px',
        left: '7px'
      }}></div>
      <div style={{
        width: '2px',
        height: '2px',
        background: 'white',
        position: 'absolute',
        top: '11px',
        left: '7px'
      }}></div>
    </div>
  );

  const XIcon = () => (
    <div style={{
      width: '16px',
      height: '16px',
      position: 'relative',
      display: 'inline-block'
    }}>
      <div style={{
        width: '2px',
        height: '12px',
        background: 'currentColor',
        transform: 'rotate(45deg)',
        position: 'absolute',
        top: '2px',
        left: '7px'
      }}></div>
      <div style={{
        width: '2px',
        height: '12px',
        background: 'currentColor',
        transform: 'rotate(-45deg)',
        position: 'absolute',
        top: '2px',
        left: '7px'
      }}></div>
    </div>
  );

  return (
    <div 
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Decorative element */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: '4px',
        background: 'linear-gradient(90deg, #7c3aed, #a855f7, #c084fc)'
      }} />

      {/* Store Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ 
          width: '60px', 
          height: '60px', 
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          boxShadow: '0 4px 14px 0 rgba(124, 58, 237, 0.3)',
          flexShrink: 0
        }}>
          {store.name.charAt(0)}
        </div>
        
        <div style={{ flex: '1', minWidth: 0 }}>
          <div style={{ 
            fontSize: '1.4rem', 
            fontWeight: '700', 
            color: '#1f2937',
            marginBottom: '0.5rem',
            lineHeight: '1.3'
          }}>
            {store.name}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            color: '#6b7280'
          }}>
            <LocationIcon />
            <span>{store.distance}</span>
          </div>
        </div>

        <span style={{ 
          background: availabilityStyle.bg,
          color: availabilityStyle.color,
          border: `1px solid ${availabilityStyle.border}`,
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          fontSize: '0.85rem',
          fontWeight: '600',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {store.availability === 'In Stock' ? <CheckIcon /> : 
           store.availability === 'Limited Stock' ? <WarningIcon /> : <XIcon />} 
          {store.availability}
        </span>
      </div>

      {/* Book Information */}
      {book && (
        <div style={{ 
          background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', 
          padding: '1.5rem', 
          borderRadius: '16px', 
          marginBottom: '1.5rem',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ 
            fontWeight: '600', 
            color: '#374151', 
            marginBottom: '0.75rem', 
            lineHeight: '1.4',
            fontSize: '1rem'
          }}>
            {book.title}
          </div>
          <div style={{ 
            color: '#6b7280', 
            fontSize: '0.9rem',
            marginBottom: '0.75rem'
          }}>
            by {book.author}
          </div>
          <div style={{ 
            fontSize: '1.4rem', 
            fontWeight: '700', 
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            ${book.price}
            <span style={{
              fontSize: '0.8rem',
              fontWeight: '400',
              color: '#6b7280'
            }}>
              + tax
            </span>
          </div>
          {book.required && (
            <div style={{
              background: '#dc2626',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '600',
              display: 'inline-block',
              marginTop: '0.75rem'
            }}>
              REQUIRED
            </div>
          )}
        </div>
      )}

      {/* Store Details */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ 
          display: 'grid', 
          gap: '0.75rem',
          fontSize: '0.95rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <LocationIcon /> 
            <span style={{ color: '#4b5563', lineHeight: '1.4' }}>
              {store.address}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <WalkIcon /> 
            <span style={{ color: '#4b5563' }}>
              {store.distance}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <PhoneIcon /> 
            <span style={{ color: '#4b5563' }}>
              {store.phone}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '0.75rem'
      }}>
        <button
          onClick={handleContact}
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            color: 'white',
            border: 'none',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'linear-gradient(135deg, #6d28d9, #5b21b6)';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'linear-gradient(135deg, #7c3aed, #6d28d9)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          Contact Store
        </button>

        <button
          onClick={handleDirections}
          style={{
            background: 'white',
            color: '#7c3aed',
            border: '2px solid #7c3aed',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit'
          }}
          onMouseOver={(e) => {
            e.target.style.background = '#7c3aed';
            e.target.style.color = 'white';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'white';
            e.target.style.color = '#7c3aed';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          Get Directions
        </button>
      </div>

      {/* View on Map Link */}
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <button
          onClick={handleViewOnMap}
          style={{
            background: 'transparent',
            color: '#6b7280',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.9rem',
            textDecoration: 'underline',
            fontFamily: 'inherit'
          }}
          onMouseOver={(e) => e.target.style.color = '#7c3aed'}
          onMouseOut={(e) => e.target.style.color = '#6b7280'}
        >
          View location on Google Maps
        </button>
      </div>
    </div>
  );
};

// PropTypes for type safety
BookstoreCard.propTypes = {
  store: PropTypes.shape({
    name: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    distance: PropTypes.string.isRequired,
    phone: PropTypes.string.isRequired,
    availability: PropTypes.string.isRequired
  }).isRequired,
  book: PropTypes.shape({
    title: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    required: PropTypes.bool
  }),
  studentName: PropTypes.string
};

export default BookstoreCard;