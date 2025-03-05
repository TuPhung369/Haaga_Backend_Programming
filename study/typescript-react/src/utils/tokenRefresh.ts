// src/utils/tokenRefresh.ts
import { refreshTokenFromCookie } from "../services/authService";
import { setAuthData } from "../store/authSlice";
import store from "../store/store";
import { ApiResponse, RefreshTokenResponse } from "../type/types";

// Time window before token expiry when we should refresh (e.g., 5 minutes)
const REFRESH_WINDOW_MS = 5 * 60 * 1000;

/**
 * Helper to extract expiry time from JWT token
 */
const getTokenExpiry = (token: string): number => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000; // Convert to milliseconds
  } catch (e) {
    console.error("Error parsing token:", e);
    return 0;
  }
};

/**
 * Sets up automatic token refresh based on expiry time
 * @param token Current access token
 */
export const setupTokenRefresh = (token: string): void => {
  if (!token) return;

  const expiryTime = getTokenExpiry(token);
  if (!expiryTime) return;

  const timeUntilRefresh = expiryTime - Date.now() - REFRESH_WINDOW_MS;

  if (timeUntilRefresh <= 0) {
    // Token is already expired or about to expire, refresh immediately
    refreshToken();
  } else {
    // Schedule refresh before token expires
    setTimeout(refreshToken, timeUntilRefresh);
  }
};

/**
 * Refreshes the access token using the refresh token cookie
 */
export const refreshToken = async (): Promise<void> => {
  try {
    const response: ApiResponse<RefreshTokenResponse> =
      await refreshTokenFromCookie();

    // Check if response contains token in the result property
    if (response && response.result && response.result.token) {
      store.dispatch(
        setAuthData({
          token: response.result.token,
          isAuthenticated: true,
          loginSocial: false,
        })
      );

      // Setup the next refresh
      setupTokenRefresh(response.result.token);
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
    // Handle refresh failure (e.g., redirect to login)
  }
};

