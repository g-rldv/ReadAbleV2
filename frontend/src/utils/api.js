import axios from 'axios';

const rawApiBase = import.meta.env.VITE_API_BASE_URL;
const rawApiUrl = import.meta.env.VITE_API_URL;

const baseURL = rawApiBase
  ? rawApiBase.toString().trim().replace(/\/+$|^\s+|\s+$/g, '')
  : rawApiUrl
    ? `${rawApiUrl.toString().trim().replace(/\/+$|^\s+|\s+$/g, '')}/api`
    : '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
