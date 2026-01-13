// frontend/src/services/apiClient.js
// Production-safe API client with timeout, error handling, and proper base URL

// Get API base URL from environment variables
// Supports both REACT_APP_API_URL and REACT_APP_API_BASE_URL
// In production (Amplify), set REACT_APP_API_URL to your EB URL
// In local dev, falls back to http://localhost:5000
const getApiBaseUrl = () => {
  const envUrl = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL;
  
  if (envUrl) {
    // Remove trailing slash and ensure it doesn't already have /api
    const cleanUrl = envUrl.replace(/\/$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }
  
  // Local dev fallback
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000/api';
  }
  
  // Production fallback (shouldn't happen if env var is set)
  console.warn('[apiClient] No API URL configured, using same-origin');
  return '/api';
};

const API_BASE = getApiBaseUrl();
console.log('[apiClient] API_BASE_URL:', API_BASE);

// Request timeout (15 seconds)
const REQUEST_TIMEOUT = 15000;

// Create AbortController for timeout
const createTimeoutSignal = () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  return { signal: controller.signal, timeoutId };
};

// Helper to build query string
const qs = (obj = {}) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.append(k, v);
  });
  return p.toString();
};

// Main request function with timeout and error handling
async function requestJson(path, options = {}) {
  const { signal, timeoutId } = createTimeoutSignal();
  
  // Merge user's signal with timeout signal
  const finalSignal = options.signal 
    ? (() => {
        const mergedController = new AbortController();
        signal.addEventListener('abort', () => mergedController.abort());
        options.signal.addEventListener('abort', () => mergedController.abort());
        return mergedController.signal;
      })()
    : signal;

  const url = `${API_BASE}${path}`;
  
  // Add cache-busting for GET requests in production
  const cacheHeaders = process.env.NODE_ENV === 'production' && options.method === 'GET'
    ? { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
    : {};
  
  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        Accept: 'application/json',
        ...cacheHeaders,
        ...(options.headers || {}),
        ...(options.json ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options.json ? JSON.stringify(options.json) : options.body,
      signal: finalSignal,
      cache: 'no-store', // Prevent browser caching
    });

    clearTimeout(timeoutId);

    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      console.error('[apiClient] JSON parse error:', parseError);
      throw new Error(`Invalid JSON response from server (${res.status})`);
    }

    // Add error message if missing
    if (!res.ok && data && !data.error) {
      data.error = `Request failed (${res.status})`;
    }

    // Throw error for non-2xx responses
    if (!res.ok) {
      const error = new Error(data.error || `HTTP ${res.status}`);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle timeout
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      const timeoutError = new Error('Request timed out. Please check your connection and try again.');
      timeoutError.isTimeout = true;
      throw timeoutError;
    }
    
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const networkError = new Error('Network error. Unable to reach the server. Please check your connection.');
      networkError.isNetworkError = true;
      networkError.originalError = error;
      throw networkError;
    }
    
    // Re-throw other errors
    throw error;
  }
}

// Multipart upload with timeout
async function postMultipart(path, formData, extraHeaders = {}) {
  const { signal, timeoutId } = createTimeoutSignal();
  const url = `${API_BASE}${path}`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...extraHeaders,
      },
      body: formData,
      signal,
    });

    clearTimeout(timeoutId);

    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      console.error('[apiClient] JSON parse error:', parseError);
      throw new Error(`Invalid JSON response from server (${res.status})`);
    }

    if (!res.ok && data && !data.error) {
      data.error = `Request failed (${res.status})`;
    }

    if (!res.ok) {
      const error = new Error(data.error || `HTTP ${res.status}`);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      const timeoutError = new Error('Upload timed out. Please try again.');
      timeoutError.isTimeout = true;
      throw timeoutError;
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const networkError = new Error('Network error. Unable to reach the server.');
      networkError.isNetworkError = true;
      networkError.originalError = error;
      throw networkError;
    }
    
    throw error;
  }
}

export { requestJson, postMultipart, qs, API_BASE };
