import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
const headers = {
  "Content-Type": "application/json",
  ...getAuthHeader(),
};

export const createPermission = async (permissionData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/permissions`,
      permissionData,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating permission:", error);
    throw error;
  }
};

export const getAllPermissions = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/permissions`, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching permissions:", error);
    throw error;
  }
};

export const deletePermission = async (permission) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/permissions/${permission}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting permission:", error);
    throw error;
  }
};

