import React, { useState } from "react";
import { Form, Input, Button, Typography, Card, notification } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { authenticateWithEmailOtpAndCookies } from "../services/authService";
import { useDispatch } from "react-redux";
import { setAuthData } from "../store/authSlice";
import { useNavigate } from "react-router-dom";
import LoadingState from "./LoadingState";
import { setupTokenRefresh } from "../utils/tokenRefresh";
import { COLORS } from "../utils/constant";

const { Title, Text } = Typography;

interface EmailOtpAuthComponentProps {
  username: string;
  password: string;
  onBack: () => void;
  onAuthenticated: () => void;
}

const EmailOtpAuthComponent: React.FC<EmailOtpAuthComponentProps> = ({
  username,
  password,
  onBack,
  onAuthenticated
}) => {
  const [otpCode, setOtpCode] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleOtpSubmit = async () => {
    if (!otpCode) {
      setError("Please enter the verification code sent to your email");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await authenticateWithEmailOtpAndCookies({
        username,
        password,
        otpCode
      });

      if (response && response.result && response.result.token) {
        dispatch(
          setAuthData({
            token: response.result.token,
            isAuthenticated: true,
            loginSocial: false
          })
        );
        setupTokenRefresh(response.result.token);
        notification.success({
          message: "Success",
          description: "Email verification successful!"
        });
        onAuthenticated();
        navigate("/");
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error: unknown) {
      const message =
        (error instanceof Error &&
          (error as { response?: { data?: { message?: string } } }).response
            ?.data?.message) ||
        "Invalid verification code";
      setError(message);
      notification.error({
        message: "Verification Error",
        description: message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f0f2f5"
      }}
    >
      {isSubmitting && <LoadingState tip="Verifying..." fullscreen={true} />}

      <Card
        style={{
          width: 400,
          boxShadow: "0 6px 16px rgba(0, 0, 0, 0.1)",
          borderRadius: "10px"
        }}
      >
        <Title level={3} style={{ textAlign: "center", color: COLORS[12] }}>
          Email Verification
        </Title>

        <Text
          style={{ display: "block", marginBottom: 20, textAlign: "center" }}
        >
          Please enter the verification code sent to your email
        </Text>

        <Form layout="vertical" onFinish={handleOtpSubmit}>
          <Form.Item>
            <Input
              prefix={<MailOutlined />}
              size="large"
              placeholder="Enter 6-digit code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              maxLength={6}
              autoFocus
              style={{
                textAlign: "center",
                letterSpacing: "8px",
                fontWeight: "bold"
              }}
            />
          </Form.Item>

          {error && (
            <div
              style={{ color: "red", marginBottom: 16, textAlign: "center" }}
            >
              {error}
            </div>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              style={{ width: "100%", marginBottom: 10 }}
            >
              Verify
            </Button>

            <Button onClick={onBack} style={{ width: "100%" }}>
              Back to Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default EmailOtpAuthComponent;

