// src/utils/tokenRefresh.ts
import { refreshTokenFromCookie } from "../services/authService";
import { setAuthData } from "../store/authSlice";
import { resetAllData } from "../store/resetActions";
import store from "../store/store";
import { ApiResponse } from "../types/ApiTypes";
import { RefreshTokenResponse } from "../types/AuthTypes";
import { notification } from "antd"; // Import notification from Antd

// Define error types to avoid using 'any'
interface ServiceErrorResponse {
  message?: string;
  errorCode?: number;
  httpStatus?: number;
  originalError?: AxiosErrorResponse;
  field?: string;
}

interface AxiosErrorResponse {
  response?: {
    status?: number;
    data?: unknown;
  };
}

// Helper function to safely check status codes
const hasStatusCode = (error: unknown, statusCode: number): boolean => {
  if (!error || typeof error !== "object") return false;

  // Direct status check
  if (
    "httpStatus" in error &&
    (error as ServiceErrorResponse).httpStatus === statusCode
  ) {
    return true;
  }

  // Check in originalError.response.status
  if (
    "originalError" in error &&
    (error as ServiceErrorResponse).originalError
  ) {
    const originalError = (error as ServiceErrorResponse).originalError;
    if (
      originalError &&
      originalError.response &&
      originalError.response.status === statusCode
    ) {
      return true;
    }
  }

  // Check in message
  if (
    "message" in error &&
    typeof (error as { message: string }).message === "string" &&
    (error as { message: string }).message.includes(statusCode.toString())
  ) {
    return true;
  }

  return false;
};

// Refresh token 10 minutes before expiration to be safe
// This gives us a 10-minute safety buffer
const REFRESH_SAFETY_BUFFER = 10 * 60 * 1000; // 10 minutes in milliseconds

// Default refresh interval - refresh every 50 minutes if no expiration info
const DEFAULT_REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minutes

// Shorter retry interval if refresh fails - gradually increase with backoff
const INITIAL_RETRY_INTERVAL = 30 * 1000; // 30 seconds
const MAX_RETRY_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Maximum retry attempts before giving up
const MAX_RETRY_ATTEMPTS = 3;

// Track retry attempts
let retryAttempts = 0;
let currentRetryInterval = INITIAL_RETRY_INTERVAL;

type NodeJSTimeout = ReturnType<typeof setTimeout>;

let refreshTimer: NodeJSTimeout | null = null;
let refreshInProgress = false;
let isRefreshingForced = false; // Track if this is a manual refresh

/**
 * Sets up automatic token refresh based on token expiration
 * @param token Current access token
 * @param expiresInMs Optional token expiration time in milliseconds
 */
export const setupTokenRefresh = (
  token: string,
  expiresInMs?: number
): void => {
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
    console.log(
      `Setting up token refresh in ${
        refreshInterval / (60 * 1000)
      } minutes (token expires in ${expiresInMs / (60 * 1000)} minutes)`
    );
  }

  // Schedule refresh
  refreshTimer = setTimeout(refreshToken, refreshInterval);
};

/**
 * Refreshes the access token using the refresh token cookie
 * Can be called manually to force refresh
 * @param force If true, marks this as a manual refresh attempt
 */
