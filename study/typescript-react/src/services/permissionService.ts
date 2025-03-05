import axios from "axios";
import {
  Permission,
  PermissionResponse,
  PermissionsResponse,
  AxiosErrorWithData,
  ExtendApiError,
} from "../type/types";

const API_BASE_URI =
  import.meta.env.VITE_API_BASE_URI || "http://localhost:9095/identify_service";

// Axios instance with default headers
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

export const createPermission = async (
  permissionData: Omit<Permission, "id">,
  token: string
): Promise<PermissionResponse> => {
  try {
    const response = await apiClient.post<PermissionResponse>(
      "/permissions",
      permissionData,
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
      "Failed to create permission",
      "CREATE"
    );
    console.error("Error creating permission:", extendedError);
    throw extendedError;
  }
};

export const getAllPermissions = async (
  token: string
): Promise<PermissionsResponse> => {
  try {
    const response = await apiClient.get<PermissionsResponse>("/permissions", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    const extendedError = createErrorObject(
      error,
      "Failed to fetch permissions",
      "FETCH"
    );
    console.error("Error fetching permissions:", extendedError);
    throw extendedError;
  }
};

export const getPermissionByName = async (
  permissionName: string,
  token: string
): Promise<PermissionResponse> => {
  try {
    const response = await apiClient.get<PermissionResponse>(
      `/permissions/${permissionName}`,
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
      `Failed to fetch permission ${permissionName}`,
      "FETCH"
    );
    console.error("Error fetching permission:", extendedError);
    throw extendedError;
  }
};

export const updatePermission = async (
  permissionName: string,
  permissionData: Partial<Permission>,
  token: string
): Promise<PermissionResponse> => {
  try {
    const response = await apiClient.put<PermissionResponse>(
      `/permissions/${permissionName}`,
      permissionData,
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
      `Failed to update permission ${permissionName}`,
      "UPDATE"
    );
    console.error("Error updating permission:", extendedError);
    throw extendedError;
  }
};

export const deletePermission = async (
  permissionId: string,
  token: string
): Promise<PermissionResponse> => {
  try {
    const response = await apiClient.delete<PermissionResponse>(
      `/permissions/${permissionId}`,
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
      `Failed to delete permission ${permissionId}`,
      "DELETE"
    );
    console.error("Error deleting permission:", extendedError);
    throw extendedError;
  }
};

/**
 * Get all roles that have a particular permission
 */
export const getRolesWithPermission = async (
  permissionName: string,
  token: string
): Promise<PermissionsResponse> => {
  try {
    const response = await apiClient.get<PermissionsResponse>(
      `/permissions/${permissionName}/roles`,
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
      `Failed to fetch roles with permission ${permissionName}`,
      "FETCH"
    );
    console.error("Error fetching roles with permission:", extendedError);
    throw extendedError;
  }
};


