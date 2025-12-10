const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  'http://localhost:5000'; // fallback for local dev

export default API_BASE_URL;