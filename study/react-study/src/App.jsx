import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
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
import { Layout } from "antd";
import { useSelector, useDispatch } from "react-redux";
import { clearAuthData } from "./store/authSlice";

const { Content, Footer } = Layout;

const AuthWrapper = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector((state) => state.auth);

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
            <Layout style={{ minHeight: "100vh", background: "whitesmoke" }}>
              <HeaderCustom />
              <Layout>
                <Sidebar />
                <Content style={{ padding: "0" }}>
                  <HomePage />
                </Content>
              </Layout>
              <Footer style={{ textAlign: "center", background: "white" }}>
                The Application ©2024 Created by Tu Phung
              </Footer>
            </Layout>
          </AuthWrapper>
        }
      />
      <Route
        path="/userList"
        element={
          <AuthWrapper>
            <Layout style={{ minHeight: "100vh", background: "whitesmoke" }}>
              <HeaderCustom />
              <Layout>
                <Sidebar />
                <Content style={{ padding: "0" }}>
                  <UserListPage />
                </Content>
              </Layout>
              <Footer style={{ textAlign: "center", background: "white" }}>
                The Application ©2024 Created by Tu Phung
              </Footer>
            </Layout>
          </AuthWrapper>
        }
      />
      <Route
        path="/roles"
        element={
          <AuthWrapper>
            <Layout style={{ minHeight: "100vh", background: "whitesmoke" }}>
              <HeaderCustom />
              <Layout>
                <Sidebar />
                <Content style={{ padding: "0" }}>
                  <RolesPage />
                </Content>
              </Layout>
              <Footer style={{ textAlign: "center", background: "white" }}>
                The Application ©2024 Created by Tu Phung
              </Footer>
            </Layout>
          </AuthWrapper>
        }
      />
      <Route
        path="/permissions"
        element={
          <AuthWrapper>
            <Layout style={{ minHeight: "100vh", background: "whitesmoke" }}>
              <HeaderCustom />
              <Layout>
                <Sidebar />
                <Content style={{ padding: "0" }}>
                  <PermissionsPage />
                </Content>
              </Layout>
              <Footer style={{ textAlign: "center", background: "white" }}>
                The Application ©2024 Created by Tu Phung
              </Footer>
            </Layout>
          </AuthWrapper>
        }
      />
      <Route
        path="/statistics"
        element={
          <AuthWrapper>
            <Layout style={{ minHeight: "100vh", background: "whitesmoke" }}>
              <HeaderCustom />
              <Layout>
                <Sidebar />
                <Content style={{ padding: "0" }}>
                  <StatisticPage />
                </Content>
              </Layout>
              <Footer style={{ textAlign: "center", background: "white" }}>
                The Application ©2024 Created by Tu Phung
              </Footer>
            </Layout>
          </AuthWrapper>
        }
      />
      <Route
        path="/calendar"
        element={
          <AuthWrapper>
            <Layout style={{ minHeight: "100vh", background: "whitesmoke" }}>
              <HeaderCustom />
              <Layout>
                <Sidebar />
                <Content style={{ padding: "0" }}>
                  <CalendarPage />
                </Content>
              </Layout>
              <Footer style={{ textAlign: "center", background: "white" }}>
                The Application ©2024 Created by Tu Phung
              </Footer>
            </Layout>
          </AuthWrapper>
        }
      />
      <Route
        path="/kanban"
        element={
          <AuthWrapper>
            <Layout style={{ minHeight: "100vh", background: "whitesmoke" }}>
              <HeaderCustom />
              <Layout>
                <Sidebar />
                <Content style={{ padding: "0" }}>
                  <KanbanPage />
                </Content>
              </Layout>
              <Footer style={{ textAlign: "center", background: "white" }}>
                The Application ©2024 Created by Tu Phung
              </Footer>
            </Layout>
          </AuthWrapper>
        }
      />
    </Routes>
  </Router>
);

export default App;


