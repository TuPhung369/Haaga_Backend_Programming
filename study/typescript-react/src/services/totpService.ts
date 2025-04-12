// src/services/totpService.ts
import apiClient from "./authService";
import { handleServiceError } from "./baseService";
import { ApiResponse } from "../types/ApiTypes";

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
  enabled?: boolean;
  active?: boolean;
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

// Updated to include verification code parameter
export const deactivateTotpDevice = async (
  deviceId: string,
  verificationCode: string,
  token: string
): Promise<ApiResponse<void>> => {
  try {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/auth/totp/devices/${deviceId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          verificationCode: verificationCode,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error deactivating TOTP device:", error);
    throw handleServiceError(error);
  }
};

// Updated to include verification code parameter
export const regenerateBackupCodes = async (
  verificationCode: string,
  token: string
): Promise<ApiResponse<string[]>> => {
  try {
    const response = await apiClient.post<ApiResponse<string[]>>(
      "/auth/totp/backup-codes/regenerate",
      {
        verificationCode: verificationCode,
      },
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

// New function to request admin reset
export const requestAdminReset = async (
  username: string,
  email: string,
  token: string
): Promise<ApiResponse<void>> => {
  try {
    const response = await apiClient.post<ApiResponse<void>>(
      "/auth/totp/request-admin-reset",
      {
        username,
        email,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error requesting admin reset:", error);
    throw handleServiceError(error);
  }
};

// New function to request device change
export const requestDeviceChange = async (
  verificationCode: string,
  newDeviceName: string,
  token: string
): Promise<ApiResponse<TotpSetupResponse>> => {
  try {
    const response = await apiClient.post<ApiResponse<TotpSetupResponse>>(
      "/auth/totp/change-device",
      {
        verificationCode,
        deviceName: newDeviceName,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error requesting device change:", error);
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
  requestAdminReset,
  requestDeviceChange,
  authenticateWithTotp,
  authenticateWithTotpAndCookies,
};

