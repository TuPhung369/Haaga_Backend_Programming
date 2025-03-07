import React, { useState, useRef } from "react";
import {
  Form,
  Input,
  Button,
  Alert,
  Typography,
  Card,
  notification,
  Row,
  Col,
} from "antd";
import { CheckCircleOutlined, MailOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyEmail } from "../services/authService";
import { AxiosError } from "axios";
import { ApiError } from "../type/types";

const { Text, Title, Paragraph } = Typography;

const EmailVerificationComponent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string[]>(
    new Array(6).fill("")
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  // Extract username from state (if coming from registration)
  React.useEffect(() => {
    if (location.state && location.state.username) {
      setUsername(location.state.username);

      // Show welcome notification when coming from registration
        notification.info({
          message: "Verification Required",
          description:
            "Please check your email for a 6-digit verification code",
          duration: 6,
          key: "verification-required",
        });

      // Focus the first digit input after a short delay
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 500);
    }
  }, [location.state]);

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

  const handleSubmit = async () => {
    // Validate username
    if (!username) {
      setError("Please enter your username");
      return;
    }

    // Combine verification code digits
    const token = verificationCode.join("");

    if (token.length !== 6) {
      setError("Please enter a complete 6-digit verification code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await verifyEmail(username, token);
      notification.success({
        message: "Email Verified",
        description:
          response.message || "Your email has been verified successfully.",
        duration: 5,
      });
      navigate("/login");
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      setError(
        axiosError.response?.data?.message ||
          "Failed to verify email. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!username) {
      setError("Please enter your username");
      return;
    }

    setLoading(true);

    try {
      // Note: We would need to add a resend verification API endpoint
      /*
      const response = await resendVerificationEmail(username);
      notification.success({
        message: "Verification Code Sent",
        description: "A new verification code has been sent to your email.",
        duration: 5,
      });
      */

      // For now, just show a placeholder message
      notification.info({
        message: "Feature Coming Soon",
        description:
          "Resend verification is not yet implemented. Please check your email for the original code or register again.",
        duration: 5,
      });
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      setError(
        axiosError.response?.data?.message ||
          "Failed to resend verification code."
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
        Verify Your Email
      </Title>
      <Paragraph
        type="secondary"
        style={{ textAlign: "center", marginBottom: "20px" }}
      >
        Enter the verification code sent to your email to complete registration
      </Paragraph>

      <Form
        name="email-verification"
        onFinish={handleSubmit}
        layout="vertical"
        size="large"
        autoComplete="off"
      >
        <Form.Item
          label={<Text strong>Username</Text>}
          style={{ marginBottom: "20px" }}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={!!location.state?.username}
          />
        </Form.Item>

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
            onClick={handleSubmit}
            style={{ width: "100%", height: "45px" }}
            loading={loading}
            icon={<CheckCircleOutlined />}
          >
            Verify Email
          </Button>
        </Form.Item>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Button
            type="link"
            onClick={handleBackToLogin}
            style={{ padding: "0" }}
          >
            Back to Login
          </Button>

          <Button
            type="link"
            onClick={handleResendCode}
            style={{ padding: "0" }}
          >
            Resend Code
          </Button>
        </div>
      </Form>
    </Card>
  );
};

export default EmailVerificationComponent;

