const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'bnpl_tracker_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      // Session expired or invalid — clear it so the app falls back to the login screen
      setToken(null);
      window.dispatchEvent(new Event('auth:logout'));
    }
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

export const authApi = {
  register: (payload) =>
    fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handle),
  login: (payload) =>
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handle),
  me: () => fetch(`${BASE_URL}/auth/me`, { headers: authHeaders() }).then(handle),
};

export const api = {
  getItems: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${BASE_URL}/items${qs ? `?${qs}` : ''}`, { headers: authHeaders() }).then(handle);
  },
  getMeta: () => fetch(`${BASE_URL}/items/meta`, { headers: authHeaders() }).then(handle),
  getSummary: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${BASE_URL}/items/summary${qs ? `?${qs}` : ''}`, { headers: authHeaders() }).then(handle);
  },
  createItem: (payload) =>
    fetch(`${BASE_URL}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    }).then(handle),
  updateItem: (id, payload) =>
    fetch(`${BASE_URL}/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    }).then(handle),
  payMonth: (id) =>
    fetch(`${BASE_URL}/items/${id}/pay`, { method: 'PATCH', headers: authHeaders() }).then(handle),
  unpayMonth: (id) =>
    fetch(`${BASE_URL}/items/${id}/unpay`, { method: 'PATCH', headers: authHeaders() }).then(handle),
  deleteItem: (id) =>
    fetch(`${BASE_URL}/items/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handle),
};
