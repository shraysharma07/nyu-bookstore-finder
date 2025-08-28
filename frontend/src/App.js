import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import './App.css';

function App() {
  const [user, setUser] = useState(null); // null = not logged in

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Router>
      <div className="App">
        {/* Navigation Bar */}
        <nav style={{ 
          background: '#1f2937', 
          padding: '1rem 0',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto', 
            padding: '0 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              <Link 
                to="/" 
                style={{ 
                  color: 'white', 
                  textDecoration: 'none', 
                  fontSize: '1.2rem', 
                  fontWeight: '700' 
                }}
              >
                📚 Madrid Book Finder
              </Link>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Link 
                  to="/" 
                  style={{ 
                    color: '#d1d5db', 
                    textDecoration: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#374151'}
                  onMouseOut={(e) => e.target.style.background = 'transparent'}
                >
                  🏠 Home
                </Link>
                
                {user ? (
                  <Link 
                    to="/admin" 
                    style={{ 
                      color: '#d1d5db', 
                      textDecoration: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#374151'}
                    onMouseOut={(e) => e.target.style.background = 'transparent'}
                  >
                    📊 Dashboard
                  </Link>
                ) : (
                  <Link 
                    to="/login" 
                    style={{ 
                      color: '#d1d5db', 
                      textDecoration: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#374151'}
                    onMouseOut={(e) => e.target.style.background = 'transparent'}
                  >
                    🔐 Bookstore Login
                  </Link>
                )}
              </div>
            </div>
            
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: '#d1d5db', fontSize: '0.9rem' }}>
                  Welcome, {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Main Content */}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          
          {/* Login Route - redirect to admin if already logged in */}
          <Route 
            path="/login" 
            element={
              user ? 
                <Navigate to="/admin" replace /> : 
                <LoginPage onLogin={handleLogin} />
            } 
          />
          
          {/* Protected Admin Route - redirect to login if not logged in */}
          <Route 
            path="/admin" 
            element={
              user ? 
                <AdminPage user={user} onLogout={handleLogout} /> : 
                <Navigate to="/login" replace />
            } 
          />
          
          {/* Catch-all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;