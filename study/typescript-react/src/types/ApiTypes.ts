// src/types/ApiTypes.ts
// Types related to API requests and responses

import { ErrorType } from "../services/baseService";

export interface ApiResponse<T> {
  code: number;
  message?: string;
  result: T;
  httpStatus?: string;
  httpCode?: string;
  severity?: string;
  metadata?: Record<string, unknown>;
}

export interface ApiError {
  isHandled?: boolean;
  field?: string;
  message?: string;
  status?: number;
  code?: number;
  metadata?: Record<string, unknown>;
  originalError?: unknown;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  field?: string;
  message?: string;
  originalError?: {
    response?: {
      data?: {
        message?: string;
        errors?: FieldError[];
      };
    };
  };
  metadata?: Record<string, unknown>;
}

export interface ExtendApiError extends ApiError {
  errorType?: "CREATE" | "FETCH" | "DELETE" | "UPDATE";
  details?: string;
}

export interface GenericResponse {
  code: number;
  message?: string;
}

export interface CustomErrorData {
  isHandled?: boolean;
  field?: string;
  message?: string;
  originalError?: unknown;
  errorCode?: number;
  errorType?: ErrorType;
}
