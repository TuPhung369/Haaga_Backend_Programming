// src/services/totpAdminService.ts
import apiClient from "./authService";
import { handleServiceError } from "./baseService";
import { ApiResponse } from "../type/types";

// Reset request related interfaces
export interface TotpResetRequest {
  id: string;
  username: string;
  email: string;
  requestTime: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  processed: boolean;
  processedBy?: string;
  processedTime?: string;
  notes?: string;
}

// Analytics related interfaces
export interface TotpResetStats {
  totalRequests: number;
  pendingRequests: number;
  requestsLastMonth: number;
  approvedRequests: number;
  rejectedRequests: number;
  averageProcessingTimeHours: number | null;
}

// Fetch TOTP reset requests (with optional pending filter)
export const fetchTotpResetRequests = async (
  pending: boolean | undefined,
  token: string
): Promise<ApiResponse<TotpResetRequest[]>> => {
  try {
    const url =
      pending !== undefined
        ? `/auth/totp/admin/reset-requests?pending=${pending}`
        : "/auth/totp/admin/reset-requests";

    const response = await apiClient.get<ApiResponse<TotpResetRequest[]>>(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching TOTP reset requests:", error);
    throw handleServiceError(error);
  }
};

// Approve a TOTP reset request
export const approveTotpResetRequest = async (
  requestId: string,
  notes: string,
  token: string
): Promise<ApiResponse<void>> => {
  try {
    const response = await apiClient.post<ApiResponse<void>>(
      `/auth/totp/admin/reset-requests/${requestId}/approve`,
      { notes },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error approving TOTP reset request:", error);
    throw handleServiceError(error);
  }
};

// Reject a TOTP reset request
export const rejectTotpResetRequest = async (
  requestId: string,
  notes: string,
  token: string
): Promise<ApiResponse<void>> => {
  try {
    const response = await apiClient.post<ApiResponse<void>>(
      `/auth/totp/admin/reset-requests/${requestId}/reject`,
      { notes },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error rejecting TOTP reset request:", error);
    throw handleServiceError(error);
  }
};

// Fetch TOTP reset analytics
export const fetchTotpResetAnalytics = async (
  token: string
): Promise<ApiResponse<TotpResetStats>> => {
  try {
    // NOTE: If this endpoint doesn't exist in the backend yet,
    // it needs to be created to match this request
    const response = await apiClient.get<ApiResponse<TotpResetStats>>(
      "/auth/totp/admin/analytics",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching TOTP reset analytics:", error);
    throw handleServiceError(error);
  }
};

// Get status distribution for TOTP reset requests
export const getTotpResetStatusDistribution = async (
  token: string
): Promise<ApiResponse<Record<string, number>>> => {
  try {
    const response = await apiClient.get<ApiResponse<Record<string, number>>>(
      "/auth/totp/admin/analytics/distribution",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching TOTP reset status distribution:", error);
    throw handleServiceError(error);
  }
};

// Get daily TOTP reset request counts
export const getTotpResetRequestsPerDay = async (
  days: number,
  token: string
): Promise<ApiResponse<Array<{ date: string; count: number }>>> => {
  try {
    const response = await apiClient.get<
      ApiResponse<Array<{ date: string; count: number }>>
    >(`/auth/totp/admin/analytics/daily?days=${days}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching TOTP reset requests per day:", error);
    throw handleServiceError(error);
  }
};

