import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Alert, Typography, Layout, Card } from "antd";
import { authenticateUser, introspectToken } from "../services/authService";

const { Title } = Typography;
const { Content } = Layout;

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkToken = async () => {
      const response = await introspectToken(localStorage.getItem("token"));
      if (
        localStorage.getItem("isAuthenticated") === "true" &&
        response.result?.valid
      ) {
        navigate("/");
      }
    };
    checkToken();
  }, [navigate]);

  const handleLogin = async (values) => {
    try {
      const data = await authenticateUser(values.username, values.password);
      const response = await introspectToken(data.result.token);
      if (response.result?.valid) {
        localStorage.setItem("isAuthenticated", data.result.authenticated);
        localStorage.setItem("token", data.result.token);
      }
      navigate("/");
    } catch (error) {
      console.error("Error during login:", error);
      setError(error.message || "An error occurred during login");
    }
  };

  return (
    <Layout
      style={{
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Content style={{ maxWidth: 400, width: "100%" }}>
        <Card style={{ boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)" }}>
          <Title
            level={3}
            style={{ textAlign: "center", marginBottom: "1.5rem" }}
          >
            Login
          </Title>
          <Form
            layout="vertical"
            onFinish={handleLogin}
            initialValues={{ username: "", password: "" }}
          >
            <Form.Item
              label="Username"
              name="username"
              rules={[
                { required: true, message: "Please enter your username" },
              ]}
            >
              <Input
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Please enter your password" },
              ]}
            >
              <Input.Password
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Form.Item>

            {error && (
              <Alert
                message="Login Error"
                description={error}
                type="error"
                showIcon
                style={{ marginBottom: "1rem" }}
              />
            )}

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Login
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default LoginPage;

