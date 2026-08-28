import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api`
    : '/api',
});

// Attach auth token from Supabase session or local storage & handle FormData
api.interceptors.request.use(async (config) => {
  try {
    // If sending FormData, delete Content-Type so the browser sets multipart/form-data with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    let token = null;

    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        token = session.access_token;
      }
    }

    if (!token) {
      token = localStorage.getItem('accordvoice_token');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn('[API Client] Error setting auth header:', e);
  }
  return config;
});

// Global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[API Client] Unauthorized request (401)');
    }
    return Promise.reject(error);
  }
);

export default api;
