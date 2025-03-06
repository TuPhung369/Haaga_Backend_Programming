// src/utils/axiosSetup.ts
import { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { refreshToken } from "./tokenRefresh";
import store from "../store/store";

export const setupAxiosInterceptors = (axiosInstance: AxiosInstance) => {
  axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const { token } = store.getState().auth;

      if (token) {
        // Instead of checking token expiry, just add the token to all requests
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor to handle 401 errors
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // If receiving a 401 error and we haven't retried yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Try to refresh the token
          await refreshToken();

          // Get the new token and retry the request
          const newToken = store.getState().auth.token;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // If refresh fails, redirect to login
          console.error("Token refresh failed during 401 error", refreshError);
          // Optionally handle logout or redirect here
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
};

