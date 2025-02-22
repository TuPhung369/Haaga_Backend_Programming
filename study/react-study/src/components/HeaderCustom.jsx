import React from "react";
import { Layout, notification } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearAllData } from "../store/authSlice"; // Adjust the import path as needed
import CustomButton from "./CustomButton";

const { Header } = Layout;

const HeaderCustom = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(clearAllData()); // Xóa Redux store
    localStorage.removeItem("appState"); // Xóa localStorage
    navigate("/login");
    notification.success({
      message: "Logged out successfully!",
    });
    window.location.reload(); // Reload để đảm bảo không còn dữ liệu cũ
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

