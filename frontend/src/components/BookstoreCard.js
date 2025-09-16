import React from 'react';

const BookstoreCard = ({ store, book, studentName }) => {
  // Function to create bookstore-specific search URLs
  const createBookstoreLink = (bookTitle, storeName) => {
    const searchQuery = encodeURIComponent(bookTitle);
    
    switch (storeName) {
      case 'Secret Kingdoms':
        return `https://thesecretkingdoms.net/busqueda/listaLibros.php?tipoBus=full&aproximada=N&palabrasBusqueda=${searchQuery}`;
      
      case 'Parentisis':
        // Replace with actual Parentisis URL structure when you have it
        return `https://parentisis.com/search?q=${searchQuery}`;
      
      case 'Desperate Literature':
        // Replace with actual Desperate Literature URL structure when you have it
        return `https://desperateliterature.com/search?query=${searchQuery}`;
      
      default:
        // Fallback to Google search for the bookstore
        return `https://www.google.com/search?q=${searchQuery}+${encodeURIComponent(storeName)}`;
    }
  };

  // Function to get bookstore-specific button text
  const getButtonText = (storeName) => {
    switch (storeName) {
      case 'Secret Kingdoms':
        return '🛒 Buy at Secret Kingdoms';
      case 'Parentisis':
        return '📚 Buy at Parentisis';
      case 'Desperate Literature':
        return '📖 Buy at Desperate Literature';
      default:
        return `🛍️ Buy at ${storeName}`;
    }
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '2rem',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
      transition: 'transform 0.2s, box-shadow 0.2s'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
    }}>
      
      {/* Store Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h5 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700',
            color: '#1f2937',
            marginBottom: '0.5rem',
            lineHeight: '1.2'
          }}>
            {store.name}
          </h5>
          <p style={{ 
            color: '#6b7280',
            fontSize: '0.95rem',
            margin: '0'
          }}>
            {store.address}
          </p>
        </div>
        
        <div style={{
          background: store.availability === 'In Stock' ? '#dcfce7' : '#fef3c7',
          color: store.availability === 'In Stock' ? '#166534' : '#92400e',
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: '600',
          whiteSpace: 'nowrap'
        }}>
          {store.availability}
        </div>
      </div>

      {/* Store Details */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div>
            <span style={{ 
              fontSize: '0.8rem', 
              color: '#6b7280', 
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Distance
            </span>
            <p style={{ 
              fontSize: '1rem',
              color: '#1f2937',
              fontWeight: '600',
              margin: '0.25rem 0 0 0'
            }}>
              {store.distance}
            </p>
          </div>
          
          <div>
            <span style={{ 
              fontSize: '0.8rem', 
              color: '#6b7280', 
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Phone
            </span>
            <p style={{ 
              fontSize: '1rem',
              color: '#1f2937',
              fontWeight: '600',
              margin: '0.25rem 0 0 0'
            }}>
              {store.phone}
            </p>
          </div>
        </div>

        <div style={{ 
          background: '#f8fafc', 
          padding: '1rem', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <span style={{ 
            fontSize: '0.8rem', 
            color: '#6b7280', 
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Looking for
          </span>
          <p style={{ 
            fontSize: '1rem',
            color: '#1f2937',
            fontWeight: '600',
            margin: '0.25rem 0 0 0'
          }}>
            {book.title}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Google Maps Button */}
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.name + ', ' + store.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '1rem 1rem',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '0.95rem',
            transition: 'all 0.2s',
            border: 'none',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
          }}
        >
          📍 View on Maps
        </a>

        {/* Bookstore-specific Link Button */}
        <a
          href={createBookstoreLink(book.title, store.name)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '1rem 1rem',
            background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '0.95rem',
            transition: 'all 0.2s',
            border: 'none',
            boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 25px rgba(124, 58, 237, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(124, 58, 237, 0.3)';
          }}
        >
          {getButtonText(store.name)}
        </a>
      </div>

      {/* Student Info */}
      <div style={{ 
        marginTop: '1.5rem',
        padding: '1rem',
        background: 'linear-gradient(135deg, #ecfdf5, #f0fdf4)',
        borderRadius: '8px',
        border: '1px solid #d1fae5'
      }}>
        <p style={{ 
          fontSize: '0.85rem',
          color: '#065f46',
          margin: '0',
          textAlign: 'center',
          fontWeight: '500'
        }}>
          For: {studentName} • {book.required ? 'Required' : 'Recommended'} Text
        </p>
      </div>
    </div>
  );
};

export default BookstoreCard;