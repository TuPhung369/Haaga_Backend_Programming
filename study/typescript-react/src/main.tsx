// src/main.tsx
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import store from "./store/store"; // Import the consolidated store
import { setupTokenRefresh } from "./utils/tokenRefresh";
import { setupAxiosInterceptors } from "./utils/axiosSetup";
import apiClient from "./services/authService";
import "antd/dist/reset.css";
import "./index.css";
import App from "./App";

const rootElement = document.getElementById("root");

// This function can be called after the store is available
const initApp = () => {
  // Get current token from Redux store
  const { token, isAuthenticated } = store.getState().auth;

  if (token && isAuthenticated) {
    setupTokenRefresh(token);
  }

  // Setup axios interceptors for all API calls
  setupAxiosInterceptors(apiClient);
};

// Initialize the app with the store data
initApp();

if (!rootElement) {
  throw new Error("Root element not found!");
}

ReactDOM.createRoot(rootElement as HTMLElement).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);

