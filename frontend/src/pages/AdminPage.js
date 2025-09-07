// frontend/src/pages/AdminPage.js
import React, { useState } from 'react';
import AddBookForm from '../components/AddBookForm';
import InventoryTable from '../components/InventoryTable';
import CatalogUploader from '../components/CatalogUploader';

const AdminPage = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [catalogData, setCatalogData] = useState(null);
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
    // Add the new book to inventory
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

  const handleCatalogData = (data) => {
    setCatalogData(data);
    console.log('Catalog data imported:', data);
  };

  const tabStyle = (isActive) => ({
    padding: '1rem 1.5rem',
    border: 'none',
    background: isActive ? '#7c3aed' : 'transparent',
    color: isActive ? 'white' : '#6b7280',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    marginRight: '0.5rem',
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  });

  // Custom icons
  const InventoryIcon = ({ isActive }) => (
    <div style={{
      width: '16px',
      height: '16px',
      position: 'relative'
    }}>
      <div style={{
        width: '12px',
        height: '10px',
        border: `2px solid ${isActive ? 'white' : '#6b7280'}`,
        borderRadius: '2px',
        position: 'absolute',
        top: '2px',
        left: '2px'
      }}>
        <div style={{
          width: '6px',
          height: '1px',
          background: isActive ? 'white' : '#6b7280',
          position: 'absolute',
          top: '2px',
          left: '3px'
        }}></div>
        <div style={{
          width: '4px',
          height: '1px',
          background: isActive ? 'white' : '#6b7280',
          position: 'absolute',
          top: '5px',
          left: '4px'
        }}></div>
      </div>
    </div>
  );

  const AddIcon = ({ isActive }) => (
    <div style={{
      width: '16px',
      height: '16px',
      position: 'relative'
    }}>
      <div style={{
        width: '2px',
        height: '12px',
        background: isActive ? 'white' : '#6b7280',
        position: 'absolute',
        top: '2px',
        left: '7px'
      }}></div>
      <div style={{
        width: '12px',
        height: '2px',
        background: isActive ? 'white' : '#6b7280',
        position: 'absolute',
        top: '7px',
        left: '2px'
      }}></div>
    </div>
  );

  const UploadIcon = ({ isActive }) => (
    <div style={{
      width: '16px',
      height: '16px',
      position: 'relative'
    }}>
      <div style={{
        width: '12px',
        height: '8px',
        border: `2px solid ${isActive ? 'white' : '#6b7280'}`,
        borderRadius: '2px 2px 0 0',
        borderBottom: 'none',
        position: 'absolute',
        top: '6px',
        left: '2px'
      }}></div>
      <div style={{
        width: '2px',
        height: '6px',
        background: isActive ? 'white' : '#6b7280',
        position: 'absolute',
        top: '1px',
        left: '7px'
      }}></div>
      <div style={{
        width: '0',
        height: '0',
        borderLeft: `3px solid transparent`,
        borderRight: `3px solid transparent`,
        borderBottom: `4px solid ${isActive ? 'white' : '#6b7280'}`,
        position: 'absolute',
        top: '0',
        left: '5px'
      }}></div>
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f8fafc',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* Header */}
      <header style={{ 
        background: 'white', 
        borderBottom: '1px solid #e5e7eb', 
        padding: '1.5rem 0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '0 20px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '0.5rem'
            }}>
              {/* Torch logo */}
              <div style={{
                width: '32px',
                height: '38px',
                background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                position: 'relative',
                transform: 'rotate(-5deg)'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '16px',
                  height: '19px',
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                  transform: 'translate(-50%, -50%) rotate(10deg)'
                }}></div>
              </div>
              
              <h1 style={{ 
                fontSize: '1.8rem', 
                fontWeight: '800', 
                color: '#1f2937',
                letterSpacing: '-0.025em'
              }}>
                {user.name} - Dashboard
              </h1>
            </div>
            <p style={{ color: '#6b7280', fontSize: '1rem', marginLeft: '3rem' }}>
              Manage your bookstore inventory and connect with students
            </p>
          </div>
          <button
            onClick={onLogout}
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <nav style={{ padding: '1.5rem 0', display: 'flex', gap: '0.5rem' }}>
            <button
              style={tabStyle(activeTab === 'inventory')}
              onClick={() => setActiveTab('inventory')}
              onMouseOver={(e) => activeTab !== 'inventory' && (e.target.style.background = 'rgba(124, 58, 237, 0.05)')}
              onMouseOut={(e) => activeTab !== 'inventory' && (e.target.style.background = 'transparent')}
            >
              <InventoryIcon isActive={activeTab === 'inventory'} />
              My Inventory ({inventory.length})
            </button>
            <button
              style={tabStyle(activeTab === 'add-book')}
              onClick={() => setActiveTab('add-book')}
              onMouseOver={(e) => activeTab !== 'add-book' && (e.target.style.background = 'rgba(124, 58, 237, 0.05)')}
              onMouseOut={(e) => activeTab !== 'add-book' && (e.target.style.background = 'transparent')}
            >
              <AddIcon isActive={activeTab === 'add-book'} />
              Add New Book
            </button>
            <button
              style={tabStyle(activeTab === 'catalog')}
              onClick={() => setActiveTab('catalog')}
              onMouseOver={(e) => activeTab !== 'catalog' && (e.target.style.background = 'rgba(124, 58, 237, 0.05)')}
              onMouseOut={(e) => activeTab !== 'catalog' && (e.target.style.background = 'transparent')}
            >
              <UploadIcon isActive={activeTab === 'catalog'} />
              Upload Catalog
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 20px' }}>
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

        {activeTab === 'catalog' && (
          <CatalogUploader onDataExtracted={handleCatalogData} />
        )}
      </div>
    </div>
  );
};

export default AdminPage;