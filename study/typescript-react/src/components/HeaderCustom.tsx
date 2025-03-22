// src/components/HeaderCustom.tsx

import React from "react";
import { Layout, notification } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
//import { clearAuthData } from "../store/authSlice";
//import { clearUserInfo } from "../store/userSlice";
import { resetAllData } from "../store/resetActions";
import CustomButton from "./LoginRegisterTitle";
import { logoutUserWithCookies } from "../services/authService";
import { RootState } from "../store/RootState";
import { clearTokenRefresh } from "../utils/tokenRefresh";

const { Header } = Layout;

const HeaderCustom: React.FC = () => {
  // Use the RootState type to get the state from Redux correctly
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      // Clear the refresh timer
      clearTokenRefresh();
      // Call cookie-based logout API
      await logoutUserWithCookies();

      // Clear Redux state
      dispatch(resetAllData());

      // Navigate to login page
      navigate("/login");

      notification.success({
        message: "Logged out successfully!"
      });
    } catch (error) {
      console.error("Error during logout:", error);

      // Still clear Redux state and redirect even if API call fails
      dispatch(resetAllData());
      navigate("/login");

      notification.info({
        message: "Logged out",
        description: "You have been logged out of the application."
      });
    }
  };

  return (
    <Header
      style={{
        color: "white",
        padding: "0 16px"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "white"
        }}
      >
        <div style={{ flex: 1, textAlign: "center" }}>
          <h1 className="animated-title">
            Welcome Spring Boot and ReactJS - FullStack
          </h1>
        </div>
        {isAuthenticated && (
          <CustomButton onClick={handleLogout} type="primary">
            Logout
          </CustomButton>
        )}
      </div>
    </Header>
  );
};

export default HeaderCustom;
