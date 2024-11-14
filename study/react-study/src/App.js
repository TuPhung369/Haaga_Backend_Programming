import React, { useEffect, useState, useCallback } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import UserListPage from "./pages/UserListPage";
import RolesPage from "./pages/RolesPage";
import PermissionsPage from "./pages/PermissionsPage";
import { introspectToken, refreshToken } from "./services/authService";
import { jwtDecode } from "jwt-decode";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkTokenValidity = useCallback(async () => {
    const token = localStorage.getItem("token");
    const currentTime = Date.now() / 1000;
    const tenMinutesFromNow = currentTime + 600;
    if (token) {
      try {
        const introspectResponse = await introspectToken(token);
        const decodedToken = jwtDecode(token);
        if (
          introspectResponse.result.valid ||
          decodedToken.exp < tenMinutesFromNow
        ) {
          setIsAuthenticated(true);
        } else {
          const response = await refreshToken(token);
          const decodedRefreshToken = jwtDecode(response.result.refreshToken);
          if (decodedRefreshToken.exp < tenMinutesFromNow) {
            setIsAuthenticated(false);
            localStorage.clear();
          } else {
            localStorage.setItem("token", response.token);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error("Error checking token validity:", error);
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    checkTokenValidity();
  }, [checkTokenValidity]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/home"
          element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/users"
          element={
            isAuthenticated ? <UserListPage /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/roles"
          element={isAuthenticated ? <RolesPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/permissions"
          element={
            isAuthenticated ? <PermissionsPage /> : <Navigate to="/login" />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

