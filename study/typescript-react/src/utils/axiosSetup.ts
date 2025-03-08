// src/utils/axiosSetup.ts
import axios, { AxiosInstance } from "axios";

let interceptorsRegistered = false;

export const setupAxiosInterceptors = (axiosInstance: AxiosInstance) => {
  if (interceptorsRegistered) return;

  // Add detailed logging interceptors
  axiosInstance.interceptors.request.use(
    function (config) {
      return config;
    },
    function (error) {
      console.error("Request error:", error);
      return Promise.reject(error);
    }
  );

  axiosInstance.interceptors.response.use(
    function (response) {
      return response;
    },
    function (error) {
      // Enhanced error logging with better structure
      if (axios.isAxiosError(error)) {
        const errorDetails = {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        };

        console.error(`Response error for ${error.config?.url}:`, errorDetails);

        // Make sure we're preserving the original error structure
        // This ensures components get all necessary data from the API
        return Promise.reject(error);
      } else {
        // For non-Axios errors, just log and reject
        console.error("Non-Axios error:", error);
        return Promise.reject(error);
      }
    }
  );

  interceptorsRegistered = true;
};

