import React, { useState } from 'react';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate login - your roommate will replace this with real authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Demo credentials - remove when real auth is ready
      if (username === 'antonio' && password === 'books123') {
        onLogin({
          id: 1,
          name: 'Antonio Machado Books',
          username: 'antonio'
        });
      } else if (username === 'pasajes' && password === 'books123') {
        onLogin({
          id: 2,
          name: 'Pasajes Internacional',
          username: 'pasajes'
        });
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
        {/* Header with torch logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: '60px',
            height: '72px',
            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            margin: '0 auto 1.5rem',
            position: 'relative',
            transform: 'rotate(-5deg)'
          }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '30px',
              height: '36px',
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              transform: 'translate(-50%, -50%) rotate(10deg)'
            }}></div>
          </div>
          
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '800', 
            color: '#1f2937', 
            marginBottom: '0.5rem',
            letterSpacing: '-0.025em'
          }}>
            Bookstore Login
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1rem' }}>
            Manage your inventory and connect with NYU students
          </p>
        </div>

        {error && (
          <div style={{ 
            background: '#fee2e2', 
            color: '#dc2626', 
            padding: '1rem 1.25rem', 
            borderRadius: '12px', 
            marginBottom: '1.5rem',
            border: '1px solid #fecaca',
            fontSize: '0.95rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem', 
              fontWeight: '600', 
              color: '#374151',
              fontSize: '1rem'
            }}>
              <div style={{
                display: 'inline-block',
                width: '16px',
                height: '16px',
                marginRight: '8px',
                position: 'relative',
                verticalAlign: 'middle'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid #7c3aed',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '0',
                  left: '2px'
                }}>
                  <div style={{
                    width: '4px',
                    height: '4px',
                    background: '#7c3aed',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '2px',
                    left: '2px'
                  }}></div>
                </div>
                <div style={{
                  width: '8px',
                  height: '6px',
                  border: '2px solid #7c3aed',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  position: 'absolute',
                  bottom: '0',
                  left: '4px'
                }}></div>
              </div>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your bookstore username"
              style={{
                width: '100%',
                padding: '1rem 1.25rem',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#7c3aed';
                e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
              disabled={isLoading}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem', 
              fontWeight: '600', 
              color: '#374151',
              fontSize: '1rem'
            }}>
              <div style={{
                display: 'inline-block',
                width: '16px',
                height: '16px',
                marginRight: '8px',
                position: 'relative',
                verticalAlign: 'middle'
              }}>
                <div style={{
                  width: '12px',
                  height: '8px',
                  border: '2px solid #7c3aed',
                  borderRadius: '3px',
                  position: 'absolute',
                  top: '4px',
                  left: '2px'
                }}>
                  <div style={{
                    width: '2px',
                    height: '4px',
                    background: '#7c3aed',
                    borderRadius: '1px',
                    position: 'absolute',
                    top: '0',
                    left: '1px',
                    transform: 'translateY(-2px)'
                  }}></div>
                  <div style={{
                    width: '2px',
                    height: '4px',
                    background: '#7c3aed',
                    borderRadius: '1px',
                    position: 'absolute',
                    top: '0',
                    right: '1px',
                    transform: 'translateY(-2px)'
                  }}></div>
                </div>
              </div>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '1rem 1.25rem',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#7c3aed';
                e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #7c3aed, #4c1d95)',
              color: 'white',
              border: 'none',
              padding: '1.25rem 2rem',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit'
            }}
            onMouseOver={(e) => !isLoading && (e.target.style.transform = 'translateY(-1px)')}
            onMouseOut={(e) => !isLoading && (e.target.style.transform = 'translateY(0)')}
          >
            {isLoading ? 'Signing in...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div style={{ 
          marginTop: '2rem', 
          padding: '1.5rem', 
          background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', 
          borderRadius: '12px', 
          fontSize: '0.9rem', 
          color: '#6b7280',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
            Demo Accounts for Testing:
          </div>
          <div style={{ marginBottom: '0.25rem' }}>
            <strong>antonio</strong> / books123
          </div>
          <div>
            <strong>pasajes</strong> / books123
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;