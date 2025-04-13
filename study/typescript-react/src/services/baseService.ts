// src/services/baseService.ts
import axios, {
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosRequestHeaders,
} from "axios";
import { notification } from "antd";
import { AxiosError as OriginalAxiosError } from "axios";
import { CustomErrorData } from "../types/ApiTypes";
import { refreshToken, refreshTokenIfNeeded } from "../utils/tokenRefresh";
import store from "../store/store";
import { resetAllData } from "../store/resetActions";

// Base URL for API requests - use environment variable if available
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9095";

// Create axios instance with default configuration
export const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Always send cookies with requests
});

// Request interceptor for adding auth token
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Check if token needs refreshing before sending request
      // Skip for auth endpoints to prevent loops
      if (
        config.url &&
        !config.url.includes("/auth/login") &&
        !config.url.includes("/auth/refresh") &&
        !config.url.includes("/auth/register")
      ) {
        // Check and refresh token if needed before proceeding with request
        await refreshTokenIfNeeded();
      }

      // Get the current auth state from Redux
      const authState = store.getState().auth;
      const token = authState.token;

      // Add token to request if available
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      console.error("Error in request interceptor:", error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling common errors
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    // Only handle api errors, not network errors
    if (!error.response) {
      if (error.message === "Network Error") {
        notification.error({
          message: "Network Error",
          description: "Please check your internet connection.",
        });
      }
      return Promise.reject(error);
    }

    const { status } = error.response;

    // Handle specific HTTP status codes
    switch (status) {
      case 401: // Unauthorized
        // Don't show error for auth endpoints
        if (
          error.config?.url &&
          (error.config.url.includes("/auth/refresh") ||
            error.config.url.includes("/auth/login"))
        ) {
          // Silent fail for auth endpoints
          return Promise.reject(error);
        }

        // Try to refresh token and retry request
        try {
          const refreshed = await refreshToken(true);

          if (refreshed && error.config) {
            // Get fresh token from Redux store after refresh
            const newToken = store.getState().auth.token;

            // Create new request config with fresh token
            const newRequestConfig = {
              ...error.config,
              headers: {
                ...(error.config.headers || {}),
                Authorization: `Bearer ${newToken}`,
              } as AxiosRequestHeaders,
            };

            // Retry original request with new token
            console.log("Retrying request with fresh token");
            return axiosInstance(newRequestConfig);
          }
        } catch (refreshError) {
          console.error("Failed to refresh token:", refreshError);
        }

        // If refresh fails, log out user
        notification.error({
          message: "Authentication Error",
          description: "Session expired. Please log in again.",
          duration: 5,
        });

        store.dispatch(resetAllData());

        // Redirect to login page
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
        break;

      case 403: // Forbidden
        notification.error({
          message: "Access Denied",
          description: "You don't have permission to access this resource.",
        });
        break;
    }

    return Promise.reject(error);
  }
);

