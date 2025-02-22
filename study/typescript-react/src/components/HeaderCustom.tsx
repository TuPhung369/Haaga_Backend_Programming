import React from "react";
import { Layout, notification } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthData } from "../store/authSlice";
import CustomButton from "./CustomButton";

const { Header } = Layout;

const HeaderCustom: React.FC = () => {
  const { isAuthenticated } = useSelector((state: any) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(clearAuthData());
    navigate("/login");
    notification.success({
      message: "Logged out successfully!",
    });
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