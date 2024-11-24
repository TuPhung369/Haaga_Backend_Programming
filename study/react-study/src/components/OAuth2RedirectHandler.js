import React, { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "../GlobalContext";

const OAuth2RedirectHandler = () => {
  const { setLoginSocial } = useContext(GlobalContext);
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
      // Navigate to the home page
      window.location.href = "http://localhost:3000";
    } else {
      console.error("No token found in the URL");
      navigate("/login");
    }
  }, [navigate, setLoginSocial]);

  return <div>Processing authentication...</div>; // Loading indicator
};

export default OAuth2RedirectHandler;

