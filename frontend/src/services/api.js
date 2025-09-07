// frontend/src/services/api.js

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  // Helper method to get auth headers
  static getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  // Auth endpoints
  static async login(username, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return response.json();
  }

  static async register(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  }

  // Books endpoints
  static async getAllBooks() {
    const response = await fetch(`${API_BASE_URL}/books/all`);
    return response.json();
  }

  static async getBooksByCourse(courseCode, professor) {
    const params = professor ? `?professor=${professor}` : '';
    const response = await fetch(`${API_BASE_URL}/books/course/${courseCode}${params}`);
    return response.json();
  }

  static async addExistingBookToInventory(bookData) {
    const response = await fetch(`${API_BASE_URL}/books/inventory/existing`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(bookData)
    });
    return response.json();
  }

  static async addNewBookToInventory(bookData) {
    const response = await fetch(`${API_BASE_URL}/books/inventory/new`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(bookData)
    });
    return response.json();
  }

  static async getInventory(bookstoreId) {
    const response = await fetch(`${API_BASE_URL}/books/inventory/${bookstoreId}`, {
      headers: this.getAuthHeaders()
    });
    return response.json();
  }

  static async updateInventoryItem(inventoryId, data) {
    const response = await fetch(`${API_BASE_URL}/books/inventory/${inventoryId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return response.json();
  }

  static async deleteInventoryItem(inventoryId) {
    const response = await fetch(`${API_BASE_URL}/books/inventory/${inventoryId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return response.json();
  }

  // Student search
  static async searchBooks(searchData) {
    const response = await fetch(`${API_BASE_URL}/students/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchData)
    });
    return response.json();
  }

  // Bookstore endpoints
  static async searchBookstores(dorm, course, professor) {
    const params = new URLSearchParams({ dorm, course });
    if (professor) params.append('professor', professor);
    
    const response = await fetch(`${API_BASE_URL}/bookstores/search?${params}`);
    return response.json();
  }

  static async getNearbyBookstores(dormName) {
    const response = await fetch(`${API_BASE_URL}/bookstores/near/${dormName}`);
    return response.json();
  }

  static async getDorms() {
    const response = await fetch(`${API_BASE_URL}/bookstores/dorms`);
    return response.json();
  }

  static async getCourses() {
    const response = await fetch(`${API_BASE_URL}/bookstores/courses`);
    return response.json();
  }

  // Web scraping search (when implemented)
  static async searchBookstoresWeb(query, isbn) {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (isbn) params.append('isbn', isbn);
    
    const response = await fetch(`${API_BASE_URL}/books/search?${params}`);
    return response.json();
  }
}

export default ApiService;