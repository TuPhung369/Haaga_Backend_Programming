// src/components/HeaderCustom.tsx

import React from "react";
import { Layout, notification } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutWithCookie } from "../store/authSlice";
import { resetAllData } from "../store/resetActions";
import CustomButton from "./CustomButton";
import { RootState } from "../type/types";
import { AppDispatch } from "../store/store";

const { Header } = Layout;

const HeaderCustom: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  window.addEventListener("auth:logout", () => {
    dispatch(logoutWithCookie());
    dispatch(resetAllData());
    navigate("/login");
  });

  const handleLogout = async () => {
    try {
      // Use the cookie-based logout action
      await dispatch(logoutWithCookie()).unwrap();
      dispatch(resetAllData());
      navigate("/login");
      notification.success({
        message: "Logged out successfully!",
      });
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, we'll reset the state and navigate to login
      dispatch(resetAllData());
      navigate("/login");
      notification.success({
        message: "Logged out",
        description: "Session ended",
      });
    }
  };

  return (
    <Header
      style={{
        color: "white",
        padding: "0 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "white",
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

