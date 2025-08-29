import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import './App.css';

// Navigation component
const Navigation = ({ user, onLogout }) => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinkStyle = (path) => ({
    color: isActive(path) ? '#ffffff' : '#d1d5db',
    textDecoration: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    background: isActive(path) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    backdropFilter: isActive(path) ? 'blur(10px)' : 'none',
    border: isActive(path) ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent'
  });

  return (
    <nav style={{ 
      background: 'linear-gradient(135deg, #1f2937, #374151)',
      padding: '1rem 0',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
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
          {/* Logo with NYU torch (flame icon) */}
          <Link 
            to="/" 
            style={{ 
              color: 'white', 
              textDecoration: 'none', 
              fontSize: '1.4rem', 
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              letterSpacing: '-0.025em'
            }}
          >
            <div style={{
              width: '28px',
              height: '32px',
              background: 'linear-gradient(135deg, #f59e0b, #f97316)',
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              position: 'relative',
              transform: 'rotate(-5deg)'
            }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '12px',
                height: '16px',
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                transform: 'translate(-50%, -50%) rotate(10deg)'
              }}></div>
            </div>
            Madrid Book Finder
          </Link>
          
          {/* Navigation Links */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link 
              to="/" 
              style={navLinkStyle('/')}
              onMouseOver={(e) => !isActive('/') && (e.target.style.background = 'rgba(255, 255, 255, 0.05)')}
              onMouseOut={(e) => !isActive('/') && (e.target.style.background = 'transparent')}
            >
              Home
            </Link>
            
            {user ? (
              <Link 
                to="/admin" 
                style={navLinkStyle('/admin')}
                onMouseOver={(e) => !isActive('/admin') && (e.target.style.background = 'rgba(255, 255, 255, 0.05)')}
                onMouseOut={(e) => !isActive('/admin') && (e.target.style.background = 'transparent')}
              >
                Dashboard
              </Link>
            ) : (
              <Link 
                to="/login" 
                style={navLinkStyle('/login')}
                onMouseOver={(e) => !isActive('/login') && (e.target.style.background = 'rgba(255, 255, 255, 0.05)')}
                onMouseOut={(e) => !isActive('/login') && (e.target.style.background = 'transparent')}
              >
                Store Login
              </Link>
            )}
          </div>
        </div>
        
        {/* User Info & Logout */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}>
                {user.name.charAt(0)}
              </div>
              <span style={{ color: '#f3f4f6', fontSize: '0.95rem', fontWeight: '500' }}>
                {user.name}
              </span>
            </div>
            <button
              onClick={onLogout}
              style={{
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: 'white',
                border: 'none',
                padding: '0.6rem 1.2rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                transition: 'all 0.2s ease'
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
        )}
      </div>
    </nav>
  );
};

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
      <div className="App" style={{ 
        minHeight: '100vh',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: '#f8fafc'
      }}>
        <Navigation user={user} onLogout={handleLogout} />

        {/* Main Content */}
        <main>
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
        </main>

        {/* NYU Torch decorative elements */}
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '40px',
          height: '48px',
          background: 'linear-gradient(135deg, #f59e0b, #f97316)',
          borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
          opacity: '0.1',
          pointerEvents: 'none',
          zIndex: -1,
          transform: 'rotate(-10deg)'
        }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '20px',
            height: '24px',
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            transform: 'translate(-50%, -50%) rotate(15deg)'
          }}></div>
        </div>
        
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '20px',
          width: '30px',
          height: '36px',
          background: 'linear-gradient(135deg, #f59e0b, #f97316)',
          borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
          opacity: '0.08',
          pointerEvents: 'none',
          zIndex: -1,
          transform: 'rotate(15deg)'
        }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '15px',
            height: '18px',
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            transform: 'translate(-50%, -50%) rotate(-20deg)'
          }}></div>
        </div>
      </div>
    </Router>
  );
}

export default App;