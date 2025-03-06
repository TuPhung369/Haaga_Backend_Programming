// src/utils/tokenRefresh.ts
import { refreshTokenFromCookie } from "../services/authService";
import { setAuthData } from "../store/authSlice";
import store from "../store/store";
import { ApiResponse, RefreshTokenResponse } from "../type/types";

// Fixed refresh interval - refresh every 50 minutes
const REFRESH_INTERVAL = 50 * 60 * 1000;

type NodeJSTimeout = ReturnType<typeof setTimeout>;

// Then use it as before
let refreshTimer: NodeJSTimeout | null = null;

/**
 * Sets up automatic token refresh at fixed intervals
 * @param token Current access token
 */
export const setupTokenRefresh = (token: string): void => {
  if (!token) {
    console.log("No token provided to setupTokenRefresh");
    return;
  }

  // Clear any existing timer
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  // console.log(
  //   `Setting up token refresh at fixed interval of ${
  //     REFRESH_INTERVAL / (60 * 1000)
  //   } minutes`
  // );

  // Schedule first refresh
  refreshTimer = setTimeout(refreshToken, REFRESH_INTERVAL);
};

/**
 * Refreshes the access token using the refresh token cookie
 */
export const refreshToken = async (): Promise<void> => {
  try {
    // console.log("Refreshing token...");
    const response: ApiResponse<RefreshTokenResponse> =
      await refreshTokenFromCookie();

    // Check if response contains token in the result property
    if (response && response.result && response.result.token) {
      // console.log("Token refreshed successfully");
      store.dispatch(
        setAuthData({
          token: response.result.token,
          isAuthenticated: true,
          loginSocial: false,
        })
      );

      // Setup the next refresh
      // console.log(
      //   `Scheduling next token refresh in ${
      //     REFRESH_INTERVAL / (60 * 1000)
      //   } minutes`
      // );
      refreshTimer = setTimeout(refreshToken, REFRESH_INTERVAL);
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
    // Handle refresh failure (e.g., redirect to login)
  }
};

/**
 * Clears the refresh timer when logging out
 */
export const clearTokenRefresh = (): void => {
  if (refreshTimer) {
    // console.log("Clearing token refresh timer");
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
};

