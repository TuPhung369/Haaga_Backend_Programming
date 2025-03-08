// src/services/baseService.ts
import axios, { AxiosError } from "axios";
import { CustomErrorData } from "../type/types";

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
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Define what the interceptor adds to error objects
interface InterceptorErrorData {
  isHandled?: boolean;
  originalError?: unknown;
  field?: string;
  message?: string;
  errorCode?: number;
}

// Combined type for axios response data that might include interceptor data
interface EnhancedErrorResponseData
  extends ErrorResponseData,
    InterceptorErrorData {}

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
  code?: number;
  field?: string;
  metadata?: Record<string, unknown>;
  originalError?: unknown;
  isHandled?: boolean;
  errorType?: ErrorType;
  httpStatus?: number;
  severity?: string;

  constructor(message: string, options?: Partial<ServiceError>) {
    super(message);
    this.name = "ServiceError";
    Object.assign(this, options);

    // If code is provided but errorType isn't, determine error type from code
    if (this.code && !this.errorType) {
      this.errorType = this.determineErrorType(this.code);
    }
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

// Common error handler for all services
export const handleServiceError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponseData>;

    // Check if this error was already handled by the interceptor
    if (axiosError.response?.data && "isHandled" in axiosError.response.data) {
      const responseData = axiosError.response
        .data as EnhancedErrorResponseData;

      if (responseData.isHandled) {
        const originalError = responseData.originalError || axiosError;
        const errorMessage =
          typeof originalError === "object" &&
          originalError !== null &&
          "message" in originalError
            ? String(originalError.message)
            : responseData.message || "Error already handled";

        const status = axiosError.response?.status;
        let errorType: ErrorType;
        switch (status) {
          case 400:
            errorType = ErrorType.VALIDATION;
            break;
          case 401:
          case 403:
            errorType = ErrorType.AUTHENTICATION;
            break;
          case 404:
            errorType = ErrorType.NOT_FOUND;
            break;
          case 409:
            errorType = ErrorType.CONFLICT;
            break;
          case 500:
          case 502:
          case 503:
            errorType = ErrorType.SERVER_ERROR;
            break;
          default:
            errorType = ErrorType.UNKNOWN;
        }

        throw new ServiceError(errorMessage, {
          isHandled: true,
          code: responseData.code || responseData.errorCode,
          field: responseData.field,
          originalError: originalError,
          errorType: errorType,
        });
      }
    }

    const status = axiosError.response?.status;
    const data = axiosError.response?.data;

    let errorType: ErrorType;
    switch (status) {
      case 400:
        errorType = ErrorType.VALIDATION;
        break;
      case 401:
      case 403:
        errorType = ErrorType.AUTHENTICATION;
        break;
      case 404:
        errorType = ErrorType.NOT_FOUND;
        break;
      case 409:
        errorType = ErrorType.CONFLICT;
        break;
      case 500:
      case 502:
      case 503:
        errorType = ErrorType.SERVER_ERROR;
        break;
      default:
        errorType = ErrorType.UNKNOWN;
    }

    const serviceError = new ServiceError(
      data?.message || "An unexpected error occurred",
      {
        code: data?.code,
        httpStatus: status,
        field: data?.metadata?.field,
        metadata: data?.metadata,
        severity: data?.severity,
        errorType: errorType,
        originalError: error,
      }
    );
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
        code: customError.errorCode,
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