export const refreshToken = async (
  force: boolean = false
): Promise<boolean> => {
  // Set force flag
  isRefreshingForced = force;

  // Prevent multiple simultaneous refresh attempts
  if (refreshInProgress) {
    console.log("Token refresh already in progress");
    return false;
  }

  refreshInProgress = true;
  console.log(`Starting token refresh process... ${force ? "(FORCED)" : ""}`);

  try {
    console.log("Calling refreshTokenFromCookie API...");

    const response: ApiResponse<RefreshTokenResponse> =
      await refreshTokenFromCookie();
    console.log(
      "API response received:",
      response ? "Valid response" : "Empty response"
    );

    // Check if response contains token
    if (response?.result?.token) {
      console.log(
        "Token refreshed successfully, token length:",
        response.result.token.length
      );
      console.log("Expires in:", response.result.expiresIn, "seconds");

      // Reset retry counter on success
      retryAttempts = 0;
      currentRetryInterval = INITIAL_RETRY_INTERVAL;
      isRefreshingForced = false;

      // Store the new token
      store.dispatch(
        setAuthData({
          token: response.result.token,
          isAuthenticated: true,
          loginSocial: false,
        })
      );
      console.log("New token stored in Redux state");

      // Setup the next refresh
      const expiresInMs = response.result.expiresIn
        ? response.result.expiresIn * 1000
        : undefined;
      setupTokenRefresh(response.result.token, expiresInMs);
      console.log("Next token refresh scheduled");

      // Show subtle notification on successful refresh
      notification.success({
        message: "Session Extended",
        description: "Your session has been refreshed successfully.",
        duration: 3,
        placement: "bottomRight",
      });

      refreshInProgress = false;
      return true;
    } else {
      console.error("Invalid response from token refresh:", response);
      console.error("Response structure:", JSON.stringify(response, null, 2));
      handleRefreshError("Invalid response from server");
      return false;
    }
  } catch (error: unknown) {
    console.error("Error refreshing token:", error);

    // Log error details
    if (error && typeof error === "object") {
      console.error("Error type:", error.constructor.name);

      if ("message" in error) {
        console.error("Error message:", (error as { message: string }).message);
      }

      if ("originalError" in error) {
        console.error(
          "Original error:",
          (error as ServiceErrorResponse).originalError
        );
      }

      if ("httpStatus" in error) {
        console.error(
          "HTTP status:",
          (error as ServiceErrorResponse).httpStatus
        );
      }

      if ("response" in error) {
        console.error(
          "Response data:",
          (error as { response: { data: unknown; status: number } }).response
            ?.data
        );

        // Specific status code checks
        interface ErrorWithResponse {
          response?: {
            status?: number;
            data?: unknown;
          };
        }

        const errorWithResponse = error as ErrorWithResponse;
        const status = errorWithResponse.response?.status;

        // 401 Unauthorized - refresh token is expired or invalid
        if (status === 401) {
          console.error(
            "401 Unauthorized - Refresh token is expired or invalid"
          );

          // This is a "clean" error - the user needs to log in again
          notification.info({
            message: "Session Expired",
            description: "Your login session has expired. Please log in again.",
            duration: 5,
          });

          // Go directly to authentication expiry handler
          handleAuthenticationExpired();
          refreshInProgress = false;
          return false;
        }

        // 500 Internal Server Error - backend issue
        else if (status === 500) {
          console.error("Server error (500) detected during token refresh");
          // For manual refresh attempts with 500 errors, show a notification
          if (isRefreshingForced) {
            notification.error({
              message: "Server Error",
              description:
                "The server encountered an error processing your request. Please try again later.",
              duration: 5,
              placement: "bottomRight",
            });
          }
        }
      }
    }

    // More general check if we should forcefully redirect to login page
    const isAuthError = hasStatusCode(error, 401);
    const isServerError = hasStatusCode(error, 500);

    if (isAuthError) {
      console.log("Authentication error detected. Session expired.");
      handleAuthenticationExpired();
    } else if (isServerError) {
      console.log(
        "Server error during token refresh, will retry with shorter interval"
      );
      handleRefreshError("Server temporarily unavailable", true);
    } else {
      handleRefreshError("Failed to refresh session");
    }

    isRefreshingForced = false;
    refreshInProgress = false;
    return false;
  }
};

/**
 * Handle expired authentication by redirecting to login
 */
const handleAuthenticationExpired = (): void => {
  refreshInProgress = false;

  // Show error notification
  notification.info({
    message: "Session Expired",
    description:
      "Your session has expired. Please log in again to continue using the application.",
    duration: 0, // Don't auto-dismiss
    key: "auth-expired-notification",
  });

  // Clear all auth data
  store.dispatch(resetAllData());

  // Redirect to login page after a short delay
  setTimeout(() => {
    // If we're already on the login page, just refresh it
    if (window.location.pathname.includes("/login")) {
      window.location.reload();
    } else {
      window.location.href = "/login";
    }
  }, 100);
};

/**
 * Handle refresh error by retrying or showing notification
 */
const handleRefreshError = (
  errorMessage: string,
  isServerError = false
): void => {
  refreshInProgress = false;
  retryAttempts++;

  // If we've exceeded max retries or this is a forced refresh that failed, log user out
  if (retryAttempts > MAX_RETRY_ATTEMPTS || isRefreshingForced) {
    // If we're specifically refreshing manually and fail, it's a critical error
    if (isRefreshingForced) {
      console.error("Manual token refresh failed after maximum attempts");
      notification.error({
        message: "Session Error",
        description: "Could not refresh your session. Please log in again.",
        duration: 0,
      });

      // Force logout
      handleAuthenticationExpired();
      return;
    }

    console.log(
      `Token refresh failed after ${retryAttempts} attempts. Logging out.`
    );

    // Reset variables
    refreshInProgress = false;
    retryAttempts = 0;
    currentRetryInterval = INITIAL_RETRY_INTERVAL;

    // Redirect to login
    handleAuthenticationExpired();
    return;
  }

  // Implement exponential backoff for retries
  const backoffFactor = Math.pow(2, retryAttempts - 1);
  let retryTime = Math.min(
    currentRetryInterval * backoffFactor,
    MAX_RETRY_INTERVAL
  );

  // Server errors get a slightly shorter retry time to recover faster from temporary issues
  if (isServerError) {
    retryTime = Math.max(retryTime / 2, INITIAL_RETRY_INTERVAL);
  }

  // Update the current retry interval for next time
  currentRetryInterval = retryTime;

  // Schedule retry
  console.log(
    `Scheduling token refresh retry (${retryAttempts}/${MAX_RETRY_ATTEMPTS}) in ${
      retryTime / 1000
    } seconds`
  );
  refreshTimer = setTimeout(refreshToken, retryTime);

  // Show warning notification
  notification.warning({
    message: "Session Refresh Warning",
    description: `${errorMessage}. Retrying in ${Math.round(
      retryTime / 1000
    )} seconds...`,
    duration: 5,
    placement: "bottomRight",
  });
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

