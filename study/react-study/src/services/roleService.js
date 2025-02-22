import axios from "axios";

const API_BASE_URI = process.env.REACT_APP_API_BASE_URI;

export const createRole = async (roleData, token) => {
  try {
    const response = await axios.post(`${API_BASE_URI}/roles`, roleData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating role:", error);
    throw error;
  }
};

export const getAllRoles = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URI}/roles`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw error;
  }
};

export const deleteRole = async (role, token) => {
  try {
    const response = await axios.delete(`${API_BASE_URI}/roles/${role}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting role:", error);
    throw error;
  }
};
