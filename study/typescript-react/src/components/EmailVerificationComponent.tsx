import React, { useState, useRef, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Alert,
  Typography,
  notification,
  Row,
  Col,
} from "antd";
import {
  CheckCircleOutlined,
  MailOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  LockOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyEmail } from "../services/authService";
import { AxiosError } from "axios";
import { ApiError } from "../types/ApiTypes";
import LoadingState from "../components/LoadingState";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [activeInput, setActiveInput] = useState(-1);
  const [allDigitsFilled, setAllDigitsFilled] = useState(false);

  // Extract username from state (if coming from registration)
  useEffect(() => {
    if (location.state && location.state.username) {
      setUsername(location.state.username);

      // Show welcome notification when coming from registration
      notification.info({
        message: "Verification Required",
        description: "Please check your email for a 6-digit verification code",
        duration: 6,
        key: "verification-required",
      });

      // Focus the first digit input after a short delay
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 500);
    }
  }, [location.state]);

  // Check if all digits are filled
  useEffect(() => {
    const filled = verificationCode.every((digit) => digit !== "");
    setAllDigitsFilled(filled);
  }, [verificationCode]);

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
      setActiveInput(index + 1);
    }
  };

  // Handle backspace to navigate to previous input
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveInput(index - 1);
    }
  };

  // Handle focus on input
  const handleFocus = (index: number) => {
    setActiveInput(index);
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
      setActiveInput(5);
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
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await verifyEmail(username, token);
      notification.success({
        message: "Email Verified",
        description:
          response.message || "Your email has been verified successfully.",
        duration: 5,
      });
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      setError(
        axiosError.response?.data?.message ||
          "Failed to verify email. Please try again."
      );
      setIsSubmitting(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!username) {
      setError("Please enter your username");
      return;
    }

    setIsResending(true);

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
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <div
      className="email-verification-container"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        padding: "20px",
      }}
    >
      {isSubmitting && (
        <LoadingState tip="Verifying your email..." fullscreen={true} />
      )}

      <div
        className="email-verification-card"
        style={{
          maxWidth: "500px",
          width: "100%",
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Only show content when not submitting */}
        {!isSubmitting && (
          <>
            {/* Header with decorative elements */}
            <div
              className="card-header"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                padding: "30px 20px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                className="header-decoration"
                style={{
                  position: "absolute",
                  width: "200px",
                  height: "200px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.1)",
                  top: "-100px",
                  right: "-50px",
                }}
              ></div>
              <div
                className="header-decoration-2"
                style={{
                  position: "absolute",
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.1)",
                  bottom: "-30px",
                  left: "30px",
                }}
              ></div>

              <div style={{ position: "relative", zIndex: 2 }}>
                <div style={{ textAlign: "center", marginBottom: "5px" }}>
                  <LockOutlined
                    style={{
                      fontSize: "48px",
                      color: "white",
                      padding: "15px",
                      background: "rgba(255, 255, 255, 0.2)",
                      borderRadius: "50%",
                      marginBottom: "10px",
                    }}
                  />
                </div>
                <Title
                  level={2}
                  style={{
                    textAlign: "center",
                    margin: "0 0 8px 0",
                    color: "white",
                  }}
                >
                  Verify Your Email
                </Title>
                <Paragraph
                  style={{
                    textAlign: "center",
                    marginBottom: "5px",
                    color: "rgba(255, 255, 255, 0.8)",
                  }}
                >
                  Enter the verification code sent to your email to complete
                  registration
                </Paragraph>
              </div>
            </div>

            {/* Form content */}
            <div className="card-content" style={{ padding: "30px 35px" }}>
              <Form
                name="email-verification"
                onFinish={handleSubmit}
                layout="vertical"
                size="large"
                autoComplete="off"
              >
                <Form.Item
                  label={
                    <Text strong style={{ fontSize: "16px" }}>
                      Username
                    </Text>
                  }
                  style={{ marginBottom: "25px" }}
                >
                  <Input
                    prefix={<UserOutlined style={{ color: "#764ba2" }} />}
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={!!location.state?.username}
                    style={{
                      borderRadius: "8px",
                      height: "45px",
                    }}
                  />
                </Form.Item>

                {/* Verification Code Input with individual boxes */}
                <Form.Item
                  label={
                    <Text strong style={{ fontSize: "16px" }}>
                      Verification Code
                    </Text>
                  }
                  required
                  style={{ marginBottom: "30px" }}
                >
                  <div style={{ textAlign: "center", marginTop: "10px" }}>
                    <Row gutter={10} justify="center">
                      {verificationCode.map((digit, index) => (
                        <Col key={index}>
                          <Input
                            ref={(el) => (inputRefs.current[index] = el)}
                            value={digit}
                            onChange={(e) =>
                              handleChange(e.target.value, index)
                            }
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            onFocus={() => handleFocus(index)}
                            onBlur={() => setActiveInput(-1)}
                            onPaste={index === 0 ? handlePaste : undefined}
                            maxLength={1}
                            style={{
                              width: "55px",
                              height: "60px",
                              fontSize: "28px",
                              textAlign: "center",
                              borderRadius: "10px",
                              borderWidth: "2px",
                              borderColor:
                                activeInput === index
                                  ? "#667eea"
                                  : digit
                                  ? "#764ba2"
                                  : "#d9d9d9",
                              boxShadow:
                                activeInput === index
                                  ? "0 0 0 2px rgba(102, 126, 234, 0.2)"
                                  : "none",
                              transition: "all 0.3s ease",
                              backgroundColor: digit
                                ? "rgba(118, 75, 162, 0.05)"
                                : "white",
                            }}
                          />
                        </Col>
                      ))}
                    </Row>
                    <Text
                      style={{
                        display: "block",
                        marginTop: "15px",
                        fontSize: "13px",
                        color: "#666",
                      }}
                    >
                      <MailOutlined style={{ marginRight: "8px" }} />
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
                    style={{
                      marginBottom: "25px",
                      marginTop: "5px",
                      borderRadius: "8px",
                    }}
                  />
                )}

                <Form.Item style={{ marginTop: "15px" }}>
                  <Button
                    type="primary"
                    onClick={handleSubmit}
                    style={{
                      width: "100%",
                      height: "48px",
                      borderRadius: "8px",
                      background: allDigitsFilled
                        ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        : undefined,
                      border: allDigitsFilled ? "none" : undefined,
                      fontSize: "16px",
                      fontWeight: 500,
                    }}
                    icon={<CheckCircleOutlined />}
                    loading={loading}
                    disabled={!allDigitsFilled || !username || isSubmitting}
                  >
                    Verify Email
                  </Button>
                </Form.Item>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "15px",
                  }}
                >
                  <Button
                    type="link"
                    onClick={handleBackToLogin}
                    style={{
                      padding: "0",
                      display: "flex",
                      alignItems: "center",
                      color: "#667eea",
                    }}
                  >
                    <ArrowLeftOutlined style={{ marginRight: "5px" }} />
                    Back to Login
                  </Button>

                  <Button
                    type="link"
                    onClick={handleResendCode}
                    style={{
                      padding: "0",
                      display: "flex",
                      alignItems: "center",
                      color: "#667eea",
                    }}
                    loading={isResending}
                    disabled={isResending}
                  >
                    <ReloadOutlined style={{ marginRight: "5px" }} />
                    Resend Code
                  </Button>
                </div>
              </Form>
            </div>
          </>
        )}
      </div>

      {/* Additional styles for animations */}
      <style>{`
        .email-verification-container {
          animation: fadeIn 0.5s ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .card-header {
          transition: all 0.3s ease;
        }

        .email-verification-card:hover .card-header {
          transform: translateY(-5px);
        }
      `}</style>
    </div>
  );
};

export default EmailVerificationComponent;

