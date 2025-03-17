import axios from "axios";
import { setupAxiosInterceptors } from "../utils/axiosSetup";
import { handleServiceError } from "./baseService";
import { TotpAuthenticationRequest } from "./totpService";
import {
  AuthResponse,
  IntrospectResponse,
  GenericResponse,
  RefreshTokenResponse,
  ApiResponse,
  ValidationInput,
  EmailChangeRequest,
  EmailVerificationRequest,
  AuthenticationInitResponse,
  EmailOtpAuthenticationRequest,
} from "../type/types";
import store from "../store/store";

// Define PasswordChangeRequest interface
interface PasswordChangeRequest {
  userId: string;
  currentPassword: string;
  newPassword: string;
  verificationCode: string;
  token: string;
  useTotp?: boolean;
}

const API_BASE_URI = import.meta.env.VITE_API_BASE_URI;

const apiClient = axios.create({
  baseURL: API_BASE_URI,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

setupAxiosInterceptors(apiClient);

const mockApiClient = axios.create({
  baseURL: API_BASE_URI,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Tạo một interceptor cho mockApiClient để thay đổi request URL
mockApiClient.interceptors.request.use(function (config) {
  if (config.url) {
    config.url = config.url.replace(/^\//, '/_dev_/');
  }
  return config;
});

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

export const verifyPasswordChange = async (
  request: PasswordChangeRequest
): Promise<GenericResponse> => {
  try {
    const response = await apiClient.post<GenericResponse>(
      "/auth/change-password",
      {
        userId: request.userId,
        currentPassword: request.currentPassword,
        newPassword: request.newPassword,
        verificationCode: request.verificationCode,
        useTotp: request.useTotp || false
      },
      {
        headers: {
          Authorization: `Bearer ${request.token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error changing password:", error);
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
export const authenticateWithTotp = async (
  request: TotpAuthenticationRequest
): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>(
      "/auth/totp/token",
      request
    );
    return response.data;
  } catch (error) {
    console.error("Error authenticating with TOTP:", error);
    throw handleServiceError(error);
  }
};

/**
 * Authenticates a user with username, password and TOTP code using cookies
 */
export const authenticateWithTotpAndCookies = async (
  username: string,
  password: string,
  totpCode: string
): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>(
      "/auth/totp/token/cookie",
      { username, password, totpCode },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Error authenticating with TOTP and cookies:", error);
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
    // Check if we're in development mode
    // const isDevelopment = import.meta.env.MODE === 'development';

    // // For development, log token info
    // if (isDevelopment) {
    //   console.log('Register request in DEV mode:', {
    //     hasV3Token: !!userData.recaptchaToken,
    //     tokenPrefix: userData.recaptchaToken?.substring(0, 10) + '...'
    //   });

    //   try {
    //     // First try the development endpoint if we're in dev mode
    //     console.log('Attempting registration via development endpoint...');
    //     const response = await mockApiClient.post<GenericResponse>(
    //       "/auth/register",
    //       userData
    //     );
    //     console.log('Development endpoint registration successful!');
    //     return response.data;
    //   } catch (devError) {
    //     // If development endpoint fails, log and continue to standard endpoint
    //     console.error('Development endpoint failed:', devError);
    //     console.log('Falling back to standard endpoint...');
    //   }
    // }

    // Use the regular API client as fallback or for production
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
    // Check if we're in development mode
    // const isDevelopment = import.meta.env.MODE === 'development';

    // if (isDevelopment) {
    //   console.log('Verify email request in DEV mode:', {
    //     username,
    //     token
    //   });

    //   // Skip the development endpoint since the standard endpoint is working correctly
    //   console.log('Using standard endpoint for email verification...');
    // }

    // Always use the regular API client for email verification
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

/**
 * Initiates the authentication process checking if TOTP or Email OTP is required
 */
export const initiateAuthentication = async (
  username: string,
  password: string
): Promise<AuthenticationInitResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<AuthenticationInitResponse>>("/auth/initAuthentication", {
      username,
      password,
    });
    return response.data.result;
  } catch (error) {
    console.error("Error initiating authentication:", error);
    throw handleServiceError(error);
  }
};

/**
 * Authenticates a user with username, password and Email OTP code
 */
export const authenticateWithEmailOtp = async (
  request: EmailOtpAuthenticationRequest
): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>(
      "/auth/email-otp/token",
      request
    );
    return response.data;
  } catch (error) {
    console.error("Error authenticating with Email OTP:", error);
    throw handleServiceError(error);
  }
};

/**
 * Authenticates a user with username, password and Email OTP code using cookies
 */
export const authenticateWithEmailOtpAndCookies = async (
  username: string,
  password: string,
  otpCode: string
): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>(
      "/auth/email-otp/token/cookie",
      { username, password, otpCode },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Error authenticating with Email OTP and cookies:", error);
    throw handleServiceError(error);
  }
};

export default apiClient;

