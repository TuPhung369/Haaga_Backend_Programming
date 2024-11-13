import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authenticateUser } from "../services/authService";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem("isAuthenticated") === "true"
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      // Redirect authenticated users to /home
      navigate("/home");
    } else {
      // Unauthenticated users stay on /login
      if (window.location.pathname !== "/login") {
        navigate("/login");
      }
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await authenticateUser(username, password);
      setIsAuthenticated(data.result.authenticated);
      localStorage.setItem("isAuthenticated", data.result.authenticated);
      localStorage.setItem("token", data.result.token);
      navigate("/home");
    } catch (error) {
      setError("Invalid username or password");
      setIsAuthenticated(false);
      localStorage.setItem("isAuthenticated", "false");
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <button type="submit">Login</button>
      </form>
      {error && <div style={{ color: "red" }}>{error}</div>}
    </div>
  );
};

export default LoginPage;

