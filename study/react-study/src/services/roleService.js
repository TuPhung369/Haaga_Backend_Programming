import axios from "axios";

const API_BASE_URI = process.env.REACT_APP_API_BASE_URI;
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
const headers = {
  "Content-Type": "application/json",
  ...getAuthHeader(),
};

export const createRole = async (roleData) => {
  try {
    const response = await axios.post(`${API_BASE_URI}/roles`, roleData, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating role:", error);
    throw error;
  }
};

export const getAllRoles = async () => {
  try {
    const response = await axios.get(`${API_BASE_URI}/roles`, { headers });
    return response.data;
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw error;
  }
};

export const deleteRole = async (role) => {
  try {
    const response = await axios.delete(`${API_BASE_URI}/roles/${role}`, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting role:", error);
    throw error;
  }
};

