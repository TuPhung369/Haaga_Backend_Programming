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
} from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Layout } from "antd";
import { Provider } from "react-redux";
import store from "./store/store";
import RecaptchaProvider from "./components/RecaptchaProvider";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

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
import AssistantAIPage from "./pages/AssistantAIPage";
import LanguageAIPage from "./pages/LanguageAIPage";
import ChatPage from "./pages/ChatPage";
import Sidebar from "./components/Sidebar";
import ProfilePage from "./pages/ProfilePage";
import SettingPage from "./pages/SettingPage";
import {
  introspectToken,
  refreshTokenFromCookie,
} from "./services/authService";
import { clearAuthData, setAuthData } from "./store/authSlice";
import { resetAllData } from "./store/resetActions";
import { RootState } from "./types";
import { setupTokenRefresh } from "./utils/tokenRefresh";
import "./styles/Totp.css";
import { notification } from "antd";

const { Content } = Layout;

interface AuthWrapperProps {
  children: ReactNode;
}

// Create a responsive theme with light/dark mode support
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#3f51b5", // Indigo
    },
    secondary: {
      main: "#f50057", // Pink
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// AuthWrapper component with the authentication check logic
// This must be used INSIDE the Router context
const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useSelector(
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
          } catch (error) {
            console.log("Token validation failed, trying refresh...", error);
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
                  loginSocial: false,
                })
              );
              setupTokenRefresh(refreshResponse.result.token);
              setIsChecking(false);
              return; // Success - exit function
            }
          } catch (refreshError: unknown) {
            console.error("Token refresh failed:", refreshError);

            // Define type for error with originalError property
            interface RefreshErrorWithOriginal {
              originalError?: {
                response?: {
                  status?: number;
                };
              };
            }

            // Special handling for 401 errors (expired/invalid refresh token)
            if (
              refreshError &&
              typeof refreshError === "object" &&
              // Type guard to check if the error has the expected shape
              (refreshError as RefreshErrorWithOriginal).originalError?.response
                ?.status === 401
            ) {
              notification.info({
                message: "Session Expired",
                description: "Your session has expired. Please log in again.",
                key: "session-expired",
              });
            }

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
  // Temporarily disable authentication check
  return <>{children}</>;
};

// MainLayout component to handle the layout with sidebar
// This must also be used INSIDE the Router context
const MainLayout = ({ children }: { children: ReactNode }) => {
  // Get current route to apply specific styling
  //const location = useLocation();
  //const isKanbanRoute = location.pathname === "/kanban";

  // Content area styling
  const contentStyle = {
    padding: "15px",
    height: "100vh",
    overflow: "auto",
    background: "linear-gradient(45deg, #1a3478 0%, #3a7bd5 70%)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  };

  // Main layout styling
  const layoutStyle = {
    minHeight: "100vh",
    background: "#182538",
    display: "flex",
  };

  return (
    <Layout style={layoutStyle}>
      <Sidebar />
      <Layout style={{ background: "transparent" }}>
        <Content style={contentStyle}>{children}</Content>
      </Layout>
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
        <ThemeProvider theme={theme}>
          <CssBaseline />
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
                          path="/assistantAI"
                          element={<AssistantAIPage />}
                        />
                        <Route
                          path="/languageAI"
                          element={<LanguageAIPage />}
                        />
                        <Route
                          path="/adminDashBoard"
                          element={<AdminDashBoardPage />}
                        />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/chat" element={<ChatPage />} />
                        <Route path="/setting" element={<SettingPage />} />
                        <Route path="*" element={<HomePage />} />
                      </Routes>
                    </MainLayout>
                  </AuthWrapper>
                }
              />
            </Routes>
          </Router>
        </ThemeProvider>
      </RecaptchaProvider>
    </Provider>
  );
};

export default App;

