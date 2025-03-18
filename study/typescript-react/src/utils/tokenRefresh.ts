// src/utils/tokenRefresh.ts
import { refreshTokenFromCookie } from "../services/authService";
import { setAuthData } from "../store/authSlice";
import store from "../store/store";
import { ApiResponse, RefreshTokenResponse } from "../type/types";
import { notification } from "antd"; // Import notification from Antd

// Refresh token 10 minutes before expiration to be safe
// This gives us a 10-minute safety buffer
const REFRESH_SAFETY_BUFFER = 10 * 60 * 1000; // 10 minutes in milliseconds 

// Default refresh interval - refresh every 50 minutes if no expiration info
const DEFAULT_REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minutes

// Shorter retry interval if refresh fails - 1 minute
const RETRY_AFTER_ERROR = 60 * 1000; // 1 minute

// Maximum retry attempts before giving up
const MAX_RETRY_ATTEMPTS = 3;

// Track retry attempts
let retryAttempts = 0;

type NodeJSTimeout = ReturnType<typeof setTimeout>;

let refreshTimer: NodeJSTimeout | null = null;
let refreshInProgress = false;

/**
 * Sets up automatic token refresh based on token expiration
 * @param token Current access token
 * @param expiresInMs Optional token expiration time in milliseconds
 */
export const setupTokenRefresh = (token: string, expiresInMs?: number): void => {
  if (!token) {
    console.log("No token provided to setupTokenRefresh");
    return;
  }

  // Clear any existing timer
  clearTokenRefresh();

  // Reset retry counter
  retryAttempts = 0;

  // Calculate when to refresh, ensuring we have a valid number
  let refreshInterval: number;

  if (!expiresInMs || isNaN(expiresInMs) || expiresInMs <= 0) {
    refreshInterval = DEFAULT_REFRESH_INTERVAL;
  } else {
    // Refresh 10 minutes before expiration or half the token lifetime, whichever is smaller
    const safeBuffer = Math.min(REFRESH_SAFETY_BUFFER, expiresInMs / 2);
    refreshInterval = Math.max(expiresInMs - safeBuffer, 5000); // At least 5 seconds
    console.log(`Setting up token refresh in ${refreshInterval / (60 * 1000)} minutes (token expires in ${expiresInMs / (60 * 1000)} minutes)`);
  }

  // Schedule refresh
  refreshTimer = setTimeout(refreshToken, refreshInterval);
};

/**
 * Refreshes the access token using the refresh token cookie
 * Can be called manually to force refresh
 */
export const refreshToken = async (): Promise<boolean> => {
  // Prevent multiple simultaneous refresh attempts
  if (refreshInProgress) {
    console.log("Token refresh already in progress");
    return false;
  }

  refreshInProgress = true;

  try {
    console.log("Refreshing token...");
    const response: ApiResponse<RefreshTokenResponse> = await refreshTokenFromCookie();

    // Check if response contains token
    if (response?.result?.token) {
      console.log("Token refreshed successfully");

      // Reset retry counter on success
      retryAttempts = 0;

      // Store the new token
      store.dispatch(
        setAuthData({
          token: response.result.token,
          isAuthenticated: true,
          loginSocial: false,
        })
      );

      // Setup the next refresh
      const expiresInMs = response.result.expiresIn ? response.result.expiresIn * 1000 : undefined;
      setupTokenRefresh(response.result.token, expiresInMs);

      // Show subtle notification on successful refresh
      notification.success({
        message: "Session Extended",
        description: "Your session has been refreshed successfully.",
        duration: 3,
        placement: "bottomRight"
      });

      refreshInProgress = false;
      return true;
    } else {
      console.error("Invalid response from token refresh:", response);
      handleRefreshError("Invalid response from server");
      return false;
    }
  } catch (error: unknown) {
    console.error("Error refreshing token:", error);

    // Check if it's a server error (500)
    let isServerError = false;

    // Check for ServiceError with httpStatus
    if (
      error &&
      typeof error === 'object' &&
      error !== null &&
      'httpStatus' in error &&
      typeof error.httpStatus === 'number' &&
      error.httpStatus === 500
    ) {
      isServerError = true;
    }

    // Check for error with message containing "500"
    if (
      error &&
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string' &&
      error.message.includes("500")
    ) {
      isServerError = true;
    }

    // Check for error with originalError.response.status === 500
    if (
      error &&
      typeof error === 'object' &&
      error !== null &&
      'originalError' in error &&
      error.originalError &&
      typeof error.originalError === 'object' &&
      error.originalError !== null &&
      'response' in error.originalError &&
      error.originalError.response &&
      typeof error.originalError.response === 'object' &&
      error.originalError.response !== null &&
      'status' in error.originalError.response &&
      error.originalError.response.status === 500
    ) {
      isServerError = true;
    }

    if (isServerError) {
      console.log("Server error during token refresh, will retry with shorter interval");
      handleRefreshError("Server temporarily unavailable", true);
    } else {
      handleRefreshError("Failed to refresh session");
    }

    refreshInProgress = false;
    return false;
  }
};

/**
 * Handle refresh error by retrying or showing notification
 */
const handleRefreshError = (errorMessage: string, isServerError = false): void => {
  refreshInProgress = false;
  retryAttempts++;

  // Use a shorter retry time for server errors to recover faster
  const retryTime = isServerError ? RETRY_AFTER_ERROR / 2 : RETRY_AFTER_ERROR;

  if (retryAttempts <= MAX_RETRY_ATTEMPTS) {
    // Schedule retry
    console.log(`Scheduling token refresh retry (${retryAttempts}/${MAX_RETRY_ATTEMPTS}) in ${retryTime / 1000} seconds`);
    refreshTimer = setTimeout(refreshToken, retryTime);

    // Show warning notification
    notification.warning({
      message: "Session Refresh Warning",
      description: `${errorMessage}. Retrying in ${retryTime / 1000} seconds...`,
      duration: 5,
      placement: "bottomRight"
    });
  } else {
    // Max retries reached, show error notification
    notification.error({
      message: "Session Expired",
      description: "Unable to refresh your session. Please log in again.",
      duration: 0 // Don't auto-dismiss
    });
  }
};

/**
 * Clears the refresh timer when logging out
 */
export const clearTokenRefresh = (): void => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
};

