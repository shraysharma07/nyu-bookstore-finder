// frontend/src/pages/LoginPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Api from '../services/api';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ type: 'idle', msg: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const prev = document.title;
    document.title = 'Admin Login • Madrid Book Finder';
    return () => { document.title = prev; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setStatus({ type: 'error', msg: 'Enter username and password' });
      return;
    }
    setStatus({ type: 'pending', msg: '' });

    try {
      const json = await Api.login(username, password);

      if (!json?.ok || !json?.token) throw new Error('login_failed');

      localStorage.setItem('nyu_token', json.token);
      localStorage.setItem('nyu_admin_name', username || 'Admin');

      if (typeof onLogin === 'function') onLogin({ role: 'librarian', username });

      setStatus({ type: 'success', msg: 'Signed in' });
      navigate('/admin', { replace: true });
    } catch (err) {
      console.error('Login error', err);
      setStatus({ type: 'error', msg: 'Invalid username or password' });
    }
  };

  const isLoading = status.type === 'pending';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        padding: '3rem',
        borderRadius: '20px',
        boxShadow: '0 20px 40px -4px rgba(0, 0, 0, 0.1)',
        maxWidth: '450px',
        width: '100%',
        border: '1px solid #f3f4f6'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: '60px', height: '72px',
            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            margin: '0 auto 1.5rem',
            position: 'relative', transform: 'rotate(-5deg)'
          }}>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              width: '30px', height: '36px',
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              transform: 'translate(-50%, -50%) rotate(10deg)'
            }} />
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1f2937', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
            Admin Login
          </h1>
          <p style={{ color: '#6b7280' }}>
            Upload the latest course catalog PDF for the site
          </p>
        </div>

        {status.type === 'error' && (
          <div style={{
            background: '#fee2e2', color: '#dc2626',
            padding: '1rem 1.25rem', borderRadius: '12px',
            marginBottom: '1.5rem', border: '1px solid #fecaca',
            fontSize: '0.95rem'
          }}>
            {status.msg || 'Login failed'}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            placeholder="Enter admin username"
            style={{
              width: '100%', padding: '1rem 1.25rem', border: '2px solid #e5e7eb', borderRadius: 12,
              fontSize: '1rem', transition: 'all 0.2s ease', fontFamily: 'inherit'
            }}
            onFocus={(e) => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
            disabled={isLoading}
          />

          <label style={{ display: 'block', margin: '1rem 0 0.5rem', fontWeight: 600, color: '#374151' }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="Enter password"
            style={{
              width: '100%', padding: '1rem 1.25rem', border: '2px solid #e5e7eb', borderRadius: 12,
              fontSize: '1rem', transition: 'all 0.2s ease', fontFamily: 'inherit'
            }}
            onFocus={(e) => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #7c3aed, #4c1d95)',
              color: 'white', border: 'none', padding: '1.1rem 1.25rem',
              borderRadius: 12, fontSize: '1.05rem', fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease',
              marginTop: '1rem'
            }}
            onMouseOver={(e) => !isLoading && (e.target.style.transform = 'translateY(-1px)')}
            onMouseOut={(e) => !isLoading && (e.target.style.transform = 'translateY(0)')}
          >
            {isLoading ? 'Signing in…' : 'Sign In to Dashboard'}
          </button>

          <div aria-live="polite" style={{ marginTop: 10, fontSize: 14 }}>
            {status.type === 'success' && <span style={{ color: '#065f46' }}>✅ Signed in</span>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
