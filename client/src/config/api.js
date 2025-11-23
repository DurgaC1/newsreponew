// API configuration
// Backend API URL - change this to your backend Vercel URL
const getApiBaseUrl = () => {
  // If REACT_APP_API_URL is set (via environment variable), use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // Production backend URL
  if (process.env.NODE_ENV === 'production') {
    return 'https://server-news.vercel.app';
  }
  // Development: use proxy from package.json (localhost:7001)
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

export const apiFetch = (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  return fetch(url, options);
};

