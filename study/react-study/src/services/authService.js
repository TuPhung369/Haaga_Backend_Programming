import axios from "axios";

const API_BASE_URL = "http://localhost:9095/identify_service"; // Update this to your backend server URL

export const authenticateUser = async (username, password) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/token`,
      { username, password },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error authenticating user:", error);
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
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error introspecting token:", error);
    throw error;
  }
};
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/register`,
      userData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
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
export const exchangeAuthorizationCode = async (code) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/oauth2/token`,
      { code },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error exchanging authorization code:", error);
    throw error;
  }
};
export const validateGoogleToken = async (idToken) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/google/token`,
      { id_token: idToken },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error validating Google ID token:", error);
    throw error;
  }
};

