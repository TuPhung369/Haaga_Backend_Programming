import axios from "axios";

const API_BASE_URL = "http://localhost:9095/identify_service"; // Update this to your backend server URL

export const authenticateUser = async (username, password) => {
  const response = await axios.post(`${API_BASE_URL}/auth/token`, {
    username,
    password,
  });
  return response.data;
};

export const introspectToken = async (token) => {
  const response = await axios.post(`${API_BASE_URL}/auth/introspect`, {
    token,
  });
  return response.data;
};

export const registerUser = async (userData) => {
  try {
    console.log("STEP 1: userData", userData);
    const response = await axios.post(
      `${API_BASE_URL}/auth/register`,
      userData, // Send userData directly
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("STEP 2: response", response);
    return response.data;
  } catch (error) {
    console.error("Error during registration:", error);
    throw error;
  }
};
export const resetPassword = async (username, newPassword) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/resetPassword`,
      { username, newPassword },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error during reset password:", error);
    throw error;
  }
};

export const logoutUser = async (token) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/logout`,
      { token },
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  } catch (error) {
    console.error("Error during logout:", error);
    throw error;
  }
};

