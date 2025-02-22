import axios from "axios";

const API_BASE_URI = process.env.REACT_APP_API_BASE_URI;

export const createUser = async (userData, token) => {
  try {
    const response = await axios.post(`${API_BASE_URI}/users`, userData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const getAllUsers = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URI}/users`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const getMyInfo = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URI}/users/myInfo`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching my user:", error);
    throw error;
  }
};

export const getUserById = async (userId, token) => {
  try {
    const response = await axios.get(`${API_BASE_URI}/users/${userId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw error;
  }
};

export const updateUser = async (userId, userData, token) => {
  try {
    const response = await axios.put(
      `${API_BASE_URI}/users/${userId}`,
      userData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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

export const updateMyInfo = async (userId, userData, token) => {
  try {
    const response = await axios.put(
      `${API_BASE_URI}/users/updateMyInfo/${userId}`,
      userData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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

export const deleteUser = async (userId, token) => {
  try {
    const response = await axios.delete(`${API_BASE_URI}/users/${userId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};
