import React, { useState, useEffect, ReactNode } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Layout } from "antd";

import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
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
import { introspectToken } from "./services/authService";
import { clearAuthData } from "./store/authSlice";
import { RootState } from "./type/types";

const { Content, Footer } = Layout;

interface AuthWrapperProps {
  children: ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    const checkTokenValidity = async () => {
      if (token) {
        try {
          const response = await introspectToken(token);
          if (!response.result?.valid) {
            console.warn("Invalid token, redirecting to login...");
            dispatch(clearAuthData());
            navigate("/login");
          }
        } catch (error) {
          console.error("Error during token introspection:", error);
          dispatch(clearAuthData());
          navigate("/login");
        }
      } else {
        navigate("/login");
      }
      setIsChecking(false);
    };

    checkTokenValidity();
  }, [navigate, token, dispatch]);

  if (isChecking) return null;
  return isAuthenticated ? <>{children}</> : null;
};

const App: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/resetpassword" element={<ResetPasswordPage />} />
      <Route path="/oauths/redirect" element={<OAuth2RedirectHandler />} />
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
);

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => (
  <Layout style={{ minHeight: "100vh", background: "whitesmoke" }}>
    <HeaderCustom />
    <Layout>
      <Sidebar />
      <Content style={{ padding: "0" }}>{children}</Content>
    </Layout>
    <Footer style={{ textAlign: "center", background: "white" }}>
      The Application ©2024 Created by Tu Phung
    </Footer>
  </Layout>
);

export default App;

