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
    padding: '0.75rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '1rem',
    marginBottom: '1rem'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '600',
    color: '#374151'
  };

  return (
    <div style={{ background: 'white', padding: '2rem', borderRadius: '10px', maxWidth: '600px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1f2937' }}>
        ➕ Add New Book
      </h2>

      {error && (
        <div style={{ 
          background: '#fee2e2', 
          color: '#dc2626', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1rem',
          border: '1px solid #fecaca'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ 
          background: '#d1fae5', 
          color: '#065f46', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1rem',
          border: '1px solid #a7f3d0'
        }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label style={labelStyle}>📚 Book Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g., Psychology: The Science of Mind and Behaviour"
            style={inputStyle}
            disabled={isLoading}
          />
        </div>

        <div>
          <label style={labelStyle}>👤 Author *</label>
          <input
            type="text"
            name="author"
            value={formData.author}
            onChange={handleInputChange}
            placeholder="e.g., Passer & Smith"
            style={inputStyle}
            disabled={isLoading}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>💰 Price (€) *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="45.90"
              step="0.01"
              min="0"
              style={inputStyle}
              disabled={isLoading}
            />
          </div>

          <div>
            <label style={labelStyle}>📦 Quantity</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min="0"
              style={inputStyle}
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>🏷️ Subject</label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            placeholder="e.g., Psychology, Economics, Literature"
            style={inputStyle}
            disabled={isLoading}
          />
        </div>

        <div>
          <label style={labelStyle}>📖 ISBN (Optional)</label>
          <input
            type="text"
            name="isbn"
            value={formData.isbn}
            onChange={handleInputChange}
            placeholder="9780077174446"
            style={inputStyle}
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
            padding: '1rem',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            marginTop: '0.5rem'
          }}
        >
          {isLoading ? 'Adding Book...' : '💾 Add Book to Inventory'}
        </button>
      </form>
    </div>
  );
};

export default AddBookForm;