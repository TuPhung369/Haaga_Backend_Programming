// src/utils/axios-customize.ts
import axios, { InternalAxiosRequestConfig } from "axios";
import store from "../store/store";

const API_BASE_URI = import.meta.env.VITE_API_BASE_URI;
const instance = axios.create({
  baseURL: API_BASE_URI,
  withCredentials: true,
});

// Request interceptor to automatically add the token to all requests
instance.interceptors.request.use(
  function (config: InternalAxiosRequestConfig) {
    // Get the token from the Redux store
    const { token } = store.getState().auth;

    // If token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  function (error) {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
instance.interceptors.response.use(
  function (response) {
    // For successful responses, extract the data if it exists
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



