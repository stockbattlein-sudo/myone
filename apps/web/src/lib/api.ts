import axios from 'axios';

/**
 * Axios API client.
 *
 * - Same-origin requests (via Next.js rewrite proxy) so httpOnly cookies
 *   are sent automatically — no token management in JS.
 * - Auto-refreshes on 401 via the /api/auth/refresh endpoint.
 * - Queues concurrent requests during refresh to avoid race conditions.
 */
const api = axios.create({
  baseURL: '',            // Same origin — Next.js rewrites /api/* to NestJS
  withCredentials: true,  // Always send cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Token Refresh Interceptor ────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401, and only once per request
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't try to refresh auth endpoints (login, signup, refresh, verify-otp, etc.)
    if (originalRequest.url?.includes('/auth/')) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Another request is already refreshing — queue this one
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => api(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await api.post('/api/auth/refresh');
      processQueue(null);
      return api(originalRequest); // Retry the original request
    } catch (refreshError) {
      processQueue(refreshError);
      // Refresh failed — redirect to login only if we are not on a public page
      if (typeof window !== 'undefined') {
        const publicPaths = ['/login', '/signup', '/verify-otp'];
        const isPublicPath = publicPaths.some((p) =>
          window.location.pathname.startsWith(p),
        );
        if (!isPublicPath) {
          window.location.href = '/login';
        }
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export { api };
