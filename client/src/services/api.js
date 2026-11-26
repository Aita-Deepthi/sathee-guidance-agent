// Axios instance used for every request to the backend.
// The API URL comes from VITE_API_URL so nothing is hardcoded for production.
import axios from 'axios';

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const TOKEN_KEY = 'sathee_token';

export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } },
};

const api = axios.create({ baseURL: API_URL, timeout: 120000 });

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the session expires, log the user out
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401 && tokenStore.get()) {
      tokenStore.clear();
      window.dispatchEvent(new Event('sathee:logout'));
    }
    return Promise.reject(err);
  }
);

// Human-readable error text from any failed request
export function errorMessage(err) {
  if (err && err.response && err.response.data && err.response.data.message) return err.response.data.message;
  if (err && err.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (err && !err.response) return 'Cannot reach the server. Check your internet connection or that the backend is running.';
  return 'Something went wrong. Please try again.';
}

export default api;
