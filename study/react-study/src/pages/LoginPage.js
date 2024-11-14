import React, { useState, useCallback } from "react";
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

  const handleLogin = useCallback(
    async (values) => {
      try {
        const data = await authenticateUser(values.username, values.password);
        const response = await introspectToken(data.result.token);
        if (response.result?.valid) {
          localStorage.setItem("isAuthenticated", data.result.authenticated);
          localStorage.setItem("token", data.result.token);
          navigate("/");
        }
      } catch (error) {
        console.error("Error during login:", error);
        setError(error.message || "An error occurred during login");
      }
    },
    [navigate]
  );

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
          <Title level={2}>Login</Title>
          <Form
            name="login"
            onFinish={handleLogin}
            layout="vertical"
            style={{ maxWidth: "300px" }}
          >
            <Form.Item
              name="username"
              label="Username"
              rules={[
                { required: true, message: "Please input your username!" },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Please input your password!" },
              ]}
            >
              <Input.Password />
            </Form.Item>
            {error && <Alert message={error} type="error" />}
            <Form.Item>
              <Button type="primary" htmlType="submit">
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

