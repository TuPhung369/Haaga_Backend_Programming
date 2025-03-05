// src/App.tsx
import React, { useEffect, useState, ReactNode, useCallback } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Layout, Spin } from "antd";

import LoginPage from "./pages/LoginPage";
import ResetPasswordComponent from "./components/ResetPasswordComponent";
import ForgotPasswordComponent from "./components/ForgotPasswordComponent";
import EmailVerificationComponent from "./components/EmailVerificationComponent";
import NetworkStatusDetector from "./components/NetworkStatusDetector";
import CalendarPage from "./pages/CalendarPage";
import KanbanPage from "./pages/KanbanPage";
import HomePage from "./pages/HomePage";
import UserListPage from "./pages/UserListPage";
import RolesPage from "./pages/RolesPage";
import PermissionsPage from "./pages/PermissionsPage";
import OAuth2RedirectHandler from "./components/OAuth2RedirectHandler";
import StatisticPage from "./pages/StatisticPage";
import HeaderCustom from "./components/HeaderCustom";
import Sidebar from "./components/Sidebar";
import { refreshCookieToken, clearAuthData } from "./store/authSlice";
import { resetAllData } from "./store/resetActions";
import { RootState } from "./type/types";
import { AppDispatch } from "./store/store";

const { Content, Footer } = Layout;

interface AuthWrapperProps {
  children: ReactNode;
}

// Set up token refresh interval (in milliseconds)
const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { token, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  // Function to check token validity and refresh if needed
  const verifyAndRefreshToken = useCallback(async () => {
    setIsChecking(true);

    try {
      if (isAuthenticated && token) {
        // If we have a token, try to refresh it
        await dispatch(refreshCookieToken()).unwrap();
      } else {
        // No token, clear auth state and redirect to login
        dispatch(clearAuthData());
        dispatch(resetAllData());
        navigate("/login");
      }
    } catch (error) {
      console.error("Token validation or refresh failed:", error);
      dispatch(clearAuthData());
      dispatch(resetAllData());
      navigate("/login");
    } finally {
      setIsChecking(false);
    }
  }, [navigate, token, isAuthenticated, dispatch]);

  useEffect(() => {
    // Check token on component mount
    verifyAndRefreshToken();

    // Set up periodic token refresh
    const refreshInterval = setInterval(() => {
      if (isAuthenticated && token) {
        dispatch(refreshCookieToken()).catch((error) => {
          console.error("Periodic token refresh failed:", error);
          dispatch(clearAuthData());
          dispatch(resetAllData());
          navigate("/login");
        });
      }
    }, TOKEN_REFRESH_INTERVAL);

    // Set up global event listener for logout events
    const handleLogout = () => {
      dispatch(clearAuthData());
      dispatch(resetAllData());
      navigate("/login");
    };

    window.addEventListener("auth:logout", handleLogout);

    // Clean up interval and event listener on unmount
    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, [verifyAndRefreshToken, isAuthenticated, token, dispatch, navigate]);

  if (isChecking) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" tip="Verifying authentication..." />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
};

const App: React.FC = () => (
  <NetworkStatusDetector>
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordComponent />} />
        <Route path="/forgot-password" element={<ForgotPasswordComponent />} />
        <Route path="/oauths/redirect" element={<OAuth2RedirectHandler />} />
        <Route path="/verify-email" element={<EmailVerificationComponent />} />
        <Route
          path="/"
          element={
            <AuthWrapper>
              <MainLayout>
                <HomePage />
              </MainLayout>
            </AuthWrapper>
          }
        />
        <Route
          path="/userList"
          element={
            <AuthWrapper>
              <MainLayout>
                <UserListPage />
              </MainLayout>
            </AuthWrapper>
          }
        />
        <Route
          path="/roles"
          element={
            <AuthWrapper>
              <MainLayout>
                <RolesPage />
              </MainLayout>
            </AuthWrapper>
          }
        />
        <Route
          path="/permissions"
          element={
            <AuthWrapper>
              <MainLayout>
                <PermissionsPage />
              </MainLayout>
            </AuthWrapper>
          }
        />
        <Route
          path="/statistics"
          element={
            <AuthWrapper>
              <MainLayout>
                <StatisticPage />
              </MainLayout>
            </AuthWrapper>
          }
        />
        <Route
          path="/calendar"
          element={
            <AuthWrapper>
              <MainLayout>
                <CalendarPage />
              </MainLayout>
            </AuthWrapper>
          }
        />
        <Route
          path="/kanban"
          element={
            <AuthWrapper>
              <MainLayout>
                <KanbanPage />
              </MainLayout>
            </AuthWrapper>
          }
        />
      </Routes>
    </Router>
  </NetworkStatusDetector>
);

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // Get current route to apply specific styling
  const location = useLocation();
  const isKanbanRoute = location.pathname === "/kanban";

  return (
    <Layout style={{ minHeight: "100vh", background: "whitesmoke" }}>
      <HeaderCustom />
      <Layout>
        <Sidebar />
        <Content
          style={{
            padding: isKanbanRoute ? 0 : "24px",
            height: "calc(100vh - 64px - 70px)",
            overflow: "auto",
          }}
        >
          {children}
        </Content>
      </Layout>
      <Footer
        style={{
          textAlign: "center",
          background: "white",
          height: "70px",
          padding: "24px",
        }}
      >
        The Application ©2024 Created by Tu Phung
      </Footer>
    </Layout>
  );
};

export default App;

