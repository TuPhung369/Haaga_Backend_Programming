import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Alert,
  Typography,
  Layout,
  Card,
  Modal,
  notification,
} from "antd";
import {
  authenticateUser,
  introspectToken,
  resetPassword,
} from "../services/authService";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import "../css/LoginPage.css";
import validateInput from "../utils/validateInput";

const { Title, Text } = Typography;
const { Content } = Layout;

const LoginPage = () => {
  const [error, setError] = useState("");
  const [isForgotPasswordModalVisible, setIsForgotPasswordModalVisible] =
    useState(false);
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/");
    } else {
      localStorage.removeItem("isAuthenticated");
    }
  }, [navigate]);

  const handleLogin = (values) => {
    const login = async () => {
      try {
        const data = await authenticateUser(values.username, values.password);
        const response = await introspectToken(data.result.token);
        if (response.result?.valid || localStorage.getItem("isAuthenticated")) {
          localStorage.setItem("token", data.result.token);
          window.location.href = "/";
        }
      } catch (error) {
        console.error("Error during login:", error);
        setError(error.message || "Invalid username or password");
      }
    };
    login();
  };

  const handleForgotPassword = () => {
    setIsForgotPasswordModalVisible(true);
  };

  const handleForgotPasswordConfirm = async () => {
    setUsernameError("");
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      notification.error({
        message: "Error",
        description: "Passwords do not match!",
      });
      return;
    }

    const errors = validateInput({ username, password: newPassword });
    if (errors.username) {
      setUsernameError(errors.username);
    }
    if (errors.password) {
      setPasswordError(errors.password);
    }
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      await resetPassword(username, newPassword);
      notification.success({
        message: "Success",
        description: "Password reset successfully!",
      });
      setIsForgotPasswordModalVisible(false);
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "An error occurred during password reset",
      });
    }
  };

  return (
    <Layout
      className="login-page-layout"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(to bottom right, #ffffff, #67B6FF)",
      }}
    >
      <Content
        className="login-page-content"
        style={{ maxWidth: 400, width: "100%", padding: "20px" }}
      >
        <Card
          className="login-page-card"
          style={{
            boxShadow: "0 6px 16px rgba(0, 0, 0, 0.1)",
            borderRadius: "10px",
          }}
          hoverable
        >
          <Title
            level={2}
            className="login-page-title"
            style={{ textAlign: "center", marginBottom: "20px" }}
          >
            Login to Your Account
          </Title>
          <Form
            name="login"
            onFinish={handleLogin}
            layout="vertical"
            size="large"
            style={{ maxWidth: "100%" }}
            initialValues={{ remember: true }}
            className="login-page-form"
          >
            <Form.Item
              name="username"
              label={<Text strong>Username</Text>}
              rules={[
                { required: true, message: "Please input your username!" },
              ]}
              className="login-page-form-item"
            >
              <Input
                prefix={<UserOutlined className="site-form-item-icon" />}
                placeholder="Enter your username"
              />
            </Form.Item>
            <Form.Item
              name="password"
              label={<Text strong>Password</Text>}
              rules={[
                { required: true, message: "Please input your password!" },
              ]}
              className="login-page-form-item"
            >
              <Input.Password
                prefix={<LockOutlined className="site-form-item-icon" />}
                placeholder="Enter your password"
              />
            </Form.Item>
            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                closable
                style={{ marginBottom: "15px" }}
                className="login-page-alert"
              />
            )}
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="login-page-button"
                style={{ width: "100%", borderRadius: "5px" }}
              >
                Login
              </Button>
            </Form.Item>
            <Form.Item>
              <Button
                type="link"
                onClick={handleForgotPassword}
                className="login-page-forgot-button"
                style={{ paddingLeft: 0 }}
              >
                Forgot Password?
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>

      <Modal
        title="Reset Your Password"
        open={isForgotPasswordModalVisible}
        onOk={handleForgotPasswordConfirm}
        onCancel={() => setIsForgotPasswordModalVisible(false)}
        okText="Reset Password"
        cancelText="Cancel"
        maskClosable={false}
        centered
        className="login-page-modal"
        style={{
          background: "linear-gradient(to bottom right, #ffffff, #67B6FF)",
          borderRadius: "10px",
          padding: "20px",
        }}
      >
        <Form layout="vertical" className="login-page-modal-form">
          <Form.Item
            label={<Text strong>Username</Text>}
            validateStatus={usernameError ? "error" : ""}
            help={usernameError}
            className="login-page-modal-form-item"
            style={{ marginBottom: "15px" }}
          >
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              style={{
                borderRadius: "5px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            />
          </Form.Item>
          <Form.Item
            label={<Text strong>New Password</Text>}
            validateStatus={passwordError ? "error" : ""}
            help={passwordError}
            className="login-page-modal-form-item"
            style={{ marginBottom: "15px" }}
          >
            <Input.Password
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              style={{
                borderRadius: "5px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            />
          </Form.Item>
          <Form.Item
            label={<Text strong>Confirm Password</Text>}
            className="login-page-modal-form-item"
            style={{ marginBottom: "15px" }}
          >
            <Input.Password
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              style={{
                borderRadius: "5px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default LoginPage;

