import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Alert,
  Typography,
  Card,
  notification,
} from "antd";
import { UserOutlined, MailOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../services/authService";
import { AxiosError } from "axios";
import { ApiError } from "../type/types";

const { Text, Title } = Typography;

const ForgotPasswordComponent: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (values: { username: string; email: string }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await forgotPassword(values.username, values.email);
      notification.success({
        message: "Reset Code Sent",
        description:
          response.message ||
          "A password reset code has been sent to your email.",
        duration: 5,
      });
      navigate("/reset-password");
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      setError(
        axiosError.response?.data?.message ||
          "Failed to send reset code. Please verify your information."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

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
        Reset Your Password
      </Title>
      <Form
        name="forgot-password"
        onFinish={handleSubmit}
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
          name="email"
          label={<Text strong>Email</Text>}
          rules={[
            { required: true, message: "Please input your email!" },
            { type: "email", message: "Please enter a valid email address!" },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="Enter your email"
            autoComplete="email"
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
          <Button
            type="primary"
            htmlType="submit"
            style={{ width: "100%" }}
            loading={loading}
          >
            Send Reset Code
          </Button>
        </Form.Item>

        <Form.Item>
          <Button
            type="link"
            onClick={handleBackToLogin}
            style={{ padding: 0 }}
          >
            Back to Login
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ForgotPasswordComponent;

