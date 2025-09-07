// frontend/src/components/CatalogUploader.js
import React, { useState } from 'react';

const CatalogUploader = ({ onDataExtracted }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [extractedData, setExtractedData] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setIsProcessing(true);
    setProgress('Reading PDF...');

    const formData = new FormData();
    formData.append('catalog', file);

    try {
      // Upload to backend for processing
      const response = await fetch('http://localhost:5000/api/catalog/parse', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setExtractedData(data);
        setProgress(`Extracted: ${data.courses.length} courses, ${data.books.length} books`);
        onDataExtracted(data);
      } else {
        setProgress('Error processing PDF');
      }
    } catch (error) {
      console.error('Error:', error);
      setProgress('Failed to process PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      background: 'white',
      padding: '2.5rem',
      borderRadius: '20px',
      boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #f3f4f6',
      marginBottom: '2rem'
    }}>
      <h2 style={{
        fontSize: '1.8rem',
        fontWeight: '700',
        marginBottom: '1rem',
        color: '#1f2937'
      }}>
        Upload Course Catalog
      </h2>
      
      <p style={{
        color: '#6b7280',
        marginBottom: '2rem'
      }}>
        Upload the NYU course catalog PDF to automatically import all courses, professors, and required books
      </p>

      <div style={{
        border: '2px dashed #e5e7eb',
        borderRadius: '12px',
        padding: '3rem',
        textAlign: 'center',
        background: '#f9fafb'
      }}>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          disabled={isProcessing}
          style={{ display: 'none' }}
          id="pdf-upload"
        />
        
        <label
          htmlFor="pdf-upload"
          style={{
            background: isProcessing ? '#9ca3af' : 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '12px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            display: 'inline-block',
            fontWeight: '600',
            fontSize: '1rem'
          }}
        >
          {isProcessing ? 'Processing...' : 'Choose PDF File'}
        </label>

        {progress && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'white',
            borderRadius: '8px',
            color: '#374151'
          }}>
            {progress}
          </div>
        )}
      </div>

      {extractedData && (
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: '#f0fdf4',
          borderRadius: '12px',
          border: '1px solid #86efac'
        }}>
          <h3 style={{ color: '#166534', marginBottom: '0.5rem' }}>
            Successfully Imported:
          </h3>
          <ul style={{ color: '#166534', listStyle: 'none', padding: 0 }}>
            <li>✓ {extractedData.courses.length} courses</li>
            <li>✓ {extractedData.professors.length} professors</li>
            <li>✓ {extractedData.books.length} required books</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default CatalogUploader;