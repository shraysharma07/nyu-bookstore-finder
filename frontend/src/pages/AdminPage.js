import React, { useState } from 'react';
import AddBookForm from '../components/AddBookForm';
import InventoryTable from '../components/InventoryTable';

const AdminPage = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [inventory, setInventory] = useState([
    // Demo inventory - your roommate will load this from database
    {
      id: 1,
      title: 'Psychology: The Science of Mind and Behaviour',
      author: 'Passer & Smith',
      isbn: '9780077174446',
      price: '45.90',
      quantity: 3,
      subject: 'Psychology',
      addedDate: '2025-08-20'
    },
    {
      id: 2,
      title: 'Principles of Economics',
      author: 'N. Gregory Mankiw',
      isbn: '9781337516853',
      price: '52.00',
      quantity: 1,
      subject: 'Economics',
      addedDate: '2025-08-18'
    }
  ]);

  const handleAddBook = (newBook) => {
    const book = {
      ...newBook,
      id: Date.now(),
      addedDate: new Date().toISOString().split('T')[0]
    };
    setInventory([...inventory, book]);
  };

  const handleDeleteBook = (bookId) => {
    setInventory(inventory.filter(book => book.id !== bookId));
  };

  const handleUpdateBook = (updatedBook) => {
    setInventory(inventory.map(book => 
      book.id === updatedBook.id ? updatedBook : book
    ));
  };

  const tabStyle = (isActive) => ({
    padding: '0.75rem 1.5rem',
    border: 'none',
    background: isActive ? '#7c3aed' : 'transparent',
    color: isActive ? 'white' : '#6b7280',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    marginRight: '0.5rem'
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '1rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
              📚 {user.name} - Admin Dashboard
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Manage your bookstore inventory</p>
          </div>
          <button
            onClick={onLogout}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Navigation */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <nav style={{ padding: '1rem 0' }}>
            <button
              style={tabStyle(activeTab === 'inventory')}
              onClick={() => setActiveTab('inventory')}
            >
              📦 My Inventory ({inventory.length})
            </button>
            <button
              style={tabStyle(activeTab === 'add-book')}
              onClick={() => setActiveTab('add-book')}
            >
              ➕ Add New Book
            </button>
            <button
              style={tabStyle(activeTab === 'analytics')}
              onClick={() => setActiveTab('analytics')}
            >
              📊 Analytics
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 20px' }}>
        {activeTab === 'inventory' && (
          <InventoryTable 
            inventory={inventory}
            onDelete={handleDeleteBook}
            onUpdate={handleUpdateBook}
          />
        )}

        {activeTab === 'add-book' && (
          <AddBookForm onAddBook={handleAddBook} />
        )}

        {activeTab === 'analytics' && (
          <div style={{ background: 'white', padding: '2rem', borderRadius: '10px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>📊 Coming Soon</h2>
            <p style={{ color: '#6b7280' }}>Analytics showing which books students search for most will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;