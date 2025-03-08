import apiClient from "./authService";
import { handleServiceError } from "./baseService";
import {
  UserResponse,
  UsersResponse,
  ValidationInput,
} from "../type/types";

export const createUser = async (
  userData: ValidationInput,
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
    throw handleServiceError(error);
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
    throw handleServiceError(error);
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
    throw handleServiceError(error);
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
    throw handleServiceError(error);
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
    throw handleServiceError(error);
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
    throw handleServiceError(error);
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
    throw handleServiceError(error);
  }
};

