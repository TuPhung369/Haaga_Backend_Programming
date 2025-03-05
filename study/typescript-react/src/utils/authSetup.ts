// src/utils/authSetup.ts
import { setupTokenRefresh } from "./tokenRefresh";
import store from "../store/store";
import {
  AxiosInstance,
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

/**
 * Initializes authentication helpers
 * - Sets up token refresh for existing tokens
 * - Called when the app starts
 */
export const initializeAuth = (): void => {
  // Get current token from Redux store
  const { token, isAuthenticated } = store.getState().auth;

  if (token && isAuthenticated) {
    // If we have a token, set up refresh
    setupTokenRefresh(token);
  }
};

/**
 * For use with Axios interceptors to automatically refresh token on 401 errors
 */
export const setupAxiosInterceptors = (axiosInstance: AxiosInstance): void => {
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // If we get a 401 and haven't tried to refresh yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Try to refresh the token
          await setupTokenRefresh(store.getState().auth.token);

          // Update the token in the request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${
              store.getState().auth.token
            }`;
          }

          // Retry the original request with the new token
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // If refresh fails, redirect to login
          console.error("Token refresh failed:", refreshError);
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
};

