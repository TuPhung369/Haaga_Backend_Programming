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

export const createUser = async (userData) => {
  try {
    const response = await axios.post(`${API_BASE_URI}/users`, userData, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const response = await axios.get(`${API_BASE_URI}/users`, { headers });
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const getMyInfo = async () => {
  try {
    const response = await axios.get(`${API_BASE_URI}/users/myInfo`, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching my user:", error);
    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URI}/users/${userId}`, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await axios.put(
      `${API_BASE_URI}/users/${userId}`,
      userData,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message);
    } else {
      throw error;
    }
  }
};
export const updateMyInfo = async (userId, userData) => {
  try {
    const response = await axios.put(
      `${API_BASE_URI}/users/updateMyInfo/${userId}`,
      userData,
      {
        headers,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message);
    } else {
      throw error;
    }
  }
};
export const deleteUser = async (userId) => {
  try {
    const response = await axios.delete(`${API_BASE_URI}/users/${userId}`, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

