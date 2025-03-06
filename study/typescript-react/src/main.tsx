// src/main.tsx
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import store from "./store/store"; // Import the consolidated store
import { setupTokenRefresh } from "./utils/tokenRefresh";
import "antd/dist/reset.css";
import "./index.css";
import App from "./App";

const rootElement = document.getElementById("root");

// Initialize token refresh on app start
const initApp = () => {
  const { token, isAuthenticated } = store.getState().auth;
  
  if (token && isAuthenticated) {
    setupTokenRefresh(token);
  }
};

// Call initApp when your application loads
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


