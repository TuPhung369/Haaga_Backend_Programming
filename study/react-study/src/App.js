import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import UserListPage from "./pages/UserListPage";
import RolesPage from "./pages/RolesPage";
import PermissionsPage from "./pages/PermissionsPage";
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
          if (
            response.result?.valid &&
            localStorage.getItem("isAuthenticated")
          ) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem("token");
            setIsAuthenticated(false);
            navigate("/login");
          }
        } catch (error) {
          console.error("Error during token introspection:", error);
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          navigate("/login");
        }
      } else {
        setIsAuthenticated(false);
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
      <Route
        path="/home"
        element={
          <AuthWrapper>
            <HomePage />
          </AuthWrapper>
        }
      />
      <Route
        path="/users"
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
    </Routes>
  </Router>
);

export default App;

