import axios from "axios";

const apiBaseUri = process.env.REACT_APP_API_BASE_URI;
const instance = axios.create({
  baseURL: apiBaseUri,
  withCredentials: true, // Enable if needed for cross-origin requests with cookies
});

// Function to generate headers with token if available
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

instance.interceptors.request.use(
  function (config) {
    // Merge dynamic headers with existing config headers
    config.headers = {
      ...config.headers,
      "Content-Type": "application/json",
      ...getAuthHeader(), // Add the dynamic Authorization header if token is present
    };
    console.log("Request config with headers:", config); // Debug logging for requests
    return config;
  },
  function (error) {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  function (response) {
    console.log("Response data:", response.data); // Debug logging for responses
    if (response && response.data) {
      return response.data;
    } else {
      return response;
    }
  },
  function (error) {
    console.error("Response error:", error); // Debug logging for errors
    if (error && error.response && error.response.data) {
      return Promise.reject(error.response.data);
    } else {
      return Promise.reject(error);
    }
  }
);

export default instance;

