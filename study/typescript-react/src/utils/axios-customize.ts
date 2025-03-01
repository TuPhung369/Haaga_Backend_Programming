import axios from "axios";
import { AxiosRequestHeaders } from "axios";

const apiBaseUri = import.meta.env.REACT_APP_API_BASE_URI;
const instance = axios.create({
  baseURL: apiBaseUri,
  withCredentials: true,
});

// Function to generate headers with token if available
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

instance.interceptors.request.use(
  function (config) {
    // Merge headers with type assertion
    config.headers = {
      ...config.headers,
      "Content-Type": "application/json",
      ...getAuthHeader(),
    } as AxiosRequestHeaders;

    console.log("Request config with headers:", config); // Debug logging
    return config;
  },
  function (error) {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  function (response) {
    console.log("Response data:", response.data); // Debug logging
    if (response && response.data) {
      return response.data;
    } else {
      return response;
    }
  },
  function (error) {
    console.error("Response error:", error);
    if (error && error.response && error.response.data) {
      return Promise.reject(error.response.data);
    } else {
      return Promise.reject(error);
    }
  }
);

export default instance;

