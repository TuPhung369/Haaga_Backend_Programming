import React, { useState, useRef } from "react";
import {
  Form,
  Input,
  Button,
  Alert,
  Typography,
  Card,
  notification,
  Space,
  Row,
  Col,
} from "antd";
import { LockOutlined, KeyOutlined } from "@ant-design/icons";
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
  const [verificationCode, setVerificationCode] = useState<string[]>(
    new Array(6).fill("")
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Handle input change for verification code
  const handleChange = (value: string, index: number) => {
    const newVerificationCode = [...verificationCode];

    // Only allow digits
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    newVerificationCode[index] = digit;
    setVerificationCode(newVerificationCode);

    // Move to next input field if this one is filled
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace to navigate to previous input
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste event for verification code
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();

    // Only process if the pasted content looks like a verification code
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setVerificationCode(digits);

      // Focus the last input after pasting
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (values: ResetPasswordFormValues) => {
    // Combine verification code digits
    const token = verificationCode.join("");

    if (token.length !== 6) {
      setError("Please enter a complete 6-digit verification code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await resetPasswordWithToken(token, values.newPassword);
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
        {/* Verification Code Input with individual boxes */}
        <Form.Item
          label={<Text strong>Verification Code</Text>}
          required
          style={{ marginBottom: "30px" }}
        >
          <div style={{ textAlign: "center" }}>
            <Row gutter={12} justify="center">
              {verificationCode.map((digit, index) => (
                <Col key={index}>
                  <Input
                    ref={(el) => (inputRefs.current[index] = el)}
                    value={digit}
                    onChange={(e) => handleChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    maxLength={1}
                    style={{
                      width: "55px",
                      height: "55px",
                      fontSize: "24px",
                      textAlign: "center",
                      borderRadius: "8px",
                      borderColor: digit ? "#1890ff" : undefined,
                      boxShadow: digit
                        ? "0 0 0 2px rgba(24,144,255,0.2)"
                        : undefined,
                      transition: "all 0.3s",
                    }}
                  />
                </Col>
              ))}
            </Row>
            <Text
              type="secondary"
              style={{ display: "block", marginTop: "8px", fontSize: "12px" }}
            >
              Enter the 6-digit code sent to your email
            </Text>
          </div>
        </Form.Item>

        <div style={{ marginTop: "20px", marginBottom: "8px" }}>
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
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&()#])[A-Za-z\d@$!%*?&()#]{8,}$/,
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

