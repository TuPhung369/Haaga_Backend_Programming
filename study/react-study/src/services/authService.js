import axios from "axios";

const API_BASE_URL = "http://localhost:9095/identify_service";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const authenticateUser = async (username, password) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/token`,
      { username, password },
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  } catch (error) {
    console.error("Error during authentication:", error);
    throw error;
  }
};

export const introspectToken = async (token) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/introspect`,
      { token },
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error during token introspection:", error);
    throw error;
  }
};

export const refreshToken = async (refreshToken) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/refreshToken`,
      { refreshToken },
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error during token refresh:", error);
    throw error;
  }
};

export const logoutUser = async (token) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/logout`,
      { token },
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error during logout:", error);
    throw error;
  }
};