// Define a more specific response data type matching server error format
interface ErrorResponseData {
  code?: number;
  message?: string;
  httpStatus?: string;
  httpCode?: string;
  severity?: string;
  metadata?: {
    field?: string;
    message?: string;
    errors?: Array<{ field: string; message: string; [key: string]: unknown }>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Error type mapping based on server's error codes
export enum ErrorType {
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  SERVER_ERROR = "SERVER_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  UNKNOWN = "UNKNOWN",
}

// Base class for error handling
export class ServiceError extends Error {
  errorType: ErrorType;
  field?: string;
  isHandled?: boolean;
  code?: string;
  errorCode?: string;
  originalError?: unknown;
  httpStatus?: number;
  severity?: string;
  remainingAttempts?: number;
  metadata?: ErrorResponseData["metadata"]; // Thêm metadata

  constructor(message: string, options?: Partial<ServiceError>) {
    super(message);
    this.name = "ServiceError";
    this.errorType = options?.errorType || ErrorType.UNKNOWN;

    if (options) {
      this.field = options.field;
      this.isHandled = options.isHandled;
      this.code = options.code;
      this.errorCode = options.errorCode;
      this.originalError = options.originalError;
      this.httpStatus = options.httpStatus;
      this.severity = options.severity;
      this.remainingAttempts = options.remainingAttempts;
      this.metadata = options.metadata; // Gán metadata
    }

    Object.setPrototypeOf(this, ServiceError.prototype);
  }

  /**
   * Get remaining attempts if available
   */
  getRemainingAttempts(): number | undefined {
    return this.remainingAttempts;
  }

  private determineErrorType(code: number): ErrorType {
    if (code >= 4000 && code < 4010) return ErrorType.VALIDATION;
    if (code >= 4010 && code < 4020) return ErrorType.AUTHENTICATION;
    if (code >= 4040 && code < 4050) return ErrorType.NOT_FOUND;
    if ((code >= 4090 && code < 4100) || code === 5001)
      return ErrorType.CONFLICT;
    if (code >= 5000) return ErrorType.SERVER_ERROR;
    return ErrorType.UNKNOWN;
  }
}

// Add this function to handle 401 errors
export const handle401Error = async (error: unknown): Promise<boolean> => {
  if (
    error instanceof Error &&
    "response" in error &&
    (error as { response?: { status?: number } }).response?.status === 401
  ) {
    console.log("Detected 401 error, attempting token refresh");
    try {
      await refreshToken();
      const newToken = store.getState().auth.token;

      if (newToken) {
        console.log("Token refreshed successfully, retrying request");
        return true;
      }
    } catch (refreshError) {
      console.error("Failed to refresh token:", refreshError);
    }
  }
  return false;
};

// Common error handler for all services
export const handleServiceError = (error: unknown): never => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response
  ) {
    const axiosError = error as OriginalAxiosError;
    const responseData = axiosError.response?.data as ErrorResponseData;

    console.log("Handle API error response:", responseData);

    let field: string | undefined = undefined;
    let errorType = ErrorType.UNKNOWN;
    let errorMessage = "An unexpected error occurred";
    let errorCode: string | undefined = undefined;
    let remainingAttempts: number | undefined = undefined;
    let metadata: ErrorResponseData["metadata"] | undefined = undefined;

    if (
      typeof responseData === "object" &&
      responseData !== null &&
      "message" in responseData
    ) {
      errorMessage = responseData.message as string;

      if ("remainingAttempts" in responseData) {
        remainingAttempts = responseData.remainingAttempts as number;
      } else if (
        "extraInfo" in responseData &&
        responseData.extraInfo &&
        typeof responseData.extraInfo === "object" &&
        "remainingAttempts" in responseData.extraInfo
      ) {
        remainingAttempts = responseData.extraInfo.remainingAttempts as number;
      }

      if ("errorCode" in responseData) {
        errorCode = responseData.errorCode as string;
      } else if ("code" in responseData) {
        errorCode = String(responseData.code);
      }

      if (
        axiosError.response?.status === 400 ||
        errorMessage.toLowerCase().includes("invalid") ||
        errorMessage.toLowerCase().includes("validation")
      ) {
        errorType = ErrorType.VALIDATION;
      } else if (axiosError.response?.status === 401) {
        errorType = ErrorType.AUTHENTICATION;
      } else if (axiosError.response?.status === 404) {
        errorType = ErrorType.NOT_FOUND;
      } else if (axiosError.response?.status === 409) {
        errorType = ErrorType.CONFLICT;
      } else if (
        axiosError.response?.status &&
        axiosError.response.status >= 500
      ) {
        errorType = ErrorType.SERVER_ERROR;
      }

      // Gán metadata từ responseData
      if (responseData.metadata) {
        metadata = responseData.metadata;
        if (metadata.field) {
          field = metadata.field as string;
        }
      }
    }

    const serviceError = new ServiceError(errorMessage, {
      field,
      errorType,
      errorCode,
      originalError: error,
      httpStatus: axiosError.response?.status,
      remainingAttempts,
      metadata, // Thêm metadata vào ServiceError
    });

    if (axiosError.response?.status === 401) {
      console.error("Authentication error occurred:", error);
      handle401Error(error).catch((err) =>
        console.error("Error while handling 401:", err)
      );
    }

    throw serviceError;
  } else if (
    typeof error === "object" &&
    error !== null &&
    "isHandled" in error
  ) {
    const customError = error as CustomErrorData;
    const serviceError = new ServiceError(
      customError.message || "An unexpected error occurred",
      {
        code: String(customError.errorCode),
        field: customError.field,
        originalError: customError.originalError,
        isHandled: customError.isHandled,
        errorType: customError.errorType || ErrorType.UNKNOWN,
      }
    );
    throw serviceError;
  } else if (
    error instanceof Error &&
    error.message.includes("Network Error")
  ) {
    throw new ServiceError(
      "Network Error. Please check your internet connection.",
      {
        errorType: ErrorType.NETWORK_ERROR,
        originalError: error,
      }
    );
  } else if (error instanceof ServiceError) {
    throw error;
  } else {
    throw new ServiceError("An unexpected error occurred", {
      errorType: ErrorType.UNKNOWN,
      originalError: error,
    });
  }
};

