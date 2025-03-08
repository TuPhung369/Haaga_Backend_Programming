// src/hooks/useFieldErrors.ts
import { useState, useCallback } from "react";
import { ServiceError } from "../services/baseService";
import axios from "axios";

// Define interface for field errors
interface FieldError {
  field: string;
  message: string;
  [key: string]: unknown; // Allow for additional properties
}

export function useFieldErrors() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Set an error for a specific field
  const setFieldError = useCallback((field: string, message: string) => {
    setFieldErrors((prev) => ({
      ...prev,
      [field]: message,
    }));
  }, []);

  // Clear an error for a specific field
  const clearFieldError = useCallback((field: string) => {
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Clear all field errors
  const clearAllFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  // Process API error response with proper typing
  const processApiError = useCallback(
    (error: ServiceError | null) => {
      if (!error) return;

      // If the error was already handled by interceptors, we might not need to process it
      if (error.isHandled) return;

      // Set new field error if available
      if (error.field) {
        setFieldError(error.field, error.message || "An error occurred");
      }

      // Process field errors from metadata if available
      if (error.metadata) {
        // Field errors in metadata
        if (error.metadata.field && typeof error.metadata.field === "string") {
          setFieldError(
            error.metadata.field,
            (error.metadata.message as string) ||
              error.message ||
              "Invalid input"
          );
        }

        // Array of errors
        if (error.metadata.errors && Array.isArray(error.metadata.errors)) {
          const errors = error.metadata.errors as Array<FieldError>;
          errors.forEach((err) => {
            if (err.field && err.message) {
              setFieldError(err.field, err.message);
            }
          });
        }
      }

      // Process errors from the original error's response data if available
      if (error.originalError && axios.isAxiosError(error.originalError)) {
        const axiosError = error.originalError;
        const responseData = axiosError.response?.data;

        if (responseData?.errors && Array.isArray(responseData.errors)) {
          responseData.errors.forEach((err: FieldError) => {
            if (err.field && err.message) {
              setFieldError(err.field, err.message);
            }
          });
        }
      }
    },
    [setFieldError]
  );

  return {
    fieldErrors,
    setFieldError,
    clearFieldError,
    clearAllFieldErrors,
    processApiError,
  };
}