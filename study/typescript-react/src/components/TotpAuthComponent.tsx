import React, { useState } from "react";
import { Form, Input, Button, Typography, Card, notification } from "antd";
import { KeyOutlined } from "@ant-design/icons";
import { authenticateWithTotp } from "../services/authService";
import { useDispatch } from "react-redux";
import { setAuthData } from "../store/authSlice";
import { useNavigate } from "react-router-dom";
import LoadingState from "./LoadingState";
import { setupTokenRefresh } from "../utils/tokenRefresh";
import { COLORS } from "../utils/constant";

const { Title, Text } = Typography;

interface TotpAuthComponentProps {
  username: string;
  password: string;
  onBack: () => void;
  onAuthenticated: () => void;
}

const TotpAuthComponent: React.FC<TotpAuthComponentProps> = ({
  username,
  password,
  onBack,
  onAuthenticated,
}) => {
  const [totpCode, setTotpCode] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleTotpSubmit = async () => {
    if (!totpCode) {
      setError("Please enter your verification code");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await authenticateWithTotp(username, password, totpCode);

      if (response && response.result && response.result.token) {
        dispatch(
          setAuthData({
            token: response.result.token,
            isAuthenticated: true,
            loginSocial: false,
          })
        );
        setupTokenRefresh(response.result.token);
        notification.success({
          message: "Success",
          description: "2FA verification successful!",
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
        description: message,
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
        backgroundColor: "#f0f2f5",
      }}
    >
      {isSubmitting && <LoadingState tip="Verifying..." fullscreen={true} />}

      <Card
        style={{
          width: 400,
          boxShadow: "0 6px 16px rgba(0, 0, 0, 0.1)",
          borderRadius: "10px",
        }}
      >
        <Title level={3} style={{ textAlign: "center", color: COLORS[12] }}>
          Two-Factor Authentication
        </Title>

        <Text
          style={{ display: "block", marginBottom: 20, textAlign: "center" }}
        >
          Please enter the verification code from your authenticator app
        </Text>

        <Form layout="vertical" onFinish={handleTotpSubmit}>
          <Form.Item>
            <Input
              prefix={<KeyOutlined />}
              size="large"
              placeholder="Enter 6-digit code"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              maxLength={6}
              autoFocus
              style={{
                textAlign: "center",
                letterSpacing: "8px",
                fontWeight: "bold",
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

export default TotpAuthComponent;

