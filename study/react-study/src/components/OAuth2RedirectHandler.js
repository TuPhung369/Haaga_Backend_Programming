import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  exchangeAuthorizationCode,
  validateGoogleToken,
} from "../services/authService";

const OAuth2RedirectHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      console.log("STEP 1: Authorization code received:", code);

      // Exchange the authorization code for an access token
      exchangeAuthorizationCode(code)
        .then((data) => {
          console.log("STEP 3: Token exchange response data:", data);
          if (data.id_token) {
            console.log("STEP 4: ID token received:", data.id_token);

            // Send the ID token to the backend for validation
            validateGoogleToken(data.id_token)
              .then((result) => {
                console.log("STEP 6: Token validation response data:", result);
                if (result) {
                  localStorage.setItem("token", data.id_token);
                  console.log(
                    "STEP 7: Token stored in local storage, navigating to home"
                  );
                  window.location.href = "http://localhost:3000";
                } else {
                  console.log(
                    "STEP 8: Token validation failed, navigating to login"
                  );
                  navigate("/login");
                }
              })
              .catch((error) => {
                console.error("STEP 9: Error validating ID token:", error);
                navigate("/login");
              });
          } else {
            console.log("STEP 10: No ID token received, navigating to login");
            navigate("/login");
          }
        })
        .catch((error) => {
          console.error("STEP 11: Error exchanging code for token:", error);
          if (error.response) {
            console.error("Response data:", error.response.data);
            console.error("Response status:", error.response.status);
            console.error("Response headers:", error.response.headers);
          }
          navigate("/login");
        });
    } else {
      console.log("STEP 12: No authorization code found, navigating to login");
      navigate("/login");
    }
  }, [navigate]);

  return <div>Loading...</div>;
};

export default OAuth2RedirectHandler;
