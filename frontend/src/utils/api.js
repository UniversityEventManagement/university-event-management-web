import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL?.trim() || 'http://127.0.0.1:8000';
export const API_URL = `${BACKEND_URL}/api`;
export const isApiConfigured = Boolean(process.env.REACT_APP_BACKEND_URL);

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

const cache = new Map();

const getCacheKey = (url, config = {}) => `${url}::${JSON.stringify(config.params || {})}`;

export const cachedGet = async (url, config = {}, ttlMs = 15000) => {
  const key = getCacheKey(url, config);
  const now = Date.now();
  const cached = cache.get(key);

  if (cached && now - cached.timestamp < ttlMs) {
    return cached.data;
  }

  const response = await api.get(url, config);
  cache.set(key, { data: response.data, timestamp: now });
  return response.data;
};

export const clearApiCache = () => cache.clear();

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
