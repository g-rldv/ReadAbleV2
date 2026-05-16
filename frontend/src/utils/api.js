import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api')
  .toString()
  .replace(/\/+$|^\s+|\s+$/g, '');

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (config.baseURL && typeof config.url === 'string') {
    const normalizedBase = config.baseURL.replace(/\/+$|^\s+|\s+$/g, '');
    const normalizedUrl = config.url.replace(/^\/+/g, '/');

    if (normalizedUrl.startsWith('/api/') && normalizedBase.endsWith('/api')) {
      config.url = normalizedUrl.replace(/^\/api/, '');
    }
    config.baseURL = normalizedBase;
    config.url = normalizedUrl;
  }
  return config;
});

export default api;
