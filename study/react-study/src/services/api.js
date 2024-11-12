import axios from "axios";

const API_BASE_URL = "http://localhost:9095/identify_service";

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

