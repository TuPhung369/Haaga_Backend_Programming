import axios, { AxiosError } from "axios";
import { ValidationInput } from "../type/loginType"; // Reuse from loginType.ts

const API_BASE_URI = import.meta.env.VITE_API_BASE_URI;

// Define types for users
interface User {
  id: string; // Adjust if your API uses a different identifier
  username: string;
  firstname: string;
  lastname: string;
  dob: string; // ISO date string (e.g., "1987-07-07")
  email: string;
  roles: string[]; // Array of role names
}

// Response types
interface UserResponse {
  success: boolean;
  data: User; // Single user for create/update/delete/get
  message?: string;
}

interface UsersResponse {
  success: boolean;
  data: User[]; // Array of users for getAll
  message?: string;
}

// Error type
interface ApiError {
  httpCode?: number;
  message?: string;
}

// Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URI,
  headers: {
    "Content-Type": "application/json",
  },
});

export const createUser = async (
  userData: ValidationInput, // Reuses ValidationInput from loginType.ts
  token: string
): Promise<UserResponse> => {
  try {
    const response = await apiClient.post<UserResponse>("/users", userData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error as AxiosError<ApiError>;
  }
};

export const getAllUsers = async (token: string): Promise<UsersResponse> => {
  try {
    const response = await apiClient.get<UsersResponse>("/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error as AxiosError<ApiError>;
  }
};

export const getMyInfo = async (token: string): Promise<UserResponse> => {
  try {
    const response = await apiClient.get<UserResponse>("/users/myInfo", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching my user:", error);
    throw error as AxiosError<ApiError>;
  }
};

export const getUserById = async (
  userId: string,
  token: string
): Promise<UserResponse> => {
  try {
    const response = await apiClient.get<UserResponse>(`/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw error as AxiosError<ApiError>;
  }
};

export const updateUser = async (
  userId: string,
  userData: Partial<ValidationInput>, // Partial allows partial updates
  token: string
): Promise<UserResponse> => {
  try {
    const response = await apiClient.put<UserResponse>(
      `/users/${userId}`,
      userData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error as AxiosError<ApiError>;
  }
};

export const updateMyInfo = async (
  userId: string,
  userData: Partial<ValidationInput>, // Partial allows partial updates
  token: string
): Promise<UserResponse> => {
  try {
    const response = await apiClient.put<UserResponse>(
      `/users/updateMyInfo/${userId}`,
      userData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error as AxiosError<ApiError>;
  }
};

export const deleteUser = async (
  userId: string,
  token: string
): Promise<UserResponse> => {
  try {
    const response = await apiClient.delete<UserResponse>(`/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error as AxiosError<ApiError>;
  }
};
