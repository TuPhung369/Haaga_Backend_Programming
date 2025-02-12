import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import HomePage from "./pages/HomePage";
import UserListPage from "./pages/UserListPage";
import RolesPage from "./pages/RolesPage";
import PermissionsPage from "./pages/PermissionsPage";
import OAuth2RedirectHandler from "./components/OAuth2RedirectHandler";
import StatisticPage from "./pages/StatisticPage";
import { introspectToken } from "./services/authService";

const AuthWrapper = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkTokenValidity = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await introspectToken(token);
          if (response.result?.valid) {
            setIsAuthenticated(true);
          } else {
            console.warn("Invalid token, redirecting to login...");
            localStorage.removeItem("token");
            navigate("/login");
          }
        } catch (error) {
          console.error("Error during token introspection:", error);
          localStorage.removeItem("token");
          navigate("/login");
        }
      } else {
        navigate("/login");
      }
    };

    checkTokenValidity();
  }, [navigate]);

  return isAuthenticated ? children : null;
};

const App = () => (
  <Router>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/resetpassword" element={<ResetPasswordPage />} />
      <Route path="/oauths/redirect" element={<OAuth2RedirectHandler />} />
      <Route
        path="/"
        element={
          <AuthWrapper>
            <HomePage />
          </AuthWrapper>
        }
      />
      <Route
        path="/userList"
        element={
          <AuthWrapper>
            <UserListPage />
          </AuthWrapper>
        }
      />
      <Route
        path="/roles"
        element={
          <AuthWrapper>
            <RolesPage />
          </AuthWrapper>
        }
      />
      <Route
        path="/permissions"
        element={
          <AuthWrapper>
            <PermissionsPage />
          </AuthWrapper>
        }
      />
      <Route
        path="/statistics"
        element={
          <AuthWrapper>
            <StatisticPage />
          </AuthWrapper>
        }
      />
    </Routes>
  </Router>
);

export default App;

