import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Alert,
  Typography,
  Card,
  notification,
  Space,
} from "antd";
import { LockOutlined, NumberOutlined, KeyOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { resetPasswordWithToken } from "../services/authService";
import { AxiosError } from "axios";
import { ApiError } from "../type/types";

const { Text, Title, Paragraph } = Typography;

interface ResetPasswordFormValues {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

const ResetPasswordComponent: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (values: ResetPasswordFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const response = await resetPasswordWithToken(
        values.token,
        values.newPassword
      );
      notification.success({
        message: "Password Reset Successful",
        description:
          response.message || "Your password has been reset successfully.",
        duration: 5,
      });
      navigate("/login");
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      setError(
        axiosError.response?.data?.message ||
          "Failed to reset password. Please try again."
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
        maxWidth: "450px",
        margin: "auto",
      }}
    >
      <Title level={2} style={{ textAlign: "center", marginBottom: "5px" }}>
        Reset Your Password
      </Title>
      <Paragraph
        type="secondary"
        style={{ textAlign: "center", marginBottom: "20px" }}
      >
        Enter the verification code sent to your email and create a new password
      </Paragraph>

      <Form
        name="reset-password"
        onFinish={handleSubmit}
        layout="vertical"
        size="large"
        autoComplete="off"
      >
        {/* Verification Code Input with improved styling */}
        <Form.Item
          name="token"
          label={<Text strong>Verification Code</Text>}
          rules={[
            { required: true, message: "Please enter the verification code!" },
          ]}
        >
          <Input
            prefix={<NumberOutlined style={{ color: "#1890ff" }} />}
            placeholder="Enter 6-digit code"
            maxLength={6}
            size="large"
            style={{
              height: "50px",
              fontSize: "18px",
              textAlign: "center",
              letterSpacing: "8px",
            }}
          />
        </Form.Item>

        <div style={{ marginTop: "32px", marginBottom: "8px" }}>
          <Text strong style={{ fontSize: "16px" }}>
            Create New Password
          </Text>
        </div>

        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Form.Item
            name="newPassword"
            rules={[
              { required: true, message: "Please input your new password!" },
              {
                pattern:
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                message:
                  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your new password"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[
              { required: true, message: "Please confirm your password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("The two passwords do not match!")
                  );
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<KeyOutlined />}
              placeholder="Confirm your new password"
              autoComplete="new-password"
            />
          </Form.Item>
        </Space>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: "15px", marginTop: "15px" }}
          />
        )}

        <Form.Item style={{ marginTop: "24px" }}>
          <Button
            type="primary"
            htmlType="submit"
            style={{ width: "100%", height: "45px" }}
            loading={loading}
          >
            Reset Password
          </Button>
        </Form.Item>

        <Form.Item style={{ textAlign: "center", marginBottom: "0" }}>
          <Button
            type="link"
            onClick={handleBackToLogin}
            style={{ padding: "0" }}
          >
            Back to Login
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ResetPasswordComponent;

