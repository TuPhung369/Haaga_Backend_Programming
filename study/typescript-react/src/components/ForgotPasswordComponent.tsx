import React, { useState, useEffect } from "react";
import { Form, Input, Button, Alert, Typography, notification } from "antd";
import {
  UserOutlined,
  MailOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../services/authService";
import { AxiosError } from "axios";
import { ApiError } from "../types/ApiTypes";
import LoadingState from "../components/LoadingState";
import "../styles/ForgotPassword.css";

const { Text, Title, Paragraph } = Typography;

const ForgotPasswordComponent: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Focus first input on component mount
  useEffect(() => {
    const input = document.querySelector(
      ".forgot-password-form input"
    ) as HTMLInputElement;
    if (input) {
      setTimeout(() => input.focus(), 500);
    }
  }, []);

  const handleSubmit = async (values: { username: string; email: string }) => {
    setLoading(true);
    setError(null);
    setIsSubmitting(true);

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
      setIsSubmitting(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="forgot-password-container">
      {isSubmitting && (
        <LoadingState
          tip="Sending reset code..."
          fullscreen={true}
        />
      )}
      <div className="forgot-password-card">
        {!isSubmitting && (
          <>
            <div className="card-header">
              <Title level={2} className="card-title">
                Forgot Password
              </Title>

              <Paragraph className="card-subtitle">
                Enter your username and email to receive a password reset code
              </Paragraph>

              <Button
                type="link"
                className="back-button"
                onClick={handleBackToLogin}
                icon={<ArrowLeftOutlined />}
              >
                Back to Login
              </Button>
            </div>

            <Form
              form={form}
              name="forgot-password"
              onFinish={handleSubmit}
              layout="vertical"
              size="large"
              className="forgot-password-form"
              autoComplete="off"
            >
              <Form.Item
                name="username"
                label={<Text className="input-label">Username</Text>}
                rules={[
                  { required: true, message: "Please input your username!" },
                ]}
              >
                <Input
                  prefix={<UserOutlined className="input-icon" />}
                  placeholder="Enter your username"
                  autoComplete="username"
                  className="custom-input"
                />
              </Form.Item>

              <Form.Item
                name="email"
                label={<Text className="input-label">Email</Text>}
                rules={[
                  { required: true, message: "Please input your email!" },
                  {
                    type: "email",
                    message: "Please enter a valid email address!",
                  },
                ]}
              >
                <Input
                  prefix={<MailOutlined className="input-icon" />}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className="custom-input"
                />
              </Form.Item>

              {error && (
                <Alert
                  message={error}
                  type="error"
                  showIcon
                  closable
                  className="error-alert"
                />
              )}

              <Form.Item className="submit-form-item">
                <Button
                  type="primary"
                  htmlType="submit"
                  className="submit-button"
                  loading={loading}
                  disabled={isSubmitting}
                >
                  Send Reset Code
                </Button>
              </Form.Item>

              <div className="info-message">
                <MailOutlined className="info-icon" />
                <Text className="info-text">
                  We'll send a verification code to your email. Check your inbox
                  and spam folder.
                </Text>
              </div>
            </Form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordComponent;

