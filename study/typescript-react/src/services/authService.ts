import axios from "axios";
import { setupAxiosInterceptors } from "../utils/axiosSetup";
import { handleServiceError } from "./baseService";
import {
  AuthResponse,
  IntrospectResponse,
  GenericResponse,
  RefreshTokenResponse,
  ApiResponse,
  ValidationInput,
  EmailChangeRequest,
  EmailVerificationRequest,
} from "../type/types";
import store from "../store/store";

const API_BASE_URI = import.meta.env.VITE_API_BASE_URI;

const apiClient = axios.create({
  baseURL: API_BASE_URI,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

setupAxiosInterceptors(apiClient);

export const requestEmailChangeCode = async (
  request: EmailChangeRequest
): Promise<GenericResponse> => {
  try {
    const response = await apiClient.post<GenericResponse>(
      "/auth/request-email-change",
      request,
      {
        headers: {
          Authorization: `Bearer ${request.token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error requesting email change code:", error);
    throw handleServiceError(error);
  }
};

export const verifyEmailChange = async (
  request: EmailVerificationRequest
): Promise<GenericResponse> => {
  try {
    const response = await apiClient.post<GenericResponse>(
      "/auth/verify-email-change",
      request,
      {
        headers: {
          Authorization: `Bearer ${request.token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error verifying email change:", error);
    throw handleServiceError(error);
  }
};

apiClient.interceptors.request.use(
  function (config) {
    const { token } = store.getState().auth;

    if (token) {
      // Use the correct type assertion for headers
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

export const authenticateUser = async (
  username: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>("/auth/token", {
      username,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Error authenticating user:", error);
    throw handleServiceError(error);
  }
};

// New cookie-based authentication function
export const authenticateUserWithCookies = async (
  username: string,
  password: string
): Promise<AuthResponse> => {
  try {
    //console.log("Calling API at:", `${API_BASE_URI}/auth/token/cookie`);
    const response = await apiClient.post<AuthResponse>("/auth/token/cookie", {
      username,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Error authenticating user with cookies:", error);
    throw handleServiceError(error);
  }
};

let introspectionInProgress = false;
let lastIntrospectTime = 0;
const INTROSPECT_COOLDOWN = 2000; // 2 seconds

export const introspectToken = async (
  token: string
): Promise<IntrospectResponse> => {
  // Only allow one introspection at a time and respect cooldown
  const now = Date.now();
  if (
    introspectionInProgress ||
    now - lastIntrospectTime < INTROSPECT_COOLDOWN
  ) {
    // Return cached result or a promised-based delay + retry
    return new Promise((resolve) => {
      const wait = Math.max(
        0,
        INTROSPECT_COOLDOWN - (now - lastIntrospectTime)
      );
      setTimeout(() => resolve(introspectToken(token)), wait);
    });
  }

  introspectionInProgress = true;
  lastIntrospectTime = now;

  try {
    const response = await apiClient.post<IntrospectResponse>(
      "/auth/introspect",
      { token },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error introspecting token:", error);
    throw handleServiceError(error);
  } finally {
    introspectionInProgress = false;
  }
};

// New function to refresh token using cookie
export const refreshTokenFromCookie = async (): Promise<
  ApiResponse<RefreshTokenResponse>
> => {
  try {
    // console.log("Refresh URL:", `${API_BASE_URI}/auth/refresh/cookie`);
    const response = await apiClient.post<ApiResponse<RefreshTokenResponse>>(
      "/auth/refresh/cookie"
    );

    // Wrap the response in ApiResponse format if it's not already in that format
    if (response.data && !("result" in response.data)) {
      return {
        code: response.status,
        result: response.data,
      };
    }

    return response.data as ApiResponse<RefreshTokenResponse>;
  } catch (error) {
    console.error("Error refreshing token from cookie:", error);
    throw handleServiceError(error);
  }
};

export const registerUser = async (
  userData: ValidationInput
): Promise<GenericResponse> => {
  try {
    const response = await apiClient.post<GenericResponse>(
      "/auth/register",
      userData
    );
    return response.data;
  } catch (error) {
    // Don't transform the error, just log and rethrow to preserve structure
    console.error("Error during registration:", error);
    throw handleServiceError(error);
  }
};

export const verifyEmail = async (
  username: string,
  token: string
): Promise<GenericResponse> => {
  try {
    const response = await apiClient.post<GenericResponse>(
      "/auth/verify-email",
      {
        username,
        token,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error during email verification:", error);
    throw handleServiceError(error);
  }
};

export const resendVerificationEmail = async (
  username: string
): Promise<GenericResponse> => {
  try {
    const response = await apiClient.post<GenericResponse>(
      "/auth/resend-verification",
      { username }
    );
    return response.data;
  } catch (error) {
    console.error("Error resending verification email:", error);
    throw handleServiceError(error);
  }
};

export const resetPassword = async (
  username: string,
  newPassword: string
): Promise<GenericResponse> => {
  try {
    const response = await apiClient.post<GenericResponse>(
      "/auth/resetPassword",
      {
        username,
        newPassword,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error during reset password:", error);
    throw handleServiceError(error);
  }
};

export const forgotPassword = async (
  username: string,
  email: string
): Promise<GenericResponse> => {
  try {
    const response = await apiClient.post<GenericResponse>(
      "/auth/forgot-password",
      {
        username,
        email,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error during forgot password request:", error);
    throw handleServiceError(error);
  }
};

export const resetPasswordWithToken = async (
  token: string,
  newPassword: string
): Promise<GenericResponse> => {
  try {
    const response = await apiClient.post<GenericResponse>(
      "/auth/reset-password-with-token",
      {
        token,
        newPassword,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error during password reset with token:", error);
    throw handleServiceError(error);
  }
};

export const logoutUser = async (token: string): Promise<GenericResponse> => {
  try {
    const response = await apiClient.post<GenericResponse>(
      "/auth/logout",
      { token },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error during logout:", error);
    throw handleServiceError(error);
  }
};

// New cookie-based logout function
export const logoutUserWithCookies = async (): Promise<GenericResponse> => {
  try {
    const response = await apiClient.post<GenericResponse>(
      "/auth/logout/cookie"
    );
    return response.data;
  } catch (error) {
    console.error("Error during cookie-based logout:", error);
    throw handleServiceError(error);
  }
};

export const exchangeAuthorizationCode = async (
  code: string
): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>("/oauth2/token", {
      code,
    });
    return response.data;
  } catch (error) {
    console.error("Error exchanging authorization code:", error);
    throw handleServiceError(error);
  }
};

export const validateGoogleToken = async (
  idToken: string
): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>("/google/token", {
      id_token: idToken,
    });
    return response.data;
  } catch (error) {
    console.error("Error validating Google ID token:", error);
    throw handleServiceError(error);
  }
};

export default apiClient;

