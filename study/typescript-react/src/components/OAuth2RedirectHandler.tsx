import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAuthData } from "../store/authSlice";

const OAuth2RedirectHandler = () => {
  const appBaseUri = import.meta.env.VITE_BASE_URI;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      console.log("Token received:", token);
      // Store the token in Redux instead of localStorage
      dispatch(
        setAuthData({
          token,
          isAuthenticated: true,
          loginSocial: true,
        })
      );
      
      // Reset persistMessages to true on social login
      import("../utils/chatUtils").then(module => {
        module.resetPersistMessagesOnLogin();
      });
      
      // Navigate to the home page
      window.location.href = appBaseUri;
    } else {
      console.error("No token found in the URL");
      navigate("/login");
    }
  }, [navigate, appBaseUri, dispatch]);

  return <div>Processing authentication...</div>;
};

export default OAuth2RedirectHandler;

