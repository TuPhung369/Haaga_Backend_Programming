import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Spin, Alert } from "antd";
import { setAuthData } from "../store/authSlice";

const OAuth2RedirectHandler: React.FC = () => {
  const appBaseUri = import.meta.env.VITE_BASE_URI;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processOAuthRedirect = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (token) {
        console.log("Token received from OAuth redirect");

        // Store the token in Redux
        // Note: The refresh token is automatically handled by cookies
        dispatch(
          setAuthData({
            token,
            isAuthenticated: true,
            loginSocial: true,
          })
        );

        // Navigate to the home page
        setTimeout(() => {
          window.location.href = appBaseUri;
        }, 500);
      } else {
        console.error("No token found in the URL");
        setError("Authentication failed. No token received from the server.");
      }
    };

    processOAuthRedirect();
  }, [navigate, appBaseUri, dispatch]);

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          padding: "0 20px",
        }}
      >
        <Alert
          message="Authentication Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: "20px", maxWidth: "500px" }}
        />
        <button
          onClick={() => navigate("/login")}
          style={{
            padding: "10px 20px",
            borderRadius: "4px",
            backgroundColor: "#1890ff",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
      }}
    >
      <Spin size="large" />
      <p style={{ marginTop: "20px", fontSize: "16px" }}>
        Processing authentication...
      </p>
    </div>
  );
};

export default OAuth2RedirectHandler;

