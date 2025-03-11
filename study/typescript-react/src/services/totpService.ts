// src/services/totpService.ts
import apiClient from "./authService";
import { handleServiceError } from "./baseService";
import { ApiResponse } from "../type/types";

// Response interfaces
export interface TotpSetupResponse {
  qrCodeUri: string;
  secretKey: string;
  secretId: string;
}

export interface TotpVerifyResponse {
  success: boolean;
  backupCodes: string[];
}

export interface TotpDeviceResponse {
  id: string;
  deviceName: string;
  createdAt: string;
  active: boolean;
}

// Request interfaces
export interface TotpSetupRequest {
  deviceName: string;
}

export interface TotpVerifyRequest {
  secretId: string;
  code: string;
}

export interface TotpAuthenticationRequest {
  username: string;
  password: string;
  totpCode: string;
}

// TOTP service functions
export const setupTotp = async (
  deviceName: string,
  token: string
): Promise<ApiResponse<TotpSetupResponse>> => {
  try {
    const response = await apiClient.post<ApiResponse<TotpSetupResponse>>(
      "/auth/totp/setup",
      { deviceName },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error setting up TOTP:", error);
    throw handleServiceError(error);
  }
};

export const verifyTotp = async (
  secretId: string,
  code: string,
  token: string
): Promise<ApiResponse<TotpVerifyResponse>> => {
  try {
    const response = await apiClient.post<ApiResponse<TotpVerifyResponse>>(
      "/auth/totp/verify",
      { secretId, code },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error verifying TOTP:", error);
    throw handleServiceError(error);
  }
};

export const getTotpStatus = async (
  token: string
): Promise<ApiResponse<boolean>> => {
  try {
    const response = await apiClient.get<ApiResponse<boolean>>(
      "/auth/totp/status",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting TOTP status:", error);
    throw handleServiceError(error);
  }
};

export const getTotpDevices = async (
  token: string
): Promise<ApiResponse<TotpDeviceResponse[]>> => {
  try {
    const response = await apiClient.get<ApiResponse<TotpDeviceResponse[]>>(
      "/auth/totp/devices",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting TOTP devices:", error);
    throw handleServiceError(error);
  }
};

export const deactivateTotpDevice = async (
  deviceId: string,
  token: string
): Promise<ApiResponse<void>> => {
  try {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/auth/totp/devices/${deviceId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error deactivating TOTP device:", error);
    throw handleServiceError(error);
  }
};

export const regenerateBackupCodes = async (
  token: string
): Promise<ApiResponse<string[]>> => {
  try {
    const response = await apiClient.post<ApiResponse<string[]>>(
      "/auth/totp/backup-codes/regenerate",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error regenerating backup codes:", error);
    throw handleServiceError(error);
  }
};

// Authentication with TOTP
export const authenticateWithTotp = async (
  username: string,
  password: string,
  totpCode: string
): Promise<ApiResponse<{ token: string }>> => {
  try {
    const response = await apiClient.post<ApiResponse<{ token: string }>>(
      "/auth/totp/token",
      { username, password, totpCode }
    );
    return response.data;
  } catch (error) {
    console.error("Error authenticating with TOTP:", error);
    throw handleServiceError(error);
  }
};

// Authentication with TOTP using cookies
export const authenticateWithTotpAndCookies = async (
  username: string,
  password: string,
  totpCode: string
): Promise<ApiResponse<{ token: string }>> => {
  try {
    const response = await apiClient.post<ApiResponse<{ token: string }>>(
      "/auth/totp/token/cookie",
      { username, password, totpCode }
    );
    return response.data;
  } catch (error) {
    console.error("Error authenticating with TOTP and cookies:", error);
    throw handleServiceError(error);
  }
};

export default {
  setupTotp,
  verifyTotp,
  getTotpStatus,
  getTotpDevices,
  deactivateTotpDevice,
  regenerateBackupCodes,
  authenticateWithTotp,
  authenticateWithTotpAndCookies,
};

