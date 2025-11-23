// API configuration
// In production, this will be set via environment variable
// For local development, it uses the proxy from package.json
const getApiBaseUrl = () => {
  // If REACT_APP_API_URL is set, use it (for production)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // Otherwise, use relative URLs (works with proxy in dev, or same domain in production)
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

export const apiFetch = (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  return fetch(url, options);
};

