import axios from 'axios';
import { storage } from '../utils/storage';
import { STORAGE_KEYS, API_BASE_URL } from '../utils/constants';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── REQUEST INTERCEPTOR ────────────────────────────────────────────────────
axiosClient.interceptors.request.use(
  (config) => {
    const token = storage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR ───────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => {
    if (response.config.responseType === "blob") {
      return response.data;
    }

    return response.data;
  },// Trả thẳng response.data vì backend wrap { success, data, message }
  async (error) => {
    const originalRequest = error.config;

    // 401 → thử refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Đang refresh → queue request lại
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = storage.getRefreshToken();

      if (!refreshToken) {
        // Không có refresh token → logout
        storage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = res.data.data;
        storage.setAccessToken(accessToken);
        storage.setRefreshToken(newRefreshToken);

        axiosClient.defaults.headers.Authorization = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        storage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Normalize error message
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Có lỗi xảy ra, vui lòng thử lại';

    return Promise.reject({ ...error, message });
  }
);

export default axiosClient;