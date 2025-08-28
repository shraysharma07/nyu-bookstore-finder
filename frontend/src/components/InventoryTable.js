import React, { useState } from 'react';

const InventoryTable = ({ inventory, onDelete, onUpdate }) => {
  const [editingBook, setEditingBook] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const handleEditClick = (book) => {
    setEditingBook(book.id);
    setEditFormData({ ...book });
  };

  const handleEditCancel = () => {
    setEditingBook(null);
    setEditFormData({});
  };

  const handleEditSave = () => {
    onUpdate(editFormData);
    setEditingBook(null);
    setEditFormData({});
  };

  const handleDeleteClick = (book) => {
    if (window.confirm(`Are you sure you want to delete "${book.title}"?`)) {
      onDelete(book.id);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (inventory.length === 0) {
    return (
      <div style={{ background: 'white', padding: '3rem', borderRadius: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#6b7280' }}>No books in inventory</h2>
        <p style={{ color: '#9ca3af' }}>Add your first book using the "Add New Book" tab above.</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
          📦 Your Inventory ({inventory.length} books)
        </h2>
        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
          Click ✏️ to edit prices and quantities, or 🗑️ to remove books
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Book</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Author</th>
              <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Price</th>
              <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Qty</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Subject</th>
              <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((book) => (
              <tr key={book.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
                      {book.title}
                    </div>
                    {book.isbn && (
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        ISBN: {book.isbn}
                      </div>
                    )}
                  </div>
                </td>
                <td style={{ padding: '1rem', color: '#374151' }}>{book.author}</td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  {editingBook === book.id ? (
                    <input
                      type="number"
                      name="price"
                      value={editFormData.price}
                      onChange={handleInputChange}
                      style={{
                        width: '80px',
                        padding: '0.25rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        textAlign: 'center'
                      }}
                      step="0.01"
                      min="0"
                    />
                  ) : (
                    <span style={{ fontWeight: '600', color: '#059669' }}>€{book.price}</span>
                  )}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  {editingBook === book.id ? (
                    <input
                      type="number"
                      name="quantity"
                      value={editFormData.quantity}
                      onChange={handleInputChange}
                      style={{
                        width: '60px',
                        padding: '0.25rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        textAlign: 'center'
                      }}
                      min="0"
                    />
                  ) : (
                    <span style={{ 
                      background: book.quantity > 0 ? '#d1fae5' : '#fee2e2',
                      color: book.quantity > 0 ? '#065f46' : '#dc2626',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}>
                      {book.quantity > 0 ? book.quantity : 'Out of Stock'}
                    </span>
                  )}
                </td>
                <td style={{ padding: '1rem', color: '#6b7280' }}>
                  {book.subject || 'Not specified'}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  {editingBook === book.id ? (
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        onClick={handleEditSave}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                        title="Save changes"
                      >
                        💾
                      </button>
                      <button
                        onClick={handleEditCancel}
                        style={{
                          background: '#6b7280',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                        title="Cancel"
                      >
                        ❌
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleEditClick(book)}
                        style={{
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                        title="Edit book"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteClick(book)}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                        title="Delete book"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '1rem', background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
          💡 <strong>Tip:</strong> Keep your inventory updated so students can find your books easily!
        </div>
      </div>
    </div>
  );
};

export default InventoryTable;