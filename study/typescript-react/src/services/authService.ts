import axios from "axios";
import { ValidationInput } from "../type/authType";
import {
  AxiosErrorWithData,
  ExtendApiError,
  AuthResponse,
  IntrospectResponse,
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
  timeout: 10000, // Add timeout to prevent indefinite waiting
});

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
    const extendedError: ExtendApiError = {
      message: "Authentication failed",
      errorType: "FETCH",
      originalError: error,
    };

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as AxiosErrorWithData;
      if (axiosError.response?.data?.message) {
        extendedError.message = axiosError.response.data.message;
      }
      if (axiosError.response?.data?.code) {
        extendedError.code = axiosError.response.data.code;
      }
      if (axiosError.response?.status) {
        extendedError.httpCode = String(axiosError.response.status);
      }
    }

    console.error("Error authenticating user:", extendedError);
    throw extendedError;
  }
};

export const introspectToken = async (
  token: string
): Promise<IntrospectResponse> => {
  try {
    const response = await apiClient.post<IntrospectResponse>(
      "/auth/introspect",
      { token }
    );
    return response.data;
  } catch (error) {
    const extendedError: ExtendApiError = {
      message: "Token introspection failed",
      errorType: "FETCH",
      originalError: error,
    };

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as AxiosErrorWithData;
      if (axiosError.response?.data?.message) {
        extendedError.message = axiosError.response.data.message;
      }
      if (axiosError.response?.data?.code) {
        extendedError.code = axiosError.response.data.code;
      }
      if (axiosError.response?.status) {
        extendedError.httpCode = String(axiosError.response.status);
      }
    }

    console.error("Error introspecting token:", extendedError);
    throw extendedError;
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
    const extendedError: ExtendApiError = {
      message: "Registration failed",
      errorType: "CREATE",
      originalError: error,
    };

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as AxiosErrorWithData;
      if (axiosError.response?.data?.message) {
        extendedError.message = axiosError.response.data.message;
      }
      if (axiosError.response?.data?.code) {
        extendedError.code = axiosError.response.data.code;
      }
      if (axiosError.response?.status) {
        extendedError.httpCode = String(axiosError.response.status);
      }
    }

    console.error("Error during registration:", extendedError);
    throw extendedError;
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
    const extendedError: ExtendApiError = {
      message: "Email verification failed",
      errorType: "UPDATE",
      originalError: error,
    };

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as AxiosErrorWithData;
      if (axiosError.response?.data?.message) {
        extendedError.message = axiosError.response.data.message;
      }
      if (axiosError.response?.data?.code) {
        extendedError.code = axiosError.response.data.code;
      }
      if (axiosError.response?.status) {
        extendedError.httpCode = String(axiosError.response.status);
      }
    }

    console.error("Error during email verification:", extendedError);
    throw extendedError;
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
    const extendedError: ExtendApiError = {
      message: "Failed to resend verification email",
      errorType: "CREATE",
      originalError: error,
    };

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as AxiosErrorWithData;
      if (axiosError.response?.data?.message) {
        extendedError.message = axiosError.response.data.message;
      }
      if (axiosError.response?.data?.code) {
        extendedError.code = axiosError.response.data.code;
      }
      if (axiosError.response?.status) {
        extendedError.httpCode = String(axiosError.response.status);
      }
    }

    console.error("Error resending verification email:", extendedError);
    throw extendedError;
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
    const extendedError: ExtendApiError = {
      message: "Failed to reset password",
      errorType: "UPDATE",
      originalError: error,
    };

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as AxiosErrorWithData;
      if (axiosError.response?.data?.message) {
        extendedError.message = axiosError.response.data.message;
      }
      if (axiosError.response?.data?.code) {
        extendedError.code = axiosError.response.data.code;
      }
      if (axiosError.response?.status) {
        extendedError.httpCode = String(axiosError.response.status);
      }
    }

    console.error("Error during reset password:", extendedError);
    throw extendedError;
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
    const extendedError: ExtendApiError = {
      message: "Failed to process forgot password request",
      errorType: "CREATE",
      originalError: error,
    };

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as AxiosErrorWithData;
      if (axiosError.response?.data?.message) {
        extendedError.message = axiosError.response.data.message;
      }
      if (axiosError.response?.data?.code) {
        extendedError.code = axiosError.response.data.code;
      }
      if (axiosError.response?.status) {
        extendedError.httpCode = String(axiosError.response.status);
      }
    }

    console.error("Error during forgot password request:", extendedError);
    throw extendedError;
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
    const extendedError: ExtendApiError = {
      message: "Failed to reset password with token",
      errorType: "UPDATE",
      originalError: error,
    };

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as AxiosErrorWithData;
      if (axiosError.response?.data?.message) {
        extendedError.message = axiosError.response.data.message;
      }
      if (axiosError.response?.data?.code) {
        extendedError.code = axiosError.response.data.code;
      }
      if (axiosError.response?.status) {
        extendedError.httpCode = String(axiosError.response.status);
      }
    }

    console.error("Error during password reset with token:", extendedError);
    throw extendedError;
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
    const extendedError: ExtendApiError = {
      message: "Failed to logout",
      errorType: "UPDATE",
      originalError: error,
    };

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as AxiosErrorWithData;
      if (axiosError.response?.data?.message) {
        extendedError.message = axiosError.response.data.message;
      }
      if (axiosError.response?.data?.code) {
        extendedError.code = axiosError.response.data.code;
      }
      if (axiosError.response?.status) {
        extendedError.httpCode = String(axiosError.response.status);
      }
    }

    console.error("Error during logout:", extendedError);
    throw extendedError;
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
    const extendedError: ExtendApiError = {
      message: "Failed to exchange authorization code",
      errorType: "FETCH",
      originalError: error,
    };

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as AxiosErrorWithData;
      if (axiosError.response?.data?.message) {
        extendedError.message = axiosError.response.data.message;
      }
      if (axiosError.response?.data?.code) {
        extendedError.code = axiosError.response.data.code;
      }
      if (axiosError.response?.status) {
        extendedError.httpCode = String(axiosError.response.status);
      }
    }

    console.error("Error exchanging authorization code:", extendedError);
    throw extendedError;
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
    const extendedError: ExtendApiError = {
      message: "Failed to validate Google token",
      errorType: "FETCH",
      originalError: error,
    };

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as AxiosErrorWithData;
      if (axiosError.response?.data?.message) {
        extendedError.message = axiosError.response.data.message;
      }
      if (axiosError.response?.data?.code) {
        extendedError.code = axiosError.response.data.code;
      }
      if (axiosError.response?.status) {
        extendedError.httpCode = String(axiosError.response.status);
      }
    }

    console.error("Error validating Google ID token:", extendedError);
    throw extendedError;
  }
};

