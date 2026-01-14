// src/pages/ResultsPage.js
import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BookstoreCard from '../components/BookstoreCard';

export default function ResultsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const {
    student,          // { name, dorm, classType, teacher, class }
    books = [],       // rows for this class
    dormStores = [],  // curated stores for selected dorm
    onlineUrl = null, // optional brightspace link
    isLanguage = false
  } = state || {};

  // hooks must be declared unconditionally
  const [active, setActive] = useState('required');

  const requiredBooks = useMemo(
    () => books.filter(b => (b['Required or Supplemental'] || '').toLowerCase().includes('required')),
    [books]
  );
  const recommendedBooks = useMemo(
    () => books.filter(b => (b['Required or Supplemental'] || '').toLowerCase().includes('recommended')),
    [books]
  );

  // Build store list (per your rules) for a given book; Online always last if present
  const buildStoresForBook = () => {
    let base = Array.isArray(dormStores) ? [...dormStores] : [];
    if (isLanguage) {
      base = base.filter(s => /booksellers\.es/i.test(s.name));
      if (base.length === 0) {
        base.push({
          name: 'Booksellers.es',
          address: 'Calle de Fernández de la Hoz, 40, 28010 Madrid',
          distance: '—',
          phone: '+34 914 427 959',
          availability: 'In Stock'
        });
      }
    }
    if (onlineUrl) {
      base.push({
        name: 'Online (NYU Brightspace)',
        address: '',
        distance: 'Online',
        phone: '',
        availability: 'Online',
        link: onlineUrl
      });
    }
    return base;
  };

  // NOW it's safe to early-return (after hooks are declared)
  if (!student || !books.length) {
    return (
      <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>No results to display.</h2>
        <p>Please search again.</p>
        <button className="btn btn-primary" onClick={() => navigate('/find-books')}>Back to Find My Books</button>
      </div>
    );
  }

  const TabButton = ({ id, label }) => (
    <button
      className={`btn ${active === id ? 'btn-primary' : 'btn-secondary'}`}
      onClick={() => setActive(id)}
      style={{ minWidth: 160 }}
    >
      {label}
    </button>
  );

  return (
    <div>
      <header style={{
        background: 'linear-gradient(135deg, #4c1d95, #7c3aed, #8b5cf6)',
        color: 'white', padding: '2rem 0', textAlign: 'center'
      }}>
        <h2 style={{ margin: 0 }}>Books for {student.class}</h2>
        <div className="badge badge-info" style={{ marginTop: 8 }}>
          {student.teacher} • {student.dorm}
        </div>
      </header>

      <section className="section">
        <div className="container">
          {/* Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <TabButton id="required" label={`Required (${requiredBooks.length})`} />
            <TabButton id="recommended" label={`Recommended (${recommendedBooks.length})`} />
          </div>

          {/* Required */}
          {active === 'required' && (
            <>
              {!requiredBooks.length && <p style={{ textAlign: 'center' }}>No required books found.</p>}
              {requiredBooks.map((book, i) => (
                <div key={`req-${i}`} style={{ marginBottom: '2rem' }}>
                  <div className="card" style={{ textAlign: 'center', border: '2px solid #dc2626' }}>
                    <div className="badge badge-warn" style={{ marginBottom: 12 }}>REQUIRED</div>
                    <h5 style={{ fontSize: '1.4rem' }}>{book.Title}</h5>
                    <p style={{ marginTop: 4 }}>by {book.Author}</p>
                    <div style={{ fontSize: '.95rem', color: '#374151', marginTop: 8 }}>
                      <div><strong>Course:</strong> {book['Course Code']}</div>
                      {book.ISBN && <div><strong>ISBN:</strong> {book.ISBN}</div>}
                      {book.Notes && <div><strong>Notes:</strong> {book.Notes}</div>}
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                    gap: '1.5rem',
                    marginTop: '1rem'
                  }}>
                    {buildStoresForBook().map((store, sIdx) => (
                      <BookstoreCard
                        key={`req-${i}-${sIdx}`}
                        store={store}
                        book={{
                          title: book.Title,
                          author: book.Author,
                          isbn: book.ISBN || '',
                          required: true
                        }}
                        studentName={student.name}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Recommended */}
          {active === 'recommended' && (
            <>
              {!recommendedBooks.length && <p style={{ textAlign: 'center' }}>No recommended books found.</p>}
              {recommendedBooks.map((book, i) => (
                <div key={`rec-${i}`} style={{ marginBottom: '2rem' }}>
                  <div className="card" style={{ textAlign: 'center' }}>
                    <div className="badge badge-info" style={{ marginBottom: 12 }}>RECOMMENDED</div>
                    <h5 style={{ fontSize: '1.4rem' }}>{book.Title}</h5>
                    <p style={{ marginTop: 4 }}>by {book.Author}</p>
                    <div style={{ fontSize: '.95rem', color: '#374151', marginTop: 8 }}>
                      <div><strong>Course:</strong> {book['Course Code']}</div>
                      {book.ISBN && <div><strong>ISBN:</strong> {book.ISBN}</div>}
                      {book.Notes && <div><strong>Notes:</strong> {book.Notes}</div>}
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                    gap: '1.5rem',
                    marginTop: '1rem'
                  }}>
                    {buildStoresForBook().map((store, sIdx) => (
                      <BookstoreCard
                        key={`rec-${i}-${sIdx}`}
                        store={store}
                        book={{
                          title: book.Title,
                          author: book.Author,
                          isbn: book.ISBN || '',
                          required: false
                        }}
                        studentName={student.name}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/find-books')}>
              🔙 Back to Search
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
