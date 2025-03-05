import axios from "axios";
import type { AxiosError } from "axios";
import {
  AxiosErrorWithData,
  ExtendApiError,
  AuthResponse,
  GenericResponse,
} from "../type/types";

const API_BASE_URI =
  import.meta.env.VITE_API_BASE_URI || "http://localhost:9095/identify_service";

const apiClient = axios.create({
  baseURL: API_BASE_URI,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 10000,
});

export const authenticateUserWithCookies = async (
  username: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>("/auth/token/cookie", {
      username,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Error authenticating user with cookies:", error);
    const axiosError = error as AxiosErrorWithData;
    const errorMessage =
      axiosError.response?.data?.message ||
      axiosError.message ||
      "Authentication failed";

    const extendedError: ExtendApiError = {
      message: errorMessage,
      errorType: "FETCH",
      originalError: error,
    };
    throw extendedError;
  }
};

export const refreshTokenWithCookie = async (): Promise<AuthResponse> => {
  try {
    console.log("Making refresh token request");
    const response = await apiClient.post<AuthResponse>("/auth/refresh/cookie");
    console.log("Refresh token response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error refreshing token with cookie:", error);
    const axiosError = error as AxiosErrorWithData;
    const errorMessage =
      axiosError.response?.data?.message ||
      axiosError.message ||
      "Token refresh failed";

    const extendedError: ExtendApiError = {
      message: errorMessage,
      errorType: "FETCH",
      originalError: error,
    };
    throw extendedError;
  }
};

export const logoutWithCookies = async (): Promise<GenericResponse> => {
  try {
    const response = await apiClient.post<GenericResponse>(
      "/auth/logout/cookie"
    );
    return response.data;
  } catch (error) {
    console.error("Error logging out with cookies:", error);
    const axiosError = error as AxiosErrorWithData;
    const errorMessage =
      axiosError.response?.data?.message ||
      axiosError.message ||
      "Logout failed";

    const extendedError: ExtendApiError = {
      message: errorMessage,
      errorType: "UPDATE",
      originalError: error,
    };
    throw extendedError;
  }
};

// Token refresh interceptor logic
let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: AxiosError) => void;
}[] = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add a timestamp to track when we last successfully refreshed
let lastSuccessfulRefresh = 0;
const REFRESH_COOLDOWN = 5000; // 5 seconds minimum between refreshes

apiClient.interceptors.response.use(
  (response) => {
    // If this is a successful refresh response, update the timestamp
    if (
      response.config.url === "/auth/refresh/cookie" &&
      response.status === 200
    ) {
      lastSuccessfulRefresh = Date.now();
      console.log(
        "Token refreshed successfully at",
        new Date(lastSuccessfulRefresh).toISOString()
      );
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh if:
    // 1. It's a 401 error
    // 2. The request hasn't been retried yet
    // 3. It's not the refresh endpoint itself
    // 4. We're not in the cooldown period
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/refresh/cookie" &&
      Date.now() - lastSuccessfulRefresh > REFRESH_COOLDOWN
    ) {
      console.log("Attempting to refresh token due to 401 error");

      if (isRefreshing) {
        // If another request is already refreshing, queue this one
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Mark this request as retried and set refreshing flag
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token
        const response = await refreshTokenWithCookie();
        const { token } = response.result;

        // Update the last successful refresh timestamp
        lastSuccessfulRefresh = Date.now();

        // Update token in localStorage
        localStorage.setItem(
          "authState",
          JSON.stringify({
            auth: { token, isAuthenticated: true, loginSocial: false },
          })
        );

        // Update axios default headers
        apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // Update the current request headers
        originalRequest.headers["Authorization"] = `Bearer ${token}`;

        // Process any queued requests
        processQueue(null, token);

        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        processQueue(refreshError as AxiosError, null);

        // Dispatch logout event if refresh fails
        window.dispatchEvent(new CustomEvent("auth:logout"));

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For all other errors, simply reject the promise
    return Promise.reject(error);
  }
);

// Request interceptor to add token
apiClient.interceptors.request.use(
  async (config) => {
    // Skip token check for refresh endpoint
    if (config.url === "/auth/refresh/cookie") {
      return config;
    }

    const authStateString = localStorage.getItem("authState");
    if (authStateString) {
      try {
        const authState = JSON.parse(authStateString);
        if (authState.auth?.token) {
          // Check if token is about to expire (if it's a JWT)
          const isTokenExpiring = isTokenAboutToExpire(authState.auth.token);

          // If token is expiring and we're not already refreshing and not in cooldown
          if (
            isTokenExpiring &&
            !isRefreshing &&
            Date.now() - lastSuccessfulRefresh > REFRESH_COOLDOWN
          ) {
            try {
              console.log("Token is about to expire, refreshing proactively");
              isRefreshing = true;
              const response = await refreshTokenWithCookie();
              const { token } = response.result;

              // Update token in localStorage
              localStorage.setItem(
                "authState",
                JSON.stringify({
                  auth: {
                    ...authState.auth,
                    token,
                  },
                })
              );

              // Use the new token for this request
              config.headers["Authorization"] = `Bearer ${token}`;

              // Update the last refresh timestamp
              lastSuccessfulRefresh = Date.now();
            } catch (error) {
              console.error("Proactive token refresh failed", error);
              // Continue with the existing token
            } finally {
              isRefreshing = false;
            }
          } else {
            // Use existing token
            config.headers["Authorization"] = `Bearer ${authState.auth.token}`;
          }
        }
      } catch (e) {
        console.error("Error parsing auth state:", e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper function to check if a JWT is about to expire
function isTokenAboutToExpire(token: string): boolean {
  try {
    // Parse the token
    const base64Url = token.split(".")[1];
    if (!base64Url) return true;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    const { exp } = JSON.parse(jsonPayload);
    if (!exp) return false;

    // Check if token expires in less than 5 minutes
    const expirationTimeMs = exp * 1000;
    const currentTimeMs = Date.now();
    const timeUntilExpirationMs = expirationTimeMs - currentTimeMs;

    return timeUntilExpirationMs < 5 * 60 * 1000; // 5 minutes
  } catch (error) {
    console.error("Error checking token expiration:", error);
    return false;
  }
}

export default apiClient;

