// frontend/src/pages/AdminPage.js
// librarian-only dashboard: just the PDF parser (CatalogUploader)
// i keep the same flow, just cleaned styles w/ my global classes and set the page title

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CatalogUploader from '../components/CatalogUploader';

const AdminPage = () => {
  const navigate = useNavigate();

  // route guard: if no token, bounce to login
  useEffect(() => {
    const token = localStorage.getItem('nyu_token');
    if (!token) navigate('/login', { replace: true });
  }, [navigate]);

  // set a clean tab title for this page
  useEffect(() => {
    const prev = document.title;
    document.title = 'Admin • NYU Bookstore Finder';
    return () => { document.title = prev; };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('nyu_token');
    navigate('/login', { replace: true });
  };

  return (
    <div>
      {/* Header */}
      <header style={{ background:'#fff', borderBottom:'1px solid var(--line)' }}>
        <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.25rem 0' }}>
          <div>
            <h1 style={{ fontSize:'1.6rem', fontWeight:900, margin:0, color:'#111827' }}>
              Librarian · Course Catalog Uploader
            </h1>
            <p className="help" style={{ marginTop:6 }}>
              Upload the latest PDF and i’ll parse teachers, books, and classes for the site.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-outline"
            style={{ borderColor:'#fecaca', color:'#b91c1c' }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#fff5f5'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="section">
        <div className="container">
          <section className="card">
            <h2 style={{ margin:0 }}>Upload Course Catalog (PDF)</h2>
            <p className="help" style={{ margin:'0.5rem 0 1.25rem' }}>
              I only accept PDFs. Max 10 MB. I’ll show a success summary after parsing.
            </p>

            {/* my PDF parser component (unchanged behavior) */}
            <CatalogUploader
              onDataExtracted={(data) => {
                // just a preview log for me so i can verify quickly
                try {
                  const sample = Array.isArray(data) ? data.slice(0, 2) : data;
                  // eslint-disable-next-line no-console
                  console.log('catalog parsed (preview):', sample);
                } catch (e) {
                  // eslint-disable-next-line no-console
                  console.log('catalog parsed');
                }
              }}
            />
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
