// frontend/src/components/BookstoreCard.js
import React from 'react';

const STORE_HOME = {
  'Booksellers.es': 'https://booksellers.es/',
  // Secret Kingdoms removed - always search for the book
  'Parentisis': 'https://parentisis.com/',   // keeping your spelling
  'Parenthesis': 'https://parenthesis.com/', // optional safeguard if data changes
  'Desperate Literature': 'https://desperateliterature.com/'
};

const BookstoreCard = ({ store, book, studentName }) => {
  const safe = (v) => (v == null ? '' : String(v));

  // Build a store search URL for this book (fallback when we don't have a homepage)
  const createBookHref = (bookObj, storeObj) => {
    const name = safe(storeObj?.name).trim();
    const isOnlineCard = /online|brightspace/i.test(name);
    if (isOnlineCard && storeObj?.link) return storeObj.link;

    const rawTitle = safe(bookObj?.title).trim();
    const aula = /aula\s+internacional(?:\s+plus)?\s*([0-9]+)/i.exec(rawTitle);
    const titleForBooksellers = aula ? `Aula Internacional Plus ${aula[1]}` : rawTitle;

    const toPlusQ = (s) => encodeURIComponent(s).replace(/%20/g, '+');

    if (/booksellers\.es/i.test(name)) {
      return `https://booksellers.es/catalogsearch/result/?q=${encodeURIComponent(titleForBooksellers)}`;
    }

    const q = toPlusQ(rawTitle);
    if (name === 'Secret Kingdoms') {
      return `https://thesecretkingdoms.net/busqueda/listaLibros.php?tipoBus=full&aproximada=N&palabrasBusqueda=${q}`;
    }
    if (name === 'Parentisis') {
      return `https://parentisis.com/search?q=${q}`;
    }
    if (name === 'Desperate Literature') {
      return `https://desperateliterature.com/search?query=${q}`;
    }
    // last resort: Google with store name context
    return `https://www.google.com/search?q=${q}+${toPlusQ(name)}`;
  };

  // Backup for Booksellers if their result page renders blank
  const buildBooksellersFallback = (title) => {
    const raw = safe(title).trim();
    const aula = /aula\s+internacional(?:\s+plus)?\s*([0-9]+)/i.exec(raw);
    const normalized = aula ? `Aula Internacional Plus ${aula[1]}` : raw;
    const q = encodeURIComponent(`site:booksellers.es "${normalized}"`);
    return `https://www.google.com/search?q=${q}`;
  };

  // Determine the primary CTA (label + href):
  // - Online/Brightspace → Open in Brightspace (store.link)
  // - If homepage known     → Visit Store Website (homepage)
  // - Else                  → Search at {Store} (store search for this title)
  const resolvePrimaryCTA = (storeObj, bookObj) => {
    const name = safe(storeObj?.name);
    const isOnline = /online|brightspace/i.test(name);
    const homeHref = STORE_HOME[name] || null;

    if (isOnline && storeObj?.link) {
      return { label: '📖 Open in Brightspace', href: storeObj.link };
    }
    if (homeHref) {
      return { label: '🏪 Visit Store Website', href: homeHref };
    }
    return { label: `🔎 Search at ${name || 'Bookstore'}`, href: createBookHref(bookObj, storeObj) };
  };

  const isOnlineCard = /online|brightspace/i.test(safe(store?.name));
  const isBooksellers = /booksellers\.es/i.test(safe(store?.name));
  const telHref = (num) => {
    const digits = safe(num).replace(/[^\d+]/g, '');
    return digits ? `tel:${digits}` : null;
  };

  const primary = resolvePrimaryCTA(store, book);

  // UI
  return (
    <div
      className="card"
      style={{
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        transition: 'transform .2s, box-shadow .2s',
        background: '#fff'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
      }}
    >
      {/* Header: Store name, address, availability */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <h5 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem', lineHeight: 1.2 }}>
            {store?.name}
          </h5>
          {store?.address && (
            <p style={{ color: '#6b7280', fontSize: '.95rem', margin: 0 }}>
              {store.address}
            </p>
          )}
        </div>

        {store?.availability && (
          <div
            className={`badge ${store.availability === 'In Stock' ? 'badge-success' : 'badge-warn'}`}
            style={{
              whiteSpace: 'nowrap',
              fontWeight: 700,
              padding: '6px 10px',
              borderRadius: 999,
              border: '1px solid rgba(0,0,0,0.06)',
              background: store.availability === 'In Stock' ? '#ecfdf5' : '#f3f4f6',
              color: store.availability === 'In Stock' ? '#065f46' : '#374151'
            }}
          >
            {store.availability}
          </div>
        )}
      </div>

      {/* Meta: Distance / Phone */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <span className="help" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Distance</span>
            <p style={{ fontSize: '1rem', color: '#1f2937', fontWeight: 600, margin: '.25rem 0 0' }}>
              {store?.distance || (isOnlineCard ? 'Online' : '—')}
            </p>
          </div>

          <div>
            <span className="help" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Phone</span>
            <p style={{ fontSize: '1rem', color: '#1f2937', fontWeight: 600, margin: '.25rem 0 0' }}>
              {store?.phone
                ? (
                  <a
                    href={telHref(store.phone)}
                    className="link"
                    aria-label={`Call ${store.name} at ${store.phone}`}
                    style={{ textDecoration: 'none', color: '#1f2937' }}
                  >
                    {store.phone}
                  </a>
                )
                : '—'}
            </p>
          </div>
        </div>

        {/* "Looking for" block */}
        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <span className="help" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Looking for
          </span>
          <p style={{ fontSize: '1rem', color: '#1f2937', fontWeight: 600, margin: '.25rem 0 0' }}>
            {book?.title}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: isOnlineCard ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }} role="group" aria-label="store actions">
        {/* Maps: only physical stores */}
        {!isOnlineCard && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              safe(store?.name) + (store?.address ? ', ' + store.address : '')
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
            aria-label={`Open map for ${store?.name}`}
            title="Open in Google Maps"
            style={{
              textDecoration: 'none',
              border: '1px solid #d1d5db',
              borderRadius: 10,
              padding: '12px 14px',
              background: '#fff',
              color: '#111827',
              fontWeight: 700,
              textAlign: 'center'
            }}
          >
            📍 View on Maps
          </a>
        )}

        {/* Primary CTA: Visit website / Open Brightspace / Search fallback */}
        <a
          href={primary.href}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          aria-label={`${primary.label} for ${store?.name}`}
          title={primary.label}
          style={{
            textDecoration: 'none',
            border: '1px solid #4f46e5',
            borderRadius: 10,
            padding: '12px 14px',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: '#fff',
            fontWeight: 800,
            textAlign: 'center',
            boxShadow: '0 6px 16px rgba(79,70,229,0.25)'
          }}
        >
          {primary.label}
        </a>
      </div>

      {/* Booksellers-only alternate search hint */}
      {isBooksellers && !isOnlineCard && (
        <div style={{ marginTop: '.25rem' }}>
          <a
            href={buildBooksellersFallback(book?.title)}
            target="_blank"
            rel="noopener noreferrer"
            className="help"
            style={{ display: 'inline-block', color: '#6b7280', fontSize: '.9rem', textDecoration: 'none' }}
            aria-label="Try alternate Booksellers search"
            title="Alternate search if the results are blank"
          >
            Having trouble on Booksellers? Try an alternate search
          </a>
        </div>
      )}

      {/* Student note */}
      <div style={{ marginTop: '1rem', padding: '1rem', background: 'linear-gradient(135deg, #ecfdf5, #f0fdf4)', borderRadius: '8px', border: '1px solid #d1fae5' }}>
        <p style={{ fontSize: '.85rem', color: '#065f46', margin: 0, textAlign: 'center', fontWeight: 600 }}>
          For: {studentName} • {book?.required || book?.is_required ? 'Required' : 'Recommended'} Text
        </p>
      </div>
    </div>
  );
};

export default BookstoreCard;