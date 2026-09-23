import axios from 'axios';

// Resolve API base URL:
// 1. If VITE_API_URL is provided (e.g. on Vercel pointing to Render: 'https://xxx.onrender.com' or 'https://xxx.onrender.com/api')
//    normalize it so it always targets the '/api' prefix.
// 2. If VITE_API_URL is omitted (local dev), fallback to '/api' so Vite proxy handles it.
const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
const normalizedApiUrl = rawApiUrl.replace(/\/+$/, '');
const baseURL = normalizedApiUrl
  ? (normalizedApiUrl.endsWith('/api') ? normalizedApiUrl : `${normalizedApiUrl}/api`)
  : '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect on login check failure
      if (!window.location.pathname.includes('/login')) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?notice=login_first';
      }
    }
    return Promise.reject(error);
  },
);

export { api };
export default api;
