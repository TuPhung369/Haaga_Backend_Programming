// src/services/baseService.ts
import { AxiosError } from "axios";
import { CustomErrorData } from "../types/ApiTypes";
import { refreshToken } from "../utils/tokenRefresh";
import store from "../store/store";

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
    const axiosError = error as AxiosError;
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
