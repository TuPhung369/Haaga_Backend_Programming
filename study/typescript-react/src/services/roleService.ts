import apiClient from "./authService";
import { handleServiceError } from "./baseService";
import { Role, RoleResponse, RolesResponse } from "../type/types";

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
    throw handleServiceError(error);
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
    console.error("Unexpected error:", error);
    throw handleServiceError(error);
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
    throw handleServiceError(error);
  }
};

