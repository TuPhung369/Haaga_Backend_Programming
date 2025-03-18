// src/utils/axiosSetup.ts
import axios, { AxiosInstance } from "axios";
import { notification } from "antd";
import { ErrorType } from "../services/baseService";
import { getRecaptchaToken, isDevEnvironment } from "./recaptchaUtils";

// Define the type for our custom error rejection data
interface CustomErrorData {
  isHandled?: boolean;
  field?: string;
  message?: string;
  originalError?: unknown;
  errorCode?: number;
  errorType?: ErrorType;
}

let interceptorsRegistered = false;

export const setupAxiosInterceptors = (axiosInstance: AxiosInstance) => {
  if (interceptorsRegistered) return;

  // Request interceptor
  axiosInstance.interceptors.request.use(
    function (config) {
      // Automatically add reCAPTCHA token for POST, PUT, PATCH, DELETE
      const mutationMethods = ["post", "put", "patch", "delete"];

      // Get the reCAPTCHA token
      const recaptchaToken = getRecaptchaToken();

      if (config.method) {
        // For GET requests, add token as query parameter
        if (config.method.toLowerCase() === 'get') {
          const separator = config.url?.includes('?') ? '&' : '?';
          config.url = `${config.url}${separator}recaptchaToken=${encodeURIComponent(recaptchaToken)}`;

          // Log in development environment
          // if (isDevEnvironment()) {
          //   console.log(`Automatically added reCAPTCHA token to GET request: ${config.url}`);
          // }
        }
        // For mutation methods (POST, PUT, PATCH, DELETE)
        else if (mutationMethods.includes(config.method.toLowerCase())) {
          // For DELETE without body, add token to URL
          if (config.method.toLowerCase() === 'delete') {
            const separator = config.url?.includes('?') ? '&' : '?';
            config.url = `${config.url}${separator}recaptchaToken=${encodeURIComponent(recaptchaToken)}`;
          }
          // For other methods with body, add to body
          else if (config.data) {
            if (typeof config.data === 'string') {
              try {
                const data = JSON.parse(config.data);
                // Only add if not already present
                if (!data.recaptchaToken) {
                  data.recaptchaToken = recaptchaToken;
                  config.data = JSON.stringify(data);
                }
              } catch (e) {
                // If not valid JSON, skip
                console.warn('Unable to add reCAPTCHA token to non-JSON data');
              }
            } else {
              // Only add if not already present
              if (!config.data.recaptchaToken) {
                config.data.recaptchaToken = recaptchaToken;
              }
            }
          } else {
            // If no data, create new
            config.data = { recaptchaToken };
          }

          // Log in development environment
          // if (isDevEnvironment()) {
          //   console.log(`Automatically added reCAPTCHA token to ${config.method.toUpperCase()} request: ${config.url}`);
          // }
        }
      }

      return config;
    },
    function (error) {
      console.error("Request error:", error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
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

        if (error.response) {
          const { status, data } = error.response;
          const errorMessage = data?.message || "An unexpected error occurred";
          const errorCode = data?.code;

          // Check if it's a login-related request
          const isLoginRequest =
            error.config?.url?.includes("/auth/token") ||
            error.config?.url?.includes("/login");

          // Authentication errors (401)
          if (status === 401) {
            // For login attempts, don't show notification
            if (!isLoginRequest) {
              notification.error({
                message: "Authentication Error",
                description: "Your session has expired. Please log in again.",
                key: "auth-error",
              });
            }

            const customError: CustomErrorData = {
              isHandled: !isLoginRequest, // Mark as not handled for login forms
              originalError: error,
              message: isLoginRequest
                ? "Invalid username or password"
                : "Authentication error",
              errorCode,
              errorType: ErrorType.AUTHENTICATION,
            };

            return Promise.reject(customError);
          }

          // Validation errors (400)
          if (status === 400) {
            // Thêm kiểm tra đặc biệt cho lỗi RECAPTCHA_REQUIRED
            if (data?.message === "RECAPTCHA_REQUIRED" || errorCode === 4000) {
              const customError: CustomErrorData = {
                isHandled: false,
                message: "ReCAPTCHA verification required. Please try again.",
                originalError: error,
                errorCode,
                errorType: ErrorType.VALIDATION,
              };
              notification.error({
                message: "Verification Required",
                description: "ReCAPTCHA verification failed. Please refresh the page and try again.",
                key: "recaptcha-error",
              });
              return Promise.reject(customError);
            }

            // Special handling for password mismatch
            if (errorCode === 4009) {
              const customError: CustomErrorData = {
                isHandled: false,
                field: "confirmPassword",
                message: errorMessage,
                originalError: error,
                errorCode,
                errorType: ErrorType.VALIDATION,
              };
              return Promise.reject(customError);
            }

            // For login forms, don't show notifications
            if (!isLoginRequest) {
              notification.error({
                message: "Validation Error",
                description: errorMessage,
                key: "validation-error",
              });
            }

            // Map error codes to fields
            let field: string | undefined = undefined;

            switch (errorCode) {
              case 4001:
                field = "email";
                break;
              case 4002:
                field = errorMessage.toLowerCase().includes("email")
                  ? "email"
                  : "password";
                break;
              case 4003:
                field = "password";
                break;
              case 4004:
                field = "firstname";
                break;
              case 4005:
                field = "lastname";
                break;
              case 4006:
              case 4007:
                field = "dob";
                break;
              case 4008:
                field = "roles";
                break;
              default:
                field = undefined;
            }

            // For login attempts, return generic error
            if (isLoginRequest) {
              const customError: CustomErrorData = {
                isHandled: false,
                message: "Invalid username or password",
                originalError: error,
                errorType: ErrorType.VALIDATION,
              };
              return Promise.reject(customError);
            }

            // Don't mark as handled so components can process field errors
            return Promise.reject({
              field,
              message: errorMessage,
              errorCode,
              originalError: error,
              errorType: ErrorType.VALIDATION,
            });
          }

          // Conflict errors (409)
          if (status === 409) {
            let field: string | undefined = undefined;

            // Check for specific conflicts
            if (
              errorCode === 5001 ||
              errorMessage.toLowerCase().includes("email")
            ) {
              notification.error({
                message: "Registration Error",
                description:
                  "This email is already registered. Please use a different email address.",
                key: "email-conflict-error",
              });
              field = "email";
            } else if (
              errorCode === 4090 ||
              errorMessage.toLowerCase().includes("user") ||
              errorMessage.toLowerCase().includes("username")
            ) {
              notification.error({
                message: "Registration Error",
                description:
                  "This username is already taken. Please choose a different username.",
                key: "username-conflict-error",
              });
              field = "username";
            } else {
              notification.error({
                message: "Conflict Error",
                description: errorMessage,
                key: "conflict-error",
              });
            }

            // ĐẶT isHandled = true để component không hiển thị thêm notification
            const customError: CustomErrorData = {
              field,
              message: errorMessage,
              originalError: error,
              errorCode,
              errorType: ErrorType.CONFLICT,
              isHandled: true,
            };

            return Promise.reject(customError);
          }

          // Not found errors (404)
          if (status === 404) {
            // For login attempts, don't show notifications
            if (isLoginRequest || error.config?.url?.includes("/auth/")) {
              const customError: CustomErrorData = {
                isHandled: false,
                message: "Invalid username or password", // Generic message for security
                originalError: error,
                errorCode,
                errorType: ErrorType.NOT_FOUND,
              };
              return Promise.reject(customError);
            } else {
              // Other not found errors
              notification.error({
                message: "Not Found",
                description: errorMessage,
                key: "not-found-error",
              });

              const customError: CustomErrorData = {
                isHandled: true,
                originalError: error,
                errorCode,
                errorType: ErrorType.NOT_FOUND,
              };
              return Promise.reject(customError);
            }
          }

          // Server errors (500+)
          if (status >= 500) {
            notification.error({
              message: "Server Error",
              description:
                "The server encountered an error. Please try again later.",
              key: "server-error",
            });

            const customError: CustomErrorData = {
              isHandled: true,
              originalError: error,
              errorCode,
              errorType: ErrorType.SERVER_ERROR,
            };
            return Promise.reject(customError);
          }
        }

        // Network errors
        if (error.code === "ERR_NETWORK") {
          notification.error({
            message: "Network Error",
            description:
              "Unable to connect to the server. Please check your internet connection.",
            key: "network-error",
          });

          const customError: CustomErrorData = {
            isHandled: true,
            originalError: error,
            errorType: ErrorType.NETWORK_ERROR,
          };
          return Promise.reject(customError);
        }

        // Other axios errors
        notification.error({
          message: "Error",
          description: error.message || "An unexpected error occurred",
          key: "general-error",
        });

        const customError: CustomErrorData = {
          isHandled: true,
          originalError: error,
          errorType: ErrorType.UNKNOWN,
        };
        return Promise.reject(customError);
      }

      // Non-Axios errors
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

