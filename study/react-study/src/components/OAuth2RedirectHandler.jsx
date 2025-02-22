import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const OAuth2RedirectHandler = () => {
  const appBaseUri = process.env.REACT_APP_BASE_URI;
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      console.log("Token received:", token);
      // Store the token in local storage
      localStorage.setItem("token", token);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("loginSocial", "true");
      // Navigate to the home page
      window.location.href = appBaseUri;
    } else {
      console.error("No token found in the URL");
      navigate("/login");
    }
  }, [navigate, appBaseUri]);

  return <div>Processing authentication...</div>; // Loading indicator
};

export default OAuth2RedirectHandler;

