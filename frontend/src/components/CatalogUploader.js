// frontend/src/components/CatalogUploader.js
import React, { useRef, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || ''; // optional override, else same origin

const CatalogUploader = ({ onDataExtracted }) => {
  // i'm keeping state simple & explicit so it's easy to debug later
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');          // user-readable status
  const [error, setError] = useState('');                // user-readable error
  const [extractedData, setExtractedData] = useState(null);
  const [fileName, setFileName] = useState('');
  const abortRef = useRef(null);

  const MAX_MB = 10;

  // i run the upload/parse with a robust flow + fallback to /parse if /upload 404/405
  const uploadAndParse = async (file) => {
    setIsProcessing(true);
    setError('');
    setProgress('Validating…');

    // basic client validation (browser MIME can be flaky; backend re-checks too)
    const looksPdf =
      file &&
      (file.type === 'application/pdf' ||
       /\.pdf$/i.test(file.name || ''));
    if (!looksPdf) {
      setIsProcessing(false);
      setError('Please choose a .pdf file');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setIsProcessing(false);
      setError(`PDF is too large (max ${MAX_MB}MB)`);
      return;
    }

    // prep request
    const formData = new FormData();
    formData.append('catalog', file);

    const token = localStorage.getItem('nyu_token') || '';
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    // use AbortController so i can cancel if needed
    const controller = new AbortController();
    abortRef.current = controller;

    // helper to post to a given path and parse JSON safely
    const postJson = async (path) => {
      const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: {
          ...authHeader,
          // do NOT set Content-Type when sending FormData; browser sets the boundary
          Accept: 'application/json',
        },
        body: formData,
        signal: controller.signal,
      });
      let json;
      try {
        json = await res.json();
      } catch {
        json = { success: false, error: 'Invalid JSON response from server' };
      }
      return { res, json };
    };

    try {
      setProgress('Uploading PDF…');
      // primary: /upload
      let { res, json } = await postJson('/api/catalog/upload');

      // fallback: if /upload missing, try /parse for back-compat
      if (!res.ok && (res.status === 404 || res.status === 405)) {
        setProgress('Retrying with legacy parser…');
        ({ res, json } = await postJson('/api/catalog/parse'));
      }

      // handle auth failures explicitly
      if (res.status === 401) {
        throw new Error('You are not signed in. Please log in again.');
      }

      if (!res.ok || !json?.success) {
        const msg =
          json?.error ||
          `Upload failed (${res.status}) — please check the PDF and try again`;
        throw new Error(msg);
      }

      // success
      const data = json;
      setExtractedData(data);
      setProgress(
        `Imported ${data.courses?.length ?? 0} courses, ${data.books?.length ?? 0} books`
      );
      if (typeof onDataExtracted === 'function') onDataExtracted(data);
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Upload cancelled');
      } else {
        console.error('Catalog upload error:', err);
        setError(err.message || 'Failed to process PDF');
      }
    } finally {
      setIsProcessing(false);
      abortRef.current = null;
    }
  };

  // i support both click-to-upload and drag & drop
  const onFileInput = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    uploadAndParse(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (isProcessing) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setFileName(file.name);
    uploadAndParse(file);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const cancelUpload = () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  };

  const resetAll = () => {
    setIsProcessing(false);
    setProgress('');
    setError('');
    setExtractedData(null);
    setFileName('');
    abortRef.current = null;
  };

  // tiny helper to render a small preview (keeps UI tidy)
  const PreviewList = ({ label, items = [], getLabel }) => {
    if (!items.length) return null;
    const first = items.slice(0, 5);
    return (
      <div style={{ marginTop: '0.5rem' }}>
        <div style={{ fontWeight: 700 }}>{label}</div>
        <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1rem' }}>
          {first.map((it, i) => (
            <li key={i} style={{ lineHeight: 1.4 }}>
              {getLabel(it)}
            </li>
          ))}
        </ul>
        {items.length > first.length && (
          <div style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: 4 }}>
            …and {items.length - first.length} more
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        background: 'white',
        padding: '2.5rem',
        borderRadius: '20px',
        boxShadow: '0 10px 25px -3px rgba(0,0,0,0.1)',
        border: '1px solid #f3f4f6',
        marginBottom: '2rem',
      }}
    >
      <h2
        style={{
          fontSize: '1.8rem',
          fontWeight: 700,
          marginBottom: '1rem',
          color: '#1f2937',
        }}
      >
        Upload Course Catalog
      </h2>

      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        Upload the NYU course catalog PDF — i’ll extract courses, professors, and required books.
      </p>

      {/* drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        style={{
          border: '2px dashed #e5e7eb',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          background: '#f9fafb',
        }}
        role="region"
        aria-label="Catalog PDF upload area"
      >
        <input
          id="pdf-upload"
          type="file"
          accept=".pdf,application/pdf"
          onChange={onFileInput}
          disabled={isProcessing}
          style={{ display: 'none' }}
        />

        <label
          htmlFor="pdf-upload"
          style={{
            background: isProcessing
              ? '#9ca3af'
              : 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
            color: 'white',
            padding: '0.9rem 1.4rem',
            borderRadius: '12px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            display: 'inline-block',
            fontWeight: 600,
            fontSize: '1rem',
            userSelect: 'none',
          }}
          aria-disabled={isProcessing}
        >
          {isProcessing ? 'Processing…' : 'Choose PDF File'}
        </label>

        <div style={{ marginTop: '0.75rem', color: '#6b7280', fontSize: '0.95rem' }}>
          or drag & drop here (max {MAX_MB}MB)
        </div>

        {fileName && (
          <div style={{ marginTop: '0.5rem', color: '#374151' }}>
            Selected: <strong>{fileName}</strong>
          </div>
        )}

        {/* live status */}
        {(progress || error) && (
          <div
            aria-live="polite"
            style={{
              marginTop: '1rem',
              padding: '0.8rem 1rem',
              background: 'white',
              borderRadius: '8px',
              color: error ? '#991b1b' : '#374151',
              border: `1px solid ${error ? '#fecaca' : '#e5e7eb'}`,
            }}
          >
            {error ? `⚠️ ${error}` : progress}
          </div>
        )}

        {/* actions */}
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          {isProcessing && (
            <button
              type="button"
              onClick={cancelUpload}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '0.6rem 0.9rem',
                borderRadius: 10,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          )}
          {(error || extractedData) && (
            <button
              type="button"
              onClick={resetAll}
              style={{
                background: '#e5e7eb',
                color: '#111827',
                border: 'none',
                padding: '0.6rem 0.9rem',
                borderRadius: 10,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Upload Another
            </button>
          )}
        </div>
      </div>

      {/* success summary */}
      {extractedData && (
        <div
          style={{
            marginTop: '1.25rem',
            padding: '1.2rem',
            background: '#f0fdf4',
            borderRadius: '12px',
            border: '1px solid #86efac',
          }}
        >
          <h3 style={{ color: '#166534', margin: 0, marginBottom: '0.25rem' }}>
            Successfully Imported
          </h3>
          <div style={{ color: '#166534' }}>
            ✓ {extractedData.courses?.length ?? 0} courses •{' '}
            ✓ {extractedData.professors?.length ?? 0} professors •{' '}
            ✓ {extractedData.books?.length ?? 0} books
          </div>

          {/* small preview lists */}
          <PreviewList
            label="Sample courses"
            items={extractedData.courses || []}
            getLabel={(c) => `${c.code || ''} — ${c.name || ''}${c.professor ? ` (Prof. ${c.professor})` : ''}`}
          />
          <PreviewList
            label="Sample books"
            items={extractedData.books || []}
            getLabel={(b) => `${b.title || ''}${b.author ? ` by ${b.author}` : ''}${b.isbn ? ` — ISBN ${b.isbn}` : ''}`}
          />
        </div>
      )}
    </div>
  );
};

export default CatalogUploader;
