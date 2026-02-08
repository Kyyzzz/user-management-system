import axios from 'axios';
import { tokenStorage } from '../utils/tokenStorage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Separate client without interceptors for token refresh
const refreshClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshInFlight:
  | Promise<{ access_token: string; refresh_token: string }>
  | null = null;

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const requestUrl: string = error.config?.url ?? '';
      const isLoginRequest = requestUrl.includes('/auth/login');
      const isRefreshRequest = requestUrl.includes('/auth/refresh');
      const isLogoutRequest = requestUrl.includes('/auth/logout');
      const originalRequest: any = error.config;
      const alreadyRetried = Boolean(originalRequest?._retry);

      // Let the login form display "Invalid credentials" instead of redirecting/reloading.
      // Also, do not attempt refresh on logout requests.
      if (!isLoginRequest && !isRefreshRequest && !isLogoutRequest) {
        const refreshToken = tokenStorage.getRefreshToken();

        if (refreshToken && !alreadyRetried) {
          originalRequest._retry = true;

          try {
            if (!refreshInFlight) {
              refreshInFlight = refreshClient
                .post('/auth/refresh', { refresh_token: refreshToken })
                .then((res) => res.data)
                .finally(() => {
                  refreshInFlight = null;
                });
            }

            const { access_token, refresh_token } = await refreshInFlight;
            tokenStorage.setToken(access_token);
            tokenStorage.setRefreshToken(refresh_token);

            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return api(originalRequest);
          } catch {
            // fall through to clear + redirect
          }
        }

        tokenStorage.clear();

        // Avoid redirect loops if we're already on the login page.
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
