import apiClient from "./authService";
import { handleServiceError } from "./baseService";
import {
  UserResponse,
  UsersResponse,
  ValidationInput,
} from "../types/UserTypes";
import {
  getRecaptchaToken,
  addRecaptchaTokenToData,
} from "../utils/recaptchaUtils";

export const createUser = async (
  userData: ValidationInput,
  token: string
): Promise<UserResponse> => {
  try {
    // Sử dụng utility để thêm token reCAPTCHA
    const dataWithRecaptcha = addRecaptchaTokenToData(userData);

    const response = await apiClient.post<UserResponse>(
      "/users",
      dataWithRecaptcha,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
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
  userData: Partial<ValidationInput>,
  token: string,
  recaptchaToken?: string
): Promise<UserResponse> => {
  try {
    // Tạo bản sao của userData để tránh thay đổi dữ liệu gốc
    const userDataToSend = { ...userData };

    // Nếu password trống, loại bỏ trường password khỏi dữ liệu gửi đi
    if (userDataToSend.password === "") {
      // Sử dụng delete để loại bỏ trường password
      delete userDataToSend.password;
    }

    // Thêm recaptchaToken vào dữ liệu
    const dataWithRecaptcha = recaptchaToken
      ? { ...userDataToSend, recaptchaToken }
      : addRecaptchaTokenToData(userDataToSend);

    const response = await apiClient.put<UserResponse>(
      `/users/${userId}`,
      dataWithRecaptcha,
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
  userData: Partial<ValidationInput>,
  token: string,
  recaptchaToken?: string
): Promise<UserResponse> => {
  try {
    // Tạo bản sao của userData để tránh thay đổi dữ liệu gốc
    const userDataToSend = { ...userData };

    // Nếu password trống, loại bỏ trường password khỏi dữ liệu gửi đi
    if (userDataToSend.password === "") {
      // Sử dụng delete để loại bỏ trường password
      delete userDataToSend.password;
    }

    // Thêm recaptchaToken vào dữ liệu
    const dataWithRecaptcha = recaptchaToken
      ? { ...userDataToSend, recaptchaToken }
      : addRecaptchaTokenToData(userDataToSend);

    const response = await apiClient.put<UserResponse>(
      `/users/updateMyInfo/${userId}`,
      dataWithRecaptcha,
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
    // Thêm token reCAPTCHA vào request delete
    const response = await apiClient.delete<UserResponse>(
      `/users/${userId}?recaptchaToken=${encodeURIComponent(
        getRecaptchaToken()
      )}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw handleServiceError(error);
  }
};

/**
 * Update user status in the database
 * @param status The new status (online, away, busy, offline)
 * @param token Authentication token
 * @returns Updated user information
 */
export const updateUserStatus = async (
  status: "online" | "away" | "busy" | "offline",
  token: string
): Promise<UserResponse> => {
  try {
    // Get the user ID from Redux store instead of localStorage
    const store = await import("../store/store").then(
      (module) => module.default
    );
    const userId = store.getState().user.userInfo?.id;

    if (!userId) {
      throw new Error("User ID not found in Redux store");
    }

    // Create the request body
    const userData = {
      status: status,
      recaptchaToken: getRecaptchaToken(),
    };

    // Send the request to update user status
    const response = await apiClient.put<UserResponse>(
      `/users/status/${userId}`,
      userData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // No longer storing in localStorage as requested
    // Instead, we'll update the Redux store in the component that calls this function

    return response.data;
  } catch (error) {
    console.error("Error updating user status:", error);
    throw handleServiceError(error);
  }
};

