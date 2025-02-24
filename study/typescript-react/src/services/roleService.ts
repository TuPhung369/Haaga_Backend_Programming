import axios, { AxiosError } from "axios";

const API_BASE_URI = import.meta.env.VITE_API_BASE_URI;

// Define types for roles
interface Role {
  id: string; // Adjust if your API uses a different identifier (e.g., number)
  name: string; // Common field for roles; add more as needed
}

// Response types
interface RoleResponse {
  success: boolean;
  data: Role; // Single role for create/delete
  message?: string;
}

interface RolesResponse {
  success: boolean;
  data: Role[]; // Array of roles for getAll
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

export const createRole = async (
  roleData: Omit<Role, "id">, // ID is likely server-generated
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
    console.error("Error creating role:", error);
    throw error as AxiosError<ApiError>;
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
    console.error("Error fetching roles:", error);
    throw error as AxiosError<ApiError>;
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
    console.error("Error deleting role:", error);
    throw error as AxiosError<ApiError>;
  }
};
