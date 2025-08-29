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

  // Custom icons
  const EditIcon = () => (
    <div style={{
      width: '14px',
      height: '14px',
      position: 'relative',
      display: 'inline-block'
    }}>
      <div style={{
        width: '8px',
        height: '2px',
        background: 'currentColor',
        transform: 'rotate(45deg)',
        position: 'absolute',
        top: '3px',
        left: '1px'
      }}></div>
      <div style={{
        width: '2px',
        height: '2px',
        background: 'currentColor',
        position: 'absolute',
        top: '1px',
        left: '1px'
      }}></div>
      <div style={{
        width: '6px',
        height: '2px',
        border: '1px solid currentColor',
        borderTop: 'none',
        position: 'absolute',
        bottom: '1px',
        left: '2px'
      }}></div>
    </div>
  );

  const DeleteIcon = () => (
    <div style={{
      width: '14px',
      height: '14px',
      position: 'relative',
      display: 'inline-block'
    }}>
      <div style={{
        width: '10px',
        height: '12px',
        border: '1px solid currentColor',
        borderTop: 'none',
        borderRadius: '0 0 2px 2px',
        position: 'absolute',
        bottom: '0',
        left: '2px'
      }}></div>
      <div style={{
        width: '12px',
        height: '2px',
        background: 'currentColor',
        position: 'absolute',
        top: '2px',
        left: '1px'
      }}></div>
      <div style={{
        width: '4px',
        height: '2px',
        background: 'currentColor',
        position: 'absolute',
        top: '0',
        left: '5px'
      }}></div>
      <div style={{
        width: '1px',
        height: '6px',
        background: 'currentColor',
        position: 'absolute',
        top: '5px',
        left: '5px'
      }}></div>
      <div style={{
        width: '1px',
        height: '6px',
        background: 'currentColor',
        position: 'absolute',
        top: '5px',
        left: '8px'
      }}></div>
    </div>
  );

  const SaveIcon = () => (
    <div style={{
      width: '14px',
      height: '14px',
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
        left: '8px'
      }}></div>
      <div style={{
        width: '2px',
        height: '3px',
        background: 'currentColor',
        transform: 'rotate(-45deg)',
        position: 'absolute',
        top: '6px',
        left: '4px'
      }}></div>
    </div>
  );

  const CancelIcon = () => (
    <div style={{
      width: '14px',
      height: '14px',
      position: 'relative',
      display: 'inline-block'
    }}>
      <div style={{
        width: '2px',
        height: '10px',
        background: 'currentColor',
        transform: 'rotate(45deg)',
        position: 'absolute',
        top: '2px',
        left: '6px'
      }}></div>
      <div style={{
        width: '2px',
        height: '10px',
        background: 'currentColor',
        transform: 'rotate(-45deg)',
        position: 'absolute',
        top: '2px',
        left: '6px'
      }}></div>
    </div>
  );

  if (inventory.length === 0) {
    return (
      <div style={{ 
        background: 'white', 
        padding: '4rem', 
        borderRadius: '20px', 
        textAlign: 'center',
        boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #f3f4f6'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          margin: '0 auto 2rem',
          position: 'relative'
        }}>
          <div style={{
            width: '60px',
            height: '72px',
            border: '4px solid #d1d5db',
            borderRadius: '4px',
            position: 'absolute',
            top: '14px',
            left: '20px'
          }}>
            <div style={{
              width: '30px',
              height: '2px',
              background: '#d1d5db',
              position: 'absolute',
              top: '15px',
              left: '15px'
            }}></div>
            <div style={{
              width: '20px',
              height: '2px',
              background: '#d1d5db',
              position: 'absolute',
              top: '25px',
              left: '20px'
            }}></div>
            <div style={{
              width: '25px',
              height: '2px',
              background: '#d1d5db',
              position: 'absolute',
              top: '35px',
              left: '17px'
            }}></div>
          </div>
        </div>
        <h2 style={{ 
          fontSize: '1.8rem', 
          fontWeight: '700',
          marginBottom: '1rem', 
          color: '#6b7280' 
        }}>
          No books in inventory
        </h2>
        <p style={{ 
          color: '#9ca3af', 
          fontSize: '1.1rem',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          Add your first book using the "Add New Book" tab above to start connecting with NYU Madrid students.
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '20px', 
      overflow: 'hidden', 
      boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #f3f4f6'
    }}>
      <div style={{ 
        padding: '2rem', 
        borderBottom: '1px solid #e5e7eb',
        background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              position: 'relative'
            }}>
              <div style={{
                width: '14px',
                height: '16px',
                border: '2px solid white',
                borderRadius: '2px',
                position: 'absolute',
                top: '2px',
                left: '3px'
              }}>
                <div style={{
                  width: '6px',
                  height: '1px',
                  background: 'white',
                  position: 'absolute',
                  top: '3px',
                  left: '4px'
                }}></div>
                <div style={{
                  width: '4px',
                  height: '1px',
                  background: 'white',
                  position: 'absolute',
                  top: '6px',
                  left: '5px'
                }}></div>
                <div style={{
                  width: '5px',
                  height: '1px',
                  background: 'white',
                  position: 'absolute',
                  top: '9px',
                  left: '4px'
                }}></div>
              </div>
            </div>
          </div>
          <div>
            <h2 style={{ 
              fontSize: '1.8rem', 
              fontWeight: '700', 
              color: '#1f2937',
              marginBottom: '0.25rem'
            }}>
              Your Inventory ({inventory.length} books)
            </h2>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '1rem'
            }}>
              Manage your book inventory and pricing
            </p>
          </div>
        </div>
        <div style={{ 
          fontSize: '0.95rem', 
          color: '#6b7280',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            position: 'relative'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              border: '1px solid #6b7280',
              borderRadius: '50%',
              position: 'absolute',
              top: '0',
              left: '5px'
            }}></div>
            <div style={{
              width: '1px',
              height: '6px',
              background: '#6b7280',
              position: 'absolute',
              bottom: '0',
              left: '7px'
            }}></div>
          </div>
          <strong>Tip:</strong> Click Edit to update prices and quantities, or Delete to remove books
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ 
                padding: '1.25rem', 
                textAlign: 'left', 
                fontWeight: '600', 
                color: '#374151',
                fontSize: '0.95rem'
              }}>
                Book Details
              </th>
              <th style={{ 
                padding: '1.25rem', 
                textAlign: 'left', 
                fontWeight: '600', 
                color: '#374151',
                fontSize: '0.95rem'
              }}>
                Author
              </th>
              <th style={{ 
                padding: '1.25rem', 
                textAlign: 'center', 
                fontWeight: '600', 
                color: '#374151',
                fontSize: '0.95rem'
              }}>
                Price
              </th>
              <th style={{ 
                padding: '1.25rem', 
                textAlign: 'center', 
                fontWeight: '600', 
                color: '#374151',
                fontSize: '0.95rem'
              }}>
                Stock
              </th>
              <th style={{ 
                padding: '1.25rem', 
                textAlign: 'left', 
                fontWeight: '600', 
                color: '#374151',
                fontSize: '0.95rem'
              }}>
                Subject
              </th>
              <th style={{ 
                padding: '1.25rem', 
                textAlign: 'center', 
                fontWeight: '600', 
                color: '#374151',
                fontSize: '0.95rem'
              }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((book, index) => (
              <tr key={book.id} style={{ 
                borderBottom: index < inventory.length - 1 ? '1px solid #f3f4f6' : 'none',
                transition: 'background-color 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ padding: '1.25rem', maxWidth: '300px' }}>
                  <div>
                    <div style={{ 
                      fontWeight: '600', 
                      color: '#1f2937', 
                      marginBottom: '0.5rem',
                      lineHeight: '1.4'
                    }}>
                      {book.title}
                    </div>
                    {book.isbn && (
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: '#6b7280',
                        background: '#f3f4f6',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        ISBN: {book.isbn}
                      </div>
                    )}
                  </div>
                </td>
                <td style={{ padding: '1.25rem', color: '#374151' }}>
                  {book.author}
                </td>
                <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                  {editingBook === book.id ? (
                    <input
                      type="number"
                      name="price"
                      value={editFormData.price}
                      onChange={handleInputChange}
                      style={{
                        width: '90px',
                        padding: '0.5rem',
                        border: '2px solid #7c3aed',
                        borderRadius: '6px',
                        textAlign: 'center',
                        fontSize: '0.9rem'
                      }}
                      step="0.01"
                      min="0"
                    />
                  ) : (
                    <span style={{ 
                      fontWeight: '600', 
                      color: '#059669',
                      fontSize: '1.1rem'
                    }}>
                      €{book.price}
                    </span>
                  )}
                </td>
                <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                  {editingBook === book.id ? (
                    <input
                      type="number"
                      name="quantity"
                      value={editFormData.quantity}
                      onChange={handleInputChange}
                      style={{
                        width: '70px',
                        padding: '0.5rem',
                        border: '2px solid #7c3aed',
                        borderRadius: '6px',
                        textAlign: 'center',
                        fontSize: '0.9rem'
                      }}
                      min="0"
                    />
                  ) : (
                    <span style={{ 
                      background: book.quantity > 0 ? '#d1fae5' : '#fee2e2',
                      color: book.quantity > 0 ? '#065f46' : '#dc2626',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      border: `1px solid ${book.quantity > 0 ? '#a7f3d0' : '#fecaca'}`
                    }}>
                      {book.quantity > 0 ? book.quantity : 'Out of Stock'}
                    </span>
                  )}
                </td>
                <td style={{ padding: '1.25rem', color: '#6b7280' }}>
                  <span style={{
                    background: '#f3f4f6',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem'
                  }}>
                    {book.subject || 'Not specified'}
                  </span>
                </td>
                <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                  {editingBook === book.id ? (
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        onClick={handleEditSave}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px'
                        }}
                        title="Save changes"
                      >
                        <SaveIcon />
                      </button>
                      <button
                        onClick={handleEditCancel}
                        style={{
                          background: '#6b7280',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px'
                        }}
                        title="Cancel"
                      >
                        <CancelIcon />
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
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          transition: 'background-color 0.2s ease'
                        }}
                        title="Edit book"
                        onMouseOver={(e) => e.target.style.background = '#2563eb'}
                        onMouseOut={(e) => e.target.style.background = '#3b82f6'}
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(book)}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          transition: 'background-color 0.2s ease'
                        }}
                        title="Delete book"
                        onMouseOver={(e) => e.target.style.background = '#dc2626'}
                        onMouseOut={(e) => e.target.style.background = '#ef4444'}
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ 
        padding: '1.5rem', 
        background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', 
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <div style={{
          width: '16px',
          height: '16px',
          position: 'relative'
        }}>
          <div style={{
            width: '14px',
            height: '14px',
            border: '2px solid #059669',
            borderRadius: '50%',
            position: 'absolute',
            top: '0',
            left: '1px'
          }}>
            <div style={{
              width: '2px',
              height: '4px',
              background: '#059669',
              transform: 'rotate(45deg)',
              position: 'absolute',
              top: '3px',
              left: '7px'
            }}></div>
            <div style={{
              width: '2px',
              height: '2px',
              background: '#059669',
              transform: 'rotate(-45deg)',
              position: 'absolute',
              top: '5px',
              left: '4px'
            }}></div>
          </div>
        </div>
        <div style={{ fontSize: '0.95rem', color: '#059669', fontWeight: '500' }}>
          <strong>Keep your inventory updated</strong> so students can find your books easily and know what's available!
        </div>
      </div>
    </div>
  );
};

export default InventoryTable;