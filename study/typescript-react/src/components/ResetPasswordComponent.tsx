import React, { useState, useRef, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Alert,
  Typography,
  notification,
  Space,
  Row,
  Col,
} from "antd";
import {
  LockOutlined,
  KeyOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { resetPasswordWithToken } from "../services/authService";
import { AxiosError } from "axios";
import { ApiError } from "../type/types";
import LoadingState from "../components/LoadingState";
import "../styles/ResetPassword.css";

const { Text, Title, Paragraph } = Typography;

interface ResetPasswordFormValues {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

const ResetPasswordComponent: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [verificationCode, setVerificationCode] = useState<string[]>(
    new Array(6).fill("")
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    // Focus the first input field when component mounts
    setTimeout(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, 500);
  }, []);

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
    setIsSubmitting(true);

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
      setIsSubmitting(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  // Check if all verification code inputs are filled
  const isVerificationComplete = verificationCode.every(
    (digit) => digit !== ""
  );

  return (
    <div className="reset-password-container">
      {isSubmitting && (
        <LoadingState
          tip="Resetting password..."
          fullscreen={true}
        />
      )}
      <div className="reset-password-card">
        {!isSubmitting && (
          <>
            <div className="card-header">
              <Button
                type="link"
                className="back-button"
                onClick={handleBackToLogin}
                icon={<ArrowLeftOutlined />}
              >
                Back to Login
              </Button>
              <Title level={2} className="card-title">
                Reset Your Password
              </Title>
              <Paragraph className="card-subtitle">
                Enter the verification code sent to your email and create a new
                password
              </Paragraph>
            </div>

            <Form
              form={form}
              name="reset-password"
              onFinish={handleSubmit}
              layout="vertical"
              size="large"
              className="reset-password-form"
              autoComplete="off"
            >
              {/* Verification Code Input with individual boxes */}
              <Form.Item
                label={<Text className="input-label">Verification Code</Text>}
                required
                className="verification-form-item"
              >
                <div className="verification-container">
                  <Row
                    gutter={12}
                    justify="center"
                    className="verification-row"
                  >
                    {verificationCode.map((digit, index) => (
                      <Col key={index} className="verification-col">
                        <Input
                          ref={(el) => {
                            inputRefs.current[index] = el;
                          }}
                          value={digit}
                          onChange={(e) => handleChange(e.target.value, index)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          onPaste={index === 0 ? handlePaste : undefined}
                          maxLength={1}
                          className={`verification-input ${
                            digit ? "filled" : ""
                          }`}
                        />
                      </Col>
                    ))}
                  </Row>
                  <Text className="verification-hint">
                    Enter the 6-digit code sent to your email
                  </Text>
                </div>
              </Form.Item>

              <div className="password-section-header">
                <Text className="password-section-title">
                  Create New Password
                </Text>
              </div>

              <Space
                direction="vertical"
                size="middle"
                className="password-fields"
              >
                <Form.Item
                  name="newPassword"
                  rules={[
                    {
                      required: true,
                      message: "Please input your new password!",
                    },
                    {
                      pattern:
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&()#])[A-Za-z\d@$!%*?&()#]{8,}$/,
                      message:
                        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
                    },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined className="input-icon" />}
                    placeholder="Enter your new password"
                    autoComplete="new-password"
                    className="password-input"
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  rules={[
                    {
                      required: true,
                      message: "Please confirm your password!",
                    },
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
                    prefix={<KeyOutlined className="input-icon" />}
                    placeholder="Confirm your new password"
                    autoComplete="new-password"
                    className="password-input"
                  />
                </Form.Item>
              </Space>

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
                  className="reset-button"
                  loading={loading}
                  disabled={!isVerificationComplete || isSubmitting}
                >
                  Reset Password
                </Button>
              </Form.Item>
            </Form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordComponent;
