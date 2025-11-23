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
  // Remove leading slash from endpoint if present, and ensure base URL doesn't end with slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const cleanBaseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const url = `${cleanBaseUrl}${cleanEndpoint}`;
  return fetch(url, options);
};

