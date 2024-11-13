import axios from "axios";

const API_BASE_URL = "http://localhost:9095/identify_service";
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
    const response = await axios.post(`${API_BASE_URL}/roles`, roleData, {
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
    const response = await axios.get(`${API_BASE_URL}/roles`, { headers });
    return response.data;
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw error;
  }
};

export const deleteRole = async (role) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/roles/${role}`, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting role:", error);
    throw error;
  }
};


