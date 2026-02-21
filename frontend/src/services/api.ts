import axios, { type AxiosError } from 'axios';
import { useAuthStore } from '../stores/authStore';

export type NetworkErrorType =
  | 'timeout'
  | 'offline'
  | 'server'
  | 'rate-limit'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'validation'
  | 'unknown';

export interface ClassifiedError {
  type: NetworkErrorType;
  message: string;
  status?: number;
  original: AxiosError;
}

export function classifyError(error: AxiosError): ClassifiedError {
  const status = error.response?.status;

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return { type: 'timeout', message: 'Request timed out. Please try again.', status, original: error };
  }

  if (!navigator.onLine || error.message === 'Network Error') {
    return { type: 'offline', message: 'You appear to be offline. Check your connection.', status, original: error };
  }

  if (status === 429) {
    return { type: 'rate-limit', message: 'Too many requests. Please wait a moment.', status, original: error };
  }

  if (status === 401) {
    return { type: 'unauthorized', message: 'Your session has expired. Please log in again.', status, original: error };
  }

  if (status === 403) {
    return { type: 'forbidden', message: 'You do not have permission to perform this action.', status, original: error };
  }

  if (status === 404) {
    return { type: 'not-found', message: 'The requested resource was not found.', status, original: error };
  }

  if (status === 400 || status === 422) {
    const serverMessage = (error.response?.data as { message?: string })?.message;
    return { type: 'validation', message: serverMessage || 'Invalid request. Please check your input.', status, original: error };
  }

  if (status && status >= 500) {
    return { type: 'server', message: 'A server error occurred. Please try again later.', status, original: error };
  }

  return { type: 'unknown', message: 'An unexpected error occurred.', status, original: error };
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// --- CSRF token helper ---
function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : undefined;
}

// --- Request interceptor ---
api.interceptors.request.use(
  (config) => {
    // Attach bearer token
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach CSRF token on mutating requests
    const method = (config.method ?? '').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      const csrf = getCookie('csrf-token') ?? getCookie('_csrf');
      if (csrf) {
        config.headers['X-CSRF-Token'] = csrf;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// --- Refresh-queue state ---
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((pending) => {
    if (token) {
      pending.resolve(token);
    } else {
      pending.reject(error);
    }
  });
  failedQueue = [];
}

// --- Response interceptor with token refresh ---
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Guard: no config means we can't retry
    if (!originalRequest) {
      return Promise.reject(classifyError(error));
    }

    const isRefreshRequest = originalRequest.url === '/auth/refresh';

    // Only attempt refresh on 401 that is NOT the refresh endpoint itself
    if (error.response?.status === 401 && !isRefreshRequest) {

      // If a refresh is already in flight, queue this request
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      isRefreshing = true;

      try {
        // The refresh endpoint reads the httpOnly cookie automatically
        const { data } = await api.post('/auth/refresh');
        const newToken: string = data.data.token;

        useAuthStore.getState().setToken(newToken);

        // Replay all queued requests with the new token
        processQueue(null, newToken);

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — flush queue with error, logout, redirect
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(classifyError(error));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(classifyError(error));
  }
);

export default api;
