// src/utils/authUtils.ts
import { notification } from "antd";
import { ExtendApiError } from "../type/types";

/**
 * Shows a user-friendly error notification based on an API error
 * @param error The error object thrown by a service
 * @param fallbackTitle Default title to show if no specific error info is available
 * @param fallbackDescription Default description to show if no specific error info is available
 */
export const showErrorNotification = (
  error: unknown,
  fallbackTitle = "Error",
  fallbackDescription = "An unexpected error occurred. Please try again."
): void => {
  const errorObject = error as ExtendApiError;

  // Determine the message to show
  const title = errorObject?.message
    ? getErrorTitle(errorObject)
    : fallbackTitle;

  // Determine the description to show
  const description = errorObject?.details || fallbackDescription;

  notification.error({
    message: title,
    description,
    duration: 5, // Show for 5 seconds
  });
};

/**
 * Returns an appropriate error title based on the error type and message
 */
const getErrorTitle = (error: ExtendApiError): string => {
  // If we have a specific message, use it
  if (error.message) {
    return error.message;
  }

  // Otherwise, generate a title based on error type
  switch (error.errorType) {
    case "CREATE":
      return "Creation Failed";
    case "UPDATE":
      return "Update Failed";
    case "DELETE":
      return "Deletion Failed";
    case "FETCH":
      return "Failed to Load Data";
    default:
      return "Error";
  }
};

/**
 * Handles API errors in a consistent way, includes optional callback
 * @param error The error object from catch block
 * @param showNotification Whether to show a notification (true by default)
 * @param callback Optional callback to run after error handling
 */
export const handleApiError = (
  error: unknown,
  showNotification = true,
  callback?: () => void
): void => {
  // First, log the error to console for debugging
  console.error("API Error:", error);

  if (showNotification) {
    showErrorNotification(error);
  }

  // Run callback if provided
  if (callback && typeof callback === "function") {
    callback();
  }
};

/**
 * Checks if the token is still valid or has expired
 * @param token JWT token to check
 * @returns Boolean indicating if token is valid (not expired)
 */
export const isTokenValid = (token: string): boolean => {
  if (!token) return false;

  try {
    // Get the expiration from the token payload
    const payload = token.split(".")[1];
    if (!payload) return false;

    const decodedPayload = JSON.parse(atob(payload));
    const expirationTime = decodedPayload.exp * 1000; // Convert to milliseconds

    return Date.now() < expirationTime;
  } catch (e) {
    console.error("Error checking token validity:", e);
    return false;
  }
};

/**
 * Utility to get token from localStorage
 */
export const getToken = (): string | null => {
  try {
    const authStateString = localStorage.getItem("authState");
    if (authStateString) {
      const authState = JSON.parse(authStateString);
      return authState.auth?.token || null;
    }
    return null;
  } catch (e) {
    console.error("Error getting token from localStorage:", e);
    return null;
  }
};

