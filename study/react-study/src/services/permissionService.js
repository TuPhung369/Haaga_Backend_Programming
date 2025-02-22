import axios from "axios";

const API_BASE_URI = process.env.REACT_APP_API_BASE_URI;

export const createPermission = async (permissionData, token) => {
  try {
    const response = await axios.post(
      `${API_BASE_URI}/permissions`,
      permissionData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating permission:", error);
    throw error;
  }
};

export const getAllPermissions = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URI}/permissions`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching permissions:", error);
    throw error;
  }
};

export const deletePermission = async (permission, token) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URI}/permissions/${permission}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting permission:", error);
    throw error;
  }
};
