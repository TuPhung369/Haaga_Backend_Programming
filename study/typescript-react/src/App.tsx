// src/App.tsx
import React, { useState, useEffect, ReactNode } from "react";
import { initializeAuth } from "./utils/authSetup";
import { setupAxiosInterceptors } from "./utils/axiosSetup";
import apiClient from "./services/authService";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
  useLocation
} from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Layout } from "antd";
import { Provider } from "react-redux";
import store from "./store/store";
import RecaptchaProvider from "./components/RecaptchaProvider";

// Import the new AuthPage component
import AuthPage from "./pages/AuthPage";
import ResetPasswordComponent from "./components/ResetPasswordComponent";
import ForgotPasswordComponent from "./components/ForgotPasswordComponent";
import EmailVerificationComponent from "./components/EmailVerificationComponent";
import CalendarPage from "./pages/CalendarPage";
import KanbanPage from "./pages/KanbanPage";
import HomePage from "./pages/HomePage";
import UserListPage from "./pages/UserListPage";
import RolesPage from "./pages/RolesPage";
import PermissionsPage from "./pages/PermissionsPage";
import OAuth2RedirectHandler from "./components/OAuth2RedirectHandler";
import StatisticPage from "./pages/StatisticPage";
import AdminDashBoardPage from "./pages/AdminDashBoardPage";
import HeaderCustom from "./components/HeaderCustom";
import Sidebar from "./components/Sidebar";
import {
  introspectToken,
  refreshTokenFromCookie
} from "./services/authService";
import { clearAuthData, setAuthData } from "./store/authSlice";
import { resetAllData } from "./store/resetActions";
import { RootState } from "./type/types";
import { setupTokenRefresh } from "./utils/tokenRefresh";
import "./styles/Totp.css";

const { Content, Footer } = Layout;

interface AuthWrapperProps {
  children: ReactNode;
}

// AuthWrapper component with the authentication check logic
// This must be used INSIDE the Router context
const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    let validationInProgress = false;
    const checkTokenValidity = async () => {
      if (validationInProgress) return;
      validationInProgress = true;
      if (token) {
        try {
          // First check if the current token is valid
          try {
            const response = await introspectToken(token);
            if (response.result?.valid) {
              // Token is valid, we can proceed
              setIsChecking(false);
              return; // Exit early - no need to refresh
            }
            // If we reach here, token is invalid - fall through to refresh attempt
          } catch {
            console.log("Token validation failed, trying refresh...");
            // Continue to refresh attempt
          }

          // Only try refreshing if the initial token validation failed
          try {
            const refreshResponse = await refreshTokenFromCookie();
            if (refreshResponse?.result?.token) {
              dispatch(
                setAuthData({
                  token: refreshResponse.result.token,
                  isAuthenticated: true,
                  loginSocial: false
                })
              );
              setupTokenRefresh(refreshResponse.result.token);
              setIsChecking(false);
              return; // Success - exit function
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            // Fall through to logout
          }

          // If we reach here, both validation and refresh failed
          console.warn("Authentication failed, redirecting to login...");
          dispatch(clearAuthData());
          dispatch(resetAllData());
          navigate("/login");
        } catch (error) {
          console.error("Error during authentication flow:", error);
          dispatch(clearAuthData());
          dispatch(resetAllData());
          navigate("/login");
        } finally {
          validationInProgress = false;
        }
      } else {
        // No token, redirect to login
        dispatch(clearAuthData());
        dispatch(resetAllData());
        navigate("/login");
      }
      setIsChecking(false);
    };

    checkTokenValidity();
  }, [navigate, token, dispatch]);

  if (isChecking) return null;
  return isAuthenticated ? <>{children}</> : null;
};

// MainLayout component to handle the layout with sidebar
// This must also be used INSIDE the Router context
const MainLayout = ({ children }: { children: ReactNode }) => {
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
            overflow: "auto"
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
          padding: "24px"
        }}
      >
        The Application ©2024 Created by Tu Phung
      </Footer>
    </Layout>
  );
};

// All routing is now handled directly in the App component

const App: React.FC = () => {
  // Initialize auth and setup axios interceptors
  useEffect(() => {
    initializeAuth();
    setupAxiosInterceptors(apiClient);
  }, []);

  return (
    <Provider store={store}>
      <RecaptchaProvider>
        <Router>
          <Routes>
            {/* Use our new AuthPage component for login */}
            <Route path="/login" element={<AuthPage />} />
            <Route
              path="/reset-password"
              element={<ResetPasswordComponent />}
            />
            <Route
              path="/forgot-password"
              element={<ForgotPasswordComponent />}
            />
            <Route
              path="/oauths/redirect"
              element={<OAuth2RedirectHandler />}
            />
            <Route
              path="/verify-email"
              element={<EmailVerificationComponent />}
            />
            <Route
              path="*"
              element={
                <AuthWrapper>
                  <MainLayout>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/userList" element={<UserListPage />} />
                      <Route path="/roles" element={<RolesPage />} />
                      <Route
                        path="/permissions"
                        element={<PermissionsPage />}
                      />
                      <Route path="/statistics" element={<StatisticPage />} />
                      <Route path="/calendar" element={<CalendarPage />} />
                      <Route path="/kanban" element={<KanbanPage />} />
                      <Route
                        path="/adminDashBoard"
                        element={<AdminDashBoardPage />}
                      />
                    </Routes>
                  </MainLayout>
                </AuthWrapper>
              }
            />
          </Routes>
        </Router>
      </RecaptchaProvider>
    </Provider>
  );
};

export default App;
