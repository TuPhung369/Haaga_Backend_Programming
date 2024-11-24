import React, { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "../GlobalContext";

const OAuth2RedirectHandler = () => {
  const { loginSocial, setLoginSocial } = useContext(GlobalContext);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      console.log("Token received:", token);

      // Store the token in local storage
      localStorage.setItem("token", token);
      localStorage.setItem("isAuthenticated", "true");
      setLoginSocial(true);
      console.log("Token stored in local storage", loginSocial);
      // Navigate to the home page
      setTimeout(() => {
        window.location.href = "http://localhost:3000";
      }, 5000);
      // Navigate to the home page
      console.log("Navigating to home...");
    } else {
      console.error("No token found in the URL");
      navigate("/login");
    }
  }, [navigate, loginSocial, setLoginSocial]);

  return <div>Processing authentication...</div>; // Loading indicator
};

export default OAuth2RedirectHandler;

