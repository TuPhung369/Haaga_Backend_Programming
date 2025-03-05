import axios from "axios";
import { ValidationInput } from "../type/authType";
import {
  UserResponse,
  UsersResponse,
  AxiosErrorWithData,
  ExtendApiError,
} from "../type/types";

const API_BASE_URI =
  import.meta.env.VITE_API_BASE_URI || "http://localhost:9095/identify_service";

// Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URI,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // Add timeout to prevent hanging requests
  withCredentials: true, // Include cookies if the backend relies on them for authentication
  // Do not automatically follow redirects, so we can handle 302 manually
  maxRedirects: 0,
});

/**
 * Helper function to create an error object with consistent structure
 */
const createErrorObject = (
  error: unknown,
  defaultMessage: string,
  errorType: ExtendApiError["errorType"]
): ExtendApiError => {
  const extendedError: ExtendApiError = {
    message: defaultMessage,
    errorType: errorType,
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

  return extendedError;
};

export const createUser = async (
  userData: ValidationInput,
  token: string
): Promise<UserResponse> => {
  try {
    const response = await apiClient.post<UserResponse>("/users", userData, {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
      },
    });
    return response.data;
  } catch (error) {
    const extendedError = createErrorObject(
      error,
      "Failed to create user",
      "CREATE"
    );
    console.error("Error creating user:", extendedError);
    throw extendedError;
  }
};

export const getAllUsers = async (token: string): Promise<UsersResponse> => {
  try {
    const response = await apiClient.get<UsersResponse>("/users", {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
      },
    });
    return response.data;
  } catch (error) {
    const extendedError = createErrorObject(
      error,
      "Failed to fetch users",
      "FETCH"
    );
    console.error("Error fetching users:", extendedError);
    throw extendedError;
  }
};

export const getMyInfo = async (token: string): Promise<UserResponse> => {
  try {
    const response = await apiClient.get<UserResponse>("/users/myInfo", {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
      },
    });
    return response.data;
  } catch (error) {
    const extendedError = createErrorObject(
      error,
      "Failed to fetch user information",
      "FETCH"
    );
    console.error("Error fetching my user:", extendedError);
    throw extendedError;
  }
};

export const getUserById = async (
  userId: string,
  token: string
): Promise<UserResponse> => {
  try {
    const response = await apiClient.get<UserResponse>(`/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
      },
    });
    return response.data;
  } catch (error) {
    const extendedError = createErrorObject(
      error,
      `Failed to fetch user with ID ${userId}`,
      "FETCH"
    );
    console.error("Error fetching user by ID:", extendedError);
    throw extendedError;
  }
};

export const updateUser = async (
  userId: string,
  userData: Partial<ValidationInput>,
  token: string
): Promise<UserResponse> => {
  try {
    const response = await apiClient.put<UserResponse>(
      `/users/${userId}`,
      userData,
      {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    const extendedError = createErrorObject(
      error,
      `Failed to update user with ID ${userId}`,
      "UPDATE"
    );
    console.error("Error updating user:", extendedError);
    throw extendedError;
  }
};

export const updateMyInfo = async (
  userId: string,
  userData: Partial<ValidationInput>,
  token: string
): Promise<UserResponse> => {
  try {
    const response = await apiClient.put<UserResponse>(
      `/users/updateMyInfo/${userId}`,
      userData,
      {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    const extendedError = createErrorObject(
      error,
      "Failed to update your information",
      "UPDATE"
    );
    console.error("Error updating user:", extendedError);
    throw extendedError;
  }
};

export const deleteUser = async (
  userId: string,
  token: string
): Promise<UserResponse> => {
  try {
    const response = await apiClient.delete<UserResponse>(`/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
      },
    });
    return response.data;
  } catch (error) {
    const extendedError = createErrorObject(
      error,
      `Failed to delete user with ID ${userId}`,
      "DELETE"
    );
    console.error("Error deleting user:", extendedError);
    throw extendedError;
  }
};

