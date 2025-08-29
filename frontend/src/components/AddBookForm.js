import React, { useState } from 'react';

const AddBookForm = ({ onAddBook }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    price: '',
    quantity: '1',
    subject: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setSuccess('');

    // Validation
    if (!formData.title || !formData.author || !formData.price) {
      setError('Please fill in title, author, and price');
      return;
    }

    if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      setError('Please enter a valid price');
      return;
    }

    if (isNaN(formData.quantity) || parseInt(formData.quantity) < 0) {
      setError('Please enter a valid quantity');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onAddBook(formData);
      setSuccess('Book added successfully!');
      
      // Reset form
      setFormData({
        title: '',
        author: '',
        isbn: '',
        price: '',
        quantity: '1',
        subject: ''
      });
    } catch (err) {
      setError('Failed to add book. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '1rem 1.25rem',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '1rem',
    marginBottom: '1rem',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.75rem',
    fontWeight: '600',
    color: '#374151',
    fontSize: '1rem'
  };

  // Custom icons
  const BookIcon = () => (
    <div style={{
      display: 'inline-block',
      width: '16px',
      height: '16px',
      marginRight: '8px',
      position: 'relative',
      verticalAlign: 'middle'
    }}>
      <div style={{
        width: '12px',
        height: '14px',
        border: '2px solid #7c3aed',
        borderRadius: '2px',
        position: 'absolute',
        top: '0',
        left: '2px'
      }}>
        <div style={{
          width: '6px',
          height: '1px',
          background: '#7c3aed',
          position: 'absolute',
          top: '3px',
          left: '3px'
        }}></div>
        <div style={{
          width: '4px',
          height: '1px',
          background: '#7c3aed',
          position: 'absolute',
          top: '6px',
          left: '4px'
        }}></div>
        <div style={{
          width: '5px',
          height: '1px',
          background: '#7c3aed',
          position: 'absolute',
          top: '9px',
          left: '3px'
        }}></div>
      </div>
    </div>
  );

  const PersonIcon = () => (
    <div style={{
      display: 'inline-block',
      width: '16px',
      height: '16px',
      marginRight: '8px',
      position: 'relative',
      verticalAlign: 'middle'
    }}>
      <div style={{
        width: '6px',
        height: '6px',
        border: '2px solid #7c3aed',
        borderRadius: '50%',
        position: 'absolute',
        top: '0',
        left: '5px'
      }}></div>
      <div style={{
        width: '10px',
        height: '6px',
        border: '2px solid #7c3aed',
        borderTop: 'none',
        borderRadius: '0 0 10px 10px',
        position: 'absolute',
        bottom: '0',
        left: '3px'
      }}></div>
    </div>
  );

  const MoneyIcon = () => (
    <div style={{
      display: 'inline-block',
      width: '16px',
      height: '16px',
      marginRight: '8px',
      position: 'relative',
      verticalAlign: 'middle'
    }}>
      <div style={{
        width: '14px',
        height: '14px',
        border: '2px solid #7c3aed',
        borderRadius: '50%',
        position: 'absolute',
        top: '0',
        left: '1px'
      }}>
        <div style={{
          width: '2px',
          height: '8px',
          background: '#7c3aed',
          position: 'absolute',
          top: '1px',
          left: '6px'
        }}></div>
        <div style={{
          width: '6px',
          height: '2px',
          background: '#7c3aed',
          borderRadius: '1px',
          position: 'absolute',
          top: '3px',
          left: '4px'
        }}></div>
        <div style={{
          width: '6px',
          height: '2px',
          background: '#7c3aed',
          borderRadius: '1px',
          position: 'absolute',
          top: '7px',
          left: '4px'
        }}></div>
      </div>
    </div>
  );

  const BoxIcon = () => (
    <div style={{
      display: 'inline-block',
      width: '16px',
      height: '16px',
      marginRight: '8px',
      position: 'relative',
      verticalAlign: 'middle'
    }}>
      <div style={{
        width: '12px',
        height: '10px',
        border: '2px solid #7c3aed',
        borderRadius: '2px',
        position: 'absolute',
        top: '3px',
        left: '2px'
      }}>
        <div style={{
          width: '4px',
          height: '1px',
          background: '#7c3aed',
          position: 'absolute',
          top: '3px',
          left: '4px'
        }}></div>
      </div>
    </div>
  );

  const TagIcon = () => (
    <div style={{
      display: 'inline-block',
      width: '16px',
      height: '16px',
      marginRight: '8px',
      position: 'relative',
      verticalAlign: 'middle'
    }}>
      <div style={{
        width: '0',
        height: '0',
        borderTop: '8px solid transparent',
        borderBottom: '8px solid transparent',
        borderRight: '12px solid #7c3aed',
        position: 'absolute',
        top: '0',
        left: '0'
      }}></div>
      <div style={{
        width: '3px',
        height: '3px',
        background: 'white',
        borderRadius: '50%',
        position: 'absolute',
        top: '6px',
        left: '8px'
      }}></div>
    </div>
  );

  const CodeIcon = () => (
    <div style={{
      display: 'inline-block',
      width: '16px',
      height: '16px',
      marginRight: '8px',
      position: 'relative',
      verticalAlign: 'middle'
    }}>
      <div style={{
        width: '12px',
        height: '14px',
        border: '2px solid #7c3aed',
        borderRadius: '2px',
        position: 'absolute',
        top: '0',
        left: '2px'
      }}>
        <div style={{
          width: '2px',
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
          top: '2px',
          right: '2px'
        }}></div>
        <div style={{
          width: '3px',
          height: '1px',
          background: '#7c3aed',
          position: 'absolute',
          top: '5px',
          left: '2px'
        }}></div>
        <div style={{
          width: '5px',
          height: '1px',
          background: '#7c3aed',
          position: 'absolute',
          top: '8px',
          left: '2px'
        }}></div>
      </div>
    </div>
  );

  return (
    <div style={{ 
      background: 'white', 
      padding: '2.5rem', 
      borderRadius: '20px', 
      maxWidth: '700px',
      boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #f3f4f6'
    }}>
      <h2 style={{ 
        fontSize: '1.8rem', 
        fontWeight: '700', 
        marginBottom: '0.5rem', 
        color: '#1f2937',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            position: 'relative'
          }}>
            <div style={{
              width: '2px',
              height: '12px',
              background: 'white',
              position: 'absolute',
              top: '2px',
              left: '7px'
            }}></div>
            <div style={{
              width: '12px',
              height: '2px',
              background: 'white',
              position: 'absolute',
              top: '7px',
              left: '2px'
            }}></div>
          </div>
        </div>
        Add New Book
      </h2>
      <p style={{ 
        color: '#6b7280', 
        marginBottom: '2rem',
        fontSize: '1rem'
      }}>
        Add books to your inventory so NYU Madrid students can find them
      </p>

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

      {success && (
        <div style={{ 
          background: '#d1fae5', 
          color: '#065f46', 
          padding: '1rem 1.25rem', 
          borderRadius: '12px', 
          marginBottom: '1.5rem',
          border: '1px solid #a7f3d0',
          fontSize: '0.95rem'
        }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label style={labelStyle}>
            <BookIcon />
            Book Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g., Psychology: The Science of Mind and Behaviour"
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = '#7c3aed';
              e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = 'none';
            }}
            disabled={isLoading}
          />
        </div>

        <div>
          <label style={labelStyle}>
            <PersonIcon />
            Author *
          </label>
          <input
            type="text"
            name="author"
            value={formData.author}
            onChange={handleInputChange}
            placeholder="e.g., Passer & Smith"
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = '#7c3aed';
              e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = 'none';
            }}
            disabled={isLoading}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>
              <MoneyIcon />
              Price (€) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="45.90"
              step="0.01"
              min="0"
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = '#7c3aed';
                e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
              disabled={isLoading}
            />
          </div>

          <div>
            <label style={labelStyle}>
              <BoxIcon />
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min="0"
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = '#7c3aed';
                e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>
            <TagIcon />
            Subject
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            placeholder="e.g., Psychology, Economics, Literature"
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = '#7c3aed';
              e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = 'none';
            }}
            disabled={isLoading}
          />
        </div>

        <div>
          <label style={labelStyle}>
            <CodeIcon />
            ISBN (Optional)
          </label>
          <input
            type="text"
            name="isbn"
            value={formData.isbn}
            onChange={handleInputChange}
            placeholder="9780077174446"
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = '#7c3aed';
              e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = 'none';
            }}
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            border: 'none',
            padding: '1.25rem 2rem',
            borderRadius: '12px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            marginTop: '0.5rem',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
          onMouseOver={(e) => !isLoading && (e.target.style.transform = 'translateY(-1px)')}
          onMouseOut={(e) => !isLoading && (e.target.style.transform = 'translateY(0)')}
        >
          <div style={{
            width: '16px',
            height: '16px',
            position: 'relative'
          }}>
            <div style={{
              width: '12px',
              height: '8px',
              border: '2px solid white',
              borderRadius: '2px',
              position: 'absolute',
              top: '4px',
              left: '2px'
            }}>
              <div style={{
                width: '4px',
                height: '1px',
                background: 'white',
                position: 'absolute',
                top: '2px',
                left: '4px'
              }}></div>
            </div>
          </div>
          {isLoading ? 'Adding Book...' : 'Add Book to Inventory'}
        </button>
      </form>
    </div>
  );
};

export default AddBookForm;