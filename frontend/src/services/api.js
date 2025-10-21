// frontend/src/services/api.js

// i normalize the base so i can call request('/auth/login') and it always hits /api
const RAW_BASE = process.env.REACT_APP_API_URL || '';
const API_BASE = RAW_BASE
  ? (RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE.replace(/\/$/, '')}/api`)
  : '/api'; // same-origin dev proxy

// tiny helpers i reuse everywhere
const qs = (obj = {}) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.append(k, v);
  });
  return p.toString();
};

// i always try to return JSON so existing callers keep working
async function requestJson(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
      ...(options.json ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.json ? JSON.stringify(options.json) : options.body,
    signal: options.signal,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = { success: false, error: 'Invalid JSON response from server' };
  }

  // if backend sent a non-2xx without an error message, i add one
  if (!res.ok && data && !data.error) {
    data.error = `Request failed (${res.status})`;
  }
  return data;
}

// multipart upload (i don’t set Content-Type; browser sets boundary)
async function postMultipart(path, formData, extraHeaders = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...extraHeaders,
    },
    body: formData,
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = { success: false, error: 'Invalid JSON response from server' };
  }
  if (!res.ok && data && !data.error) {
    data.error = `Request failed (${res.status})`;
  }
  return data;
}

class ApiService {
  // i read the new token key we decided on
  static getAuthHeaders() {
    const token = localStorage.getItem('nyu_token');
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  // -------- AUTH --------
  static login(username, password) {
    // librarian login
    return requestJson('/auth/login', {
      method: 'POST',
      json: { username, password },
    });
  }

  // (keeping this for compatibility; your new flow doesn’t use it)
  static register(userData) {
    return requestJson('/auth/register', {
      method: 'POST',
      json: userData,
    });
  }

  // -------- BOOKS --------
  static getAllBooks() {
    return requestJson('/books/all');
  }

  static getBooksByCourse(courseCode, professor) {
    const query = qs({ professor });
    return requestJson(`/books/course/${encodeURIComponent(courseCode)}${query ? `?${query}` : ''}`);
  }

  // inventory endpoints (unused in the new flow, but i’ll keep them no-op-safe)
  static addExistingBookToInventory(bookData) {
    return requestJson('/books/inventory/existing', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      json: bookData,
    });
  }

  static addNewBookToInventory(bookData) {
    return requestJson('/books/inventory/new', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      json: bookData,
    });
  }

  static getInventory(bookstoreId) {
    return requestJson(`/books/inventory/${encodeURIComponent(bookstoreId)}`, {
      headers: this.getAuthHeaders(),
    });
  }

  static updateInventoryItem(inventoryId, data) {
    return requestJson(`/books/inventory/${encodeURIComponent(inventoryId)}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      json: data,
    });
  }

  static deleteInventoryItem(inventoryId) {
    return requestJson(`/books/inventory/${encodeURIComponent(inventoryId)}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
  }

  // -------- STUDENT SEARCH --------
  static searchBooks(searchData) {
    return requestJson('/students/search', {
      method: 'POST',
      json: searchData,
    });
  }

  // -------- BOOKSTORES --------
  static searchBookstores(dorm, course, professor) {
    const query = qs({ dorm, course, professor });
    return requestJson(`/bookstores/search?${query}`);
  }

  static getNearbyBookstores(dormName) {
    return requestJson(`/bookstores/near/${encodeURIComponent(dormName)}`);
  }

  static getDorms() {
    return requestJson('/bookstores/dorms');
  }

  static getCourses() {
    return requestJson('/bookstores/courses');
  }

  // -------- SEARCH (web scrape backend) --------
  static searchBookstoresWeb(query, isbn) {
    const q = qs({ query, isbn });
    return requestJson(`/books/search?${q}`);
  }

  // -------- Catalog upload (nice wrapper for the PDF) --------
  // not required if you’re calling fetch directly, but i’m giving you a clean helper anyway
  static uploadCatalog(file) {
    const form = new FormData();
    form.append('catalog', file);
    return postMultipart('/catalog/upload', form, this.getAuthHeaders());
  }
}

export default ApiService;
