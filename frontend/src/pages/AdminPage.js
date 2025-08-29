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

  const AnalyticsIcon = ({ isActive }) => (
    <div style={{
      width: '16px',
      height: '16px',
      position: 'relative'
    }}>
      <div style={{
        width: '3px',
        height: '8px',
        background: isActive ? 'white' : '#6b7280',
        position: 'absolute',
        bottom: '2px',
        left: '2px'
      }}></div>
      <div style={{
        width: '3px',
        height: '12px',
        background: isActive ? 'white' : '#6b7280',
        position: 'absolute',
        bottom: '2px',
        left: '6px'
      }}></div>
      <div style={{
        width: '3px',
        height: '6px',
        background: isActive ? 'white' : '#6b7280',
        position: 'absolute',
        bottom: '2px',
        left: '10px'
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
              style={tabStyle(activeTab === 'analytics')}
              onClick={() => setActiveTab('analytics')}
              onMouseOver={(e) => activeTab !== 'analytics' && (e.target.style.background = 'rgba(124, 58, 237, 0.05)')}
              onMouseOut={(e) => activeTab !== 'analytics' && (e.target.style.background = 'transparent')}
            >
              <AnalyticsIcon isActive={activeTab === 'analytics'} />
              Analytics
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

        {activeTab === 'analytics' && (
          <div style={{ 
            background: 'white', 
            padding: '3rem', 
            borderRadius: '20px', 
            textAlign: 'center',
            boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #f3f4f6'
          }}>
            {/* Analytics placeholder icon */}
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 2rem',
              position: 'relative'
            }}>
              <div style={{
                width: '12px',
                height: '40px',
                background: 'linear-gradient(135deg, #e5e7eb, #d1d5db)',
                position: 'absolute',
                bottom: '10px',
                left: '10px'
              }}></div>
              <div style={{
                width: '12px',
                height: '60px',
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                position: 'absolute',
                bottom: '10px',
                left: '25px'
              }}></div>
              <div style={{
                width: '12px',
                height: '30px',
                background: 'linear-gradient(135deg, #e5e7eb, #d1d5db)',
                position: 'absolute',
                bottom: '10px',
                left: '40px'
              }}></div>
              <div style={{
                width: '12px',
                height: '50px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                position: 'absolute',
                bottom: '10px',
                left: '55px'
              }}></div>
            </div>
            
            <h2 style={{ 
              fontSize: '1.8rem', 
              fontWeight: '700',
              marginBottom: '1rem',
              color: '#1f2937'
            }}>
              Analytics Coming Soon
            </h2>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '1.1rem',
              lineHeight: '1.6',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              Track which books students search for most, monitor your inventory performance, 
              and discover new opportunities to serve NYU Madrid students better.
            </p>
            
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ 
                fontSize: '1rem', 
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Features in Development:
              </h3>
              <div style={{ color: '#6b7280', fontSize: '0.95rem', textAlign: 'left' }}>
                <div>• Most searched books by students</div>
                <div>• Your inventory turnover rates</div>
                <div>• Popular course materials by semester</div>
                <div>• Revenue tracking and trends</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;