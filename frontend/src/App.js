// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import FindBooksPage from './pages/FindBooksPage';
import NewsletterPage from './pages/NewsletterPage';
import ResultsPage from './pages/ResultsPage';
import './App.css';

// OPTIONAL: logo support (fallbacks to text if missing)
let LogoSrc = null;
try {
  // eslint-disable-next-line global-require
  LogoSrc = require('./assets/mbf-logo.svg');
} catch {
  // fallback if no logo yet
}

// --------------- Navigation ---------------
const Navigation = ({ user, onLogout }) => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navLinkStyle = (path) => ({
    color: isActive(path) ? '#ffffff' : '#e7e7ff',
    textDecoration: 'none',
    padding: '0.65rem 1.1rem',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    background: isActive(path) ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
    border: isActive(path) ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid transparent',
    display: 'inline-block'
  });

  const hoverIn = (e, path) => {
    if (!isActive(path)) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
  };
  const hoverOut = (e, path) => {
    if (!isActive(path)) e.currentTarget.style.background = 'transparent';
  };

  return (
    <nav
      style={{
        background: 'linear-gradient(135deg, #57068C 0%, #7c3aed 60%, #8b5cf6 100%)',
        padding: '0.9rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          {/* Brand logo / wordmark */}
          <Link
            to="/"
            style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: '1.2rem',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              letterSpacing: '-0.02em',
            }}
            className="brand"
          >
            {LogoSrc ? (
              <img
                src={LogoSrc}
                alt="Madrid Book Finder"
                style={{ height: 34, width: 'auto', display: 'block' }}
              />
            ) : (
              <span
                style={{
                  padding: '6px 10px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,.15)',
                  fontWeight: 800,
                }}
              >
                MBF
              </span>
            )}
            <span className="brand-text">Madrid Book Finder</span>
          </Link>

          {/* Navigation links */}
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <Link
              to="/"
              style={navLinkStyle('/')}
              onMouseOver={(e) => hoverIn(e, '/')}
              onMouseOut={(e) => hoverOut(e, '/')}
            >
              Home
            </Link>

            <Link
              to="/find-books"
              style={navLinkStyle('/find-books')}
              onMouseOver={(e) => hoverIn(e, '/find-books')}
              onMouseOut={(e) => hoverOut(e, '/find-books')}
            >
              Find My Books
            </Link>

            <Link
              to="/newsletter"
              style={navLinkStyle('/newsletter')}
              onMouseOver={(e) => hoverIn(e, '/newsletter')}
              onMouseOut={(e) => hoverOut(e, '/newsletter')}
            >
              Newsletter
            </Link>

            {user ? (
              <Link
                to="/admin"
                style={navLinkStyle('/admin')}
                onMouseOver={(e) => hoverIn(e, '/admin')}
                onMouseOut={(e) => hoverOut(e, '/admin')}
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                style={navLinkStyle('/login')}
                onMouseOver={(e) => hoverIn(e, '/login')}
                onMouseOut={(e) => hoverOut(e, '/login')}
              >
                Admin Login
              </Link>
            )}
          </div>
        </div>

        {/* Logged-in user section */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                background: 'rgba(255, 255, 255, 0.12)',
                padding: '0.45rem 0.9rem',
                borderRadius: '999px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
              }}
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                }}
              >
                {user.name.charAt(0)}
              </div>
              <span
                style={{
                  color: '#f3f4f6',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                }}
              >
                {user.name}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="btn btn-outline"
              style={{ color: '#fff', borderColor: 'rgba(255,255,255,.35)' }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

// --------------- App ---------------
function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => setUser(userData);
  const handleLogout = () => setUser(null);

  return (
    <Router>
      <div
        className="App"
        style={{
          minHeight: '100vh',
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <Navigation user={user} onLogout={handleLogout} />

        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/find-books" element={<FindBooksPage />} />
            <Route path="/newsletter" element={<NewsletterPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <LoginPage onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/admin"
              element={
                user ? (
                  <AdminPage user={user} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
