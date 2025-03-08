// src/utils/axiosSetup.ts
import axios, { AxiosInstance } from "axios";
import { notification } from "antd"; // Import your notification library

let interceptorsRegistered = false;

export const setupAxiosInterceptors = (axiosInstance: AxiosInstance) => {
  if (interceptorsRegistered) return;

  // Request interceptor remains the same
  axiosInstance.interceptors.request.use(
    function (config) {
      return config;
    },
    function (error) {
      console.error("Request error:", error);
      return Promise.reject(error);
    }
  );

  // Enhanced response interceptor with centralized error handling
  axiosInstance.interceptors.response.use(
    function (response) {
      return response;
    },
    function (error) {
      // Enhanced error logging
      if (axios.isAxiosError(error)) {
        const errorDetails = {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        };

        console.error(`Response error for ${error.config?.url}:`, errorDetails);

        // Check for specific error types and handle them centrally
        if (error.response) {
          const { status, data } = error.response;
          //const errorCode = data?.code;
          const errorMessage = data?.message || "An unexpected error occurred";

          // Handle authentication errors
          if (status === 401) {
            notification.error({
              message: "Authentication Error",
              description: "Your session has expired. Please log in again.",
              key: "auth-error",
            });
            // You might want to redirect to login here or dispatch a logout action
            // Example: store.dispatch(logoutUser());

            // Return a special rejection that components can check for auth errors
            return Promise.reject({ isHandled: true, originalError: error });
          }

          // Handle common validation errors
          if (status === 400) {
            notification.error({
              message: "Validation Error",
              description: errorMessage,
              key: "validation-error",
            });
            // Let the component handle specific field errors
            return Promise.reject(error);
          }

          // Handle resource conflict errors (like duplicates)
          if (status === 409) {
            // Check if it's a username or email conflict
            if (errorMessage.toLowerCase().includes("email")) {
              notification.error({
                message: "Registration Error",
                description:
                  "This email is already registered. Please use a different email address.",
                key: "email-conflict-error",
              });
            } else if (
              errorMessage.toLowerCase().includes("user") ||
              errorMessage.toLowerCase().includes("username")
            ) {
              notification.error({
                message: "Registration Error",
                description:
                  "This username is already taken. Please choose a different username.",
                key: "username-conflict-error",
              });
            } else {
              // Generic conflict error
              notification.error({
                message: "Conflict Error",
                description: errorMessage,
                key: "conflict-error",
              });
            }

            // Return a rejection with a flag indicating it was handled
            return Promise.reject({
              isHandled: true,
              originalError: error,
              field: errorMessage.toLowerCase().includes("email")
                ? "email"
                : "username",
            });
          }

          // Handle not found errors
          if (status === 404) {
            notification.error({
              message: "Not Found",
              description: errorMessage,
              key: "not-found-error",
            });
            return Promise.reject({ isHandled: true, originalError: error });
          }

          // Handle server errors
          if (status >= 500) {
            notification.error({
              message: "Server Error",
              description:
                "The server encountered an error. Please try again later.",
              key: "server-error",
            });
            return Promise.reject({ isHandled: true, originalError: error });
          }
        }

        // For network errors
        if (error.code === "ERR_NETWORK") {
          notification.error({
            message: "Network Error",
            description:
              "Unable to connect to the server. Please check your internet connection.",
            key: "network-error",
          });
          return Promise.reject({ isHandled: true, originalError: error });
        }

        // For other axios errors that aren't handled above
        notification.error({
          message: "Error",
          description: error.message || "An unexpected error occurred",
          key: "general-error",
        });
        return Promise.reject({ isHandled: true, originalError: error });
      }

      // For non-Axios errors
      console.error("Non-Axios error:", error);
      notification.error({
        message: "Error",
        description: "An unexpected error occurred",
        key: "unknown-error",
      });
      return Promise.reject(error);
    }
  );

  interceptorsRegistered = true;
};

