import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const OAuth2RedirectHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    console.log("Token received:", token); // Add this line for debugging

    if (token) {
      localStorage.setItem("token", token);
      navigate("/");
    } else {
      console.error("No token received, redirecting to login."); // Add this line for debugging
      navigate("/login");
    }
  }, [navigate]);

  return <div>Loading...</div>;
};

export default OAuth2RedirectHandler;

