// src/utils/axiosSetup.ts
import { AxiosInstance } from "axios";

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
      console.error(`Response error for ${error.config?.url}:`, {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      return Promise.reject(error);
    }
  );

  interceptorsRegistered = true;
};

