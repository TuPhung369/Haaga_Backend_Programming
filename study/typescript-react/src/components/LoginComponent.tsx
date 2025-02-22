import React from "react";
import { Form, Input, Button, Alert, Typography, Card } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

const LoginComponent = ({
  handleLogin,
  handleRegister,
  handleForgotPassword,
  error,
}) => {
  return (
    <Card
      style={{
        boxShadow: "0 6px 16px rgba(0, 0, 0, 0.1)",
        borderRadius: "10px",
        maxWidth: "400px",
        margin: "auto",
      }}
    >
      <Title level={2} style={{ textAlign: "center", marginBottom: "20px" }}>
        Login to Your Account
      </Title>
      <Form
        name="login"
        onFinish={handleLogin}
        layout="vertical"
        size="large"
        autoComplete="off"
      >
        <Form.Item
          name="username"
          label={<Text strong>Username</Text>}
          rules={[{ required: true, message: "Please input your username!" }]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Enter your username"
            autoComplete="username"
          />
        </Form.Item>
        <Form.Item
          name="password"
          label={<Text strong>Password</Text>}
          rules={[{ required: true, message: "Please input your password!" }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </Form.Item>
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: "15px" }}
          />
        )}
        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: "100%" }}>
            Login
          </Button>
        </Form.Item>
        <Form.Item>
          <Button type="link" onClick={handleRegister} style={{ padding: 0 }}>
            Register
          </Button>
          <Button
            type="link"
            onClick={handleForgotPassword}
            style={{ padding: 0, marginLeft: "15px" }}
          >
            Forgot Password?
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default LoginComponent;

