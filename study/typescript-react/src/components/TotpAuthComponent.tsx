import React, { useState, useEffect } from "react";
import { Form, Input, Button, Typography, Card, notification } from "antd";
import { KeyOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { setAuthData } from "../store/authSlice";
import { useNavigate } from "react-router-dom";
import LoadingState from "./LoadingState";
import { setupTokenRefresh } from "../utils/tokenRefresh";
import { COLORS } from "../utils/constant";
// Using ServiceError for type checking only
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ServiceError } from "../services/baseService";
import axios from "axios";

const { Title, Text } = Typography;

interface TotpAuthComponentProps {
  username: string;
  password: string;
  onBack: () => void;
  onAuthenticated: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface AxiosErrorType {
  response?: {
    data?: Record<string, unknown>;
    status?: number;
  };
  message?: string;
  code?: string;
  status?: number;
}

const MAX_ATTEMPTS = 3; // Số lần thử tối đa - chỉ sử dụng để hiển thị UI

const TotpAuthComponent: React.FC<TotpAuthComponentProps> = ({
  username,
  password,
  onBack,
  onAuthenticated
}) => {
  const [totpCode, setTotpCode] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(
    null
  );
  const [isAccountLocked, setIsAccountLocked] = useState<boolean>(false);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Enable admin mode (for demo purposes only)
  const enableAdminMode = () => {
    const adminPassword = prompt("Enter admin password:");
    // Demo: admin password is 'admin123'
    if (adminPassword === "admin123") {
      setIsAdminMode(true);
      notification.success({
        message: "Admin Mode Enabled",
        description: "You can now unlock accounts."
      });
    } else {
      notification.error({
        message: "Authentication Failed",
        description: "Incorrect admin password."
      });
    }
  };

  // Function for admin to unlock account (in a real app, this would call a backend API)
  const handleAdminUnlock = () => {
    if (!isAdminMode) {
      notification.error({
        message: "Permission Denied",
        description: "You must be in admin mode to unlock accounts."
      });
      return;
    }

    try {
      // TODO: In a real implementation, this would be an API call to backend
      // Example: await adminService.unlockAccount(username);

      setIsAccountLocked(false);
      setRemainingAttempts(MAX_ATTEMPTS);
      notification.success({
        message: "Account Unlocked",
        description: `The account ${username} has been successfully unlocked.`
      });
      setError(null);
    } catch (err) {
      console.error("Error unlocking account:", err);
      notification.error({
        message: "Error",
        description: "Failed to unlock the account. Please try again."
      });
    }
  };

  // Kiểm tra trạng thái khóa ban đầu thông qua API
  useEffect(() => {
    // Trong thực tế, đây sẽ là một API call để kiểm tra trạng thái tài khoản
    // Ví dụ: checkAccountStatus(username).then(status => {
    //   setIsAccountLocked(status.isBlocked);
    //   setRemainingAttempts(MAX_ATTEMPTS - status.attemptTried);
    // })

    // Hiện tại, chỉ khởi tạo giá trị mặc định cho UI ban đầu
    // KHÔNG set giá trị mặc định cho remainingAttempts để tránh ghi đè giá trị thực tế
    setIsAccountLocked(false);
  }, [username]);

  const handleTotpSubmit = async () => {
    if (!totpCode) {
      setError("Please enter your verification code");
      return;
    }

    // Kiểm tra nếu tài khoản đã bị khóa
    if (isAccountLocked) {
      notification.error({
        message: "Account Locked",
        description:
          "Your account has been locked due to too many failed attempts. Please contact the administrator for assistance."
      });
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // Tự thực hiện request thay vì sử dụng service để có thể bắt response dễ dàng hơn
      const API_BASE_URI = import.meta.env.VITE_API_BASE_URI || "";
      const result = await axios.post(
        `${API_BASE_URI}/auth/totp/token`,
        {
          username,
          password,
          totpCode
        },
        {
          validateStatus: () => true // Luôn trả về response, không throw exception
        }
      );

      console.log("Direct API response:", result);

      // Kiểm tra nếu request thành công
      if (result.status === 200 && result.data?.result?.token) {
        // Đăng nhập thành công
        dispatch(
          setAuthData({
            token: result.data.result.token,
            isAuthenticated: true,
            loginSocial: false
          })
        );
        setupTokenRefresh(result.data.result.token);
        notification.success({
          message: "Success",
          description: "2FA verification successful!"
        });
        onAuthenticated();
        navigate("/");
        return;
      }

      // Xử lý response lỗi
      const responseData = result.data;
      let attemptsLeft: number | null = null;
      let accountLocked = false;
      let errorMessage = "Authentication failed";

      console.log("Error response data:", responseData);

      // Kiểm tra response để lấy thông tin
      if (responseData) {
        // Lấy message từ response
        if (responseData.message) {
          errorMessage = responseData.message;
          console.log("Error message from response:", errorMessage);
        }

        // Kiểm tra account locked
        if (
          responseData.code === 4031 ||
          responseData.errorCode === "ACCOUNT_LOCKED" ||
          (errorMessage &&
            (errorMessage.includes("locked") ||
              errorMessage.includes("blocked")))
        ) {
          accountLocked = true;
          console.log("Account is locked based on response data");
        }

        // Lấy remaining attempts từ metadata
        if (
          responseData.metadata &&
          typeof responseData.metadata === "object" &&
          typeof responseData.metadata.remainingAttempts === "number"
        ) {
          attemptsLeft = responseData.metadata.remainingAttempts;
          console.log("Found remainingAttempts in metadata:", attemptsLeft);

          // Nếu không còn lần thử, tài khoản bị khóa
          if (attemptsLeft === 0) {
            accountLocked = true;
          }
        }
      }

      console.log("Final remaining attempts:", attemptsLeft);
      console.log("Is account locked:", accountLocked);

      // Cập nhật UI với thông tin từ response
      setError(errorMessage);

      if (attemptsLeft !== null) {
        setRemainingAttempts(attemptsLeft);
      }

      if (accountLocked) {
        setIsAccountLocked(true);
      }

      // Hiển thị thông báo tương ứng
      if (accountLocked) {
        notification.error({
          message: "Account Locked",
          description:
            "Your account has been locked due to too many failed attempts. Please contact the administrator for assistance."
        });
      } else if (attemptsLeft !== null && attemptsLeft > 0) {
        const attemptsMessage = `Invalid verification code. You have ${attemptsLeft} attempt${
          attemptsLeft === 1 ? "" : "s"
        } remaining before your account is locked.`;

        notification.warning({
          message: "Invalid Code",
          description: attemptsMessage
        });

        setError(attemptsMessage);
      } else {
        notification.error({
          message: "Verification Error",
          description: errorMessage
        });
      }
    } catch (error) {
      console.error("TOTP authentication error:", error);

      // Xử lý trường hợp lỗi mạng hoặc lỗi khác
      setError("Network error or server unavailable. Please try again later.");

      notification.error({
        message: "Connection Error",
        description:
          "Could not connect to the authentication server. Please try again later."
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
                fontWeight: "bold"
              }}
              disabled={isAccountLocked}
            />
          </Form.Item>

          {error && (
            <div
              style={{ color: "red", marginBottom: 16, textAlign: "center" }}
            >
              {error}
            </div>
          )}

          {remainingAttempts !== null &&
            !error?.includes(`${remainingAttempts} attempt`) &&
            !isAccountLocked && (
              <div
                style={{
                  color: "orange",
                  marginBottom: 16,
                  textAlign: "center"
                }}
              >
                You have {remainingAttempts} attempt
                {remainingAttempts === 1 ? "" : "s"} remaining before your
                account is locked.
              </div>
            )}

          {isAccountLocked && (
            <div
              style={{
                color: "red",
                marginBottom: 16,
                textAlign: "center",
                padding: "10px",
                border: "1px solid #ffbdbd",
                backgroundColor: "#fff2f2",
                borderRadius: "4px"
              }}
            >
              <p style={{ fontWeight: "bold", margin: 0 }}>Account Locked</p>
              <p style={{ margin: "5px 0 0 0" }}>
                Your account has been locked due to multiple failed
                authentication attempts.
              </p>
              <p style={{ margin: "5px 0 0 0", fontWeight: "bold" }}>
                Please contact the administrator for assistance.
              </p>
              <p style={{ margin: "5px 0 0 0", fontSize: "0.9em" }}>
                Email: tuphung0107@gmail.com
              </p>

              {/* Admin controls - only visible in admin mode */}
              {isAdminMode && (
                <Button
                  type="primary"
                  danger
                  style={{ marginTop: 10 }}
                  onClick={handleAdminUnlock}
                >
                  Admin: Unlock Account
                </Button>
              )}
            </div>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              style={{ width: "100%", marginBottom: 10 }}
              disabled={isAccountLocked}
            >
              Verify
            </Button>

            <Button onClick={onBack} style={{ width: "100%" }}>
              Back to Login
            </Button>
          </Form.Item>
        </Form>

        {/* Admin button - click to show admin password prompt */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Button
            type="link"
            size="small"
            onClick={enableAdminMode}
            style={{ fontSize: "0.8em", color: "#d9d9d9" }}
          >
            {isAdminMode ? "Admin Mode Enabled" : "Admin"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TotpAuthComponent;
