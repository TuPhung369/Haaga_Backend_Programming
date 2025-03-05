import axios from "axios";
import {
  Role,
  RoleResponse,
  RolesResponse,
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

export const createRole = async (
  roleData: Omit<Role, "id">,
  token: string
): Promise<RoleResponse> => {
  try {
    const response = await apiClient.post<RoleResponse>("/roles", roleData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    const extendedError = createErrorObject(
      error,
      "Failed to create role",
      "CREATE"
    );
    console.error("Error creating role:", extendedError);
    throw extendedError;
  }
};

export const getAllRoles = async (token: string): Promise<RolesResponse> => {
  try {
    const response = await apiClient.get<RolesResponse>("/roles", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    const extendedError = createErrorObject(
      error,
      "Failed to fetch roles",
      "FETCH"
    );
    console.error("Error fetching roles:", extendedError);
    throw extendedError;
  }
};

export const getRoleByName = async (
  roleName: string,
  token: string
): Promise<RoleResponse> => {
  try {
    const response = await apiClient.get<RoleResponse>(`/roles/${roleName}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    const extendedError = createErrorObject(
      error,
      `Failed to fetch role ${roleName}`,
      "FETCH"
    );
    console.error("Error fetching role:", extendedError);
    throw extendedError;
  }
};

export const updateRole = async (
  roleName: string,
  roleData: Partial<Role>,
  token: string
): Promise<RoleResponse> => {
  try {
    const response = await apiClient.put<RoleResponse>(
      `/roles/${roleName}`,
      roleData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    const extendedError = createErrorObject(
      error,
      `Failed to update role ${roleName}`,
      "UPDATE"
    );
    console.error("Error updating role:", extendedError);
    throw extendedError;
  }
};

export const deleteRole = async (
  roleId: string,
  token: string
): Promise<RoleResponse> => {
  try {
    const response = await apiClient.delete<RoleResponse>(`/roles/${roleId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    const extendedError = createErrorObject(
      error,
      `Failed to delete role ${roleId}`,
      "DELETE"
    );
    console.error("Error deleting role:", extendedError);
    throw extendedError;
  }
};

export const addPermissionToRole = async (
  roleName: string,
  permissionName: string,
  token: string
): Promise<RoleResponse> => {
  try {
    const response = await apiClient.post<RoleResponse>(
      `/roles/${roleName}/permissions/${permissionName}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    const extendedError = createErrorObject(
      error,
      `Failed to add permission ${permissionName} to role ${roleName}`,
      "UPDATE"
    );
    console.error("Error adding permission to role:", extendedError);
    throw extendedError;
  }
};

export const removePermissionFromRole = async (
  roleName: string,
  permissionName: string,
  token: string
): Promise<RoleResponse> => {
  try {
    const response = await apiClient.delete<RoleResponse>(
      `/roles/${roleName}/permissions/${permissionName}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    const extendedError = createErrorObject(
      error,
      `Failed to remove permission ${permissionName} from role ${roleName}`,
      "UPDATE"
    );
    console.error("Error removing permission from role:", extendedError);
    throw extendedError;
  }
};


