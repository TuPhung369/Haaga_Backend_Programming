import React, { useState, useEffect } from "react";
import { Form, Input, Button, Typography, Card, notification } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { authenticateWithEmailOtpAndCookies } from "../services/authService";
import { useDispatch } from "react-redux";
import { setAuthData } from "../store/authSlice";
import { useNavigate } from "react-router-dom";
import LoadingState from "./LoadingState";
import { setupTokenRefresh } from "../utils/tokenRefresh";
import { COLORS } from "../utils/constant";
import { ServiceError } from "../services/baseService";

const { Title, Text } = Typography;

interface EmailOtpAuthComponentProps {
  username: string;
  password: string;
  onBack: () => void;
  onAuthenticated: () => void;
}

// Define API error response types
interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
      errorCode?: string;
      remainingAttempts?: number;
      extraInfo?: {
        remainingAttempts?: number;
      };
      timestamp?: string;
    };
    status?: number;
  };
  message?: string;
  status?: number;
  field?: string;
  errorType?: string;
  originalError?: unknown;
  remainingAttempts?: number;
}

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

const EmailOtpAuthComponent: React.FC<EmailOtpAuthComponentProps> = ({
  username,
  password,
  onBack,
  onAuthenticated
}) => {
  const [otpCode, setOtpCode] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(
    null
  );
  const [isAccountLocked, setIsAccountLocked] = useState<boolean>(false);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false); // State để kiểm tra có đang ở chế độ admin không

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Bật chế độ admin (chỉ dành cho mục đích demo, trong thực tế cần xác thực admin)
  const enableAdminMode = () => {
    const adminPassword = prompt("Enter admin password:");
    // Demo: admin password là 'admin123'
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

  // Hàm để admin mở khóa tài khoản (trong thực tế, đây sẽ là API call đến BE)
  const handleAdminUnlock = () => {
    if (!isAdminMode) {
      notification.error({
        message: "Permission Denied",
        description: "You must be in admin mode to unlock accounts."
      });
      return;
    }

    try {
      // TODO: Trong thực tế, đây sẽ là API call đến BE để mở khóa tài khoản
      // Ví dụ: await adminService.unlockAccount(username);

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

    // Hiện tại, mô phỏng việc kiểm tra từ response của API
    setIsAccountLocked(false);
    setRemainingAttempts(MAX_ATTEMPTS);
  }, [username]);

  const handleOtpSubmit = async () => {
    if (!otpCode) {
      setError("Please enter the verification code sent to your email");
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
      const response = await authenticateWithEmailOtpAndCookies({
        username,
        password,
        otpCode
      });

      if (response && response.result && response.result.token) {
        // Đăng nhập thành công
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
      console.error("OTP authentication error:", error);

      // Debug: Log the full error object to console
      console.log("Full error object:", JSON.stringify(error, null, 2));

      // Kiểm tra error object
      const apiError = error as ApiErrorResponse;

      // Hiển thị toàn bộ cấu trúc lỗi để debug
      console.log("Error structure:", {
        directError: apiError,
        responseData: apiError.response?.data,
        originalError: apiError.originalError,
        status:
          apiError.response?.status ||
          (apiError.originalError as AxiosErrorType)?.status
      });

      // Trích xuất thông tin từ nhiều vị trí khác nhau trong response
      let responseData;
      let attemptsLeft: number | null = null;
      let accountLocked = false;
      let errorHttpStatus: number | undefined;

      // Kiểm tra status code 403 từ nhiều nguồn khác nhau
      if (apiError.response?.status === 403) {
        accountLocked = true;
        errorHttpStatus = 403;
      } else if (
        apiError.originalError &&
        typeof apiError.originalError === "object"
      ) {
        if (
          "status" in apiError.originalError &&
          apiError.originalError.status === 403
        ) {
          accountLocked = true;
          errorHttpStatus = 403;
        }
      }

      // Kiểm tra nếu error là ServiceError, trích xuất remainingAttempts từ đó
      if (
        error instanceof ServiceError &&
        error.getRemainingAttempts() !== undefined
      ) {
        attemptsLeft = error.getRemainingAttempts() ?? null;
        console.log(
          "Extracted remainingAttempts from ServiceError:",
          attemptsLeft
        );
      }

      // Truy cập dữ liệu từ error.originalError?.originalError?.response?.data (cấu trúc lỗi từ Axios)
      if (
        apiError.originalError &&
        typeof apiError.originalError === "object" &&
        "originalError" in apiError.originalError
      ) {
        const axiosError = apiError.originalError
          .originalError as AxiosErrorType;
        if (axiosError && axiosError.response && axiosError.response.data) {
          responseData = axiosError.response.data;
          console.log(
            "Found responseData in nested originalError:",
            responseData
          );

          // Extract remainingAttempts từ response data nếu có
          if (responseData && typeof responseData === "object") {
            if (
              "remainingAttempts" in responseData &&
              responseData.remainingAttempts !== undefined
            ) {
              attemptsLeft = responseData.remainingAttempts as number;
            } else if (
              "extraInfo" in responseData &&
              responseData.extraInfo &&
              typeof responseData.extraInfo === "object" &&
              "remainingAttempts" in responseData.extraInfo &&
              responseData.extraInfo.remainingAttempts !== undefined
            ) {
              attemptsLeft = responseData.extraInfo.remainingAttempts as number;
            }

            // Kiểm tra xem có phải tài khoản bị khóa không
            if (
              responseData.errorCode === "ACCOUNT_BLOCKED" ||
              responseData.errorCode === "ACCOUNT_LOCKED" ||
              responseData.code === "ACCOUNT_LOCKED" ||
              (responseData.message &&
                (responseData.message.includes("locked") ||
                  responseData.message.includes("blocked")))
            ) {
              accountLocked = true;
            }
          }
        }
      }

      // Nếu không tìm thấy từ trên, thử tìm từ apiError.response?.data
      if (!responseData && apiError.response?.data) {
        responseData = apiError.response.data;
        console.log("Using direct responseData:", responseData);

        // Kiểm tra xem responseData có chứa thông tin về khóa tài khoản không
        if (responseData && typeof responseData === "object") {
          if (
            responseData.errorCode === "ACCOUNT_BLOCKED" ||
            responseData.errorCode === "ACCOUNT_LOCKED" ||
            responseData.code === "ACCOUNT_LOCKED" ||
            (responseData.message &&
              (responseData.message.includes("locked") ||
                responseData.message.includes("blocked")))
          ) {
            accountLocked = true;
          }
        }
      }

      console.log("Response data:", responseData);
      console.log("Attempts left:", attemptsLeft);
      console.log("Is account locked:", accountLocked);
      console.log("HTTP Status:", errorHttpStatus);

      // Cập nhật UI dựa trên thông tin từ BE
      if (attemptsLeft !== null) {
        setRemainingAttempts(attemptsLeft);
      }

      // Cập nhật trạng thái khóa từ BE
      if (accountLocked) {
        setIsAccountLocked(true);
      }

      // Thiết lập thông báo lỗi từ BE
      let message = "Authentication failed";
      if (
        typeof apiError.response?.data?.message === "string" &&
        apiError.response.data.message.trim()
      ) {
        message = apiError.response.data.message;
      } else if (
        responseData &&
        typeof responseData === "object" &&
        "message" in responseData &&
        typeof responseData.message === "string"
      ) {
        message = responseData.message;
      } else if (typeof apiError.message === "string") {
        message = apiError.message;
      }

      console.log("Error message:", message);
      setError(message);

      // Ưu tiên xử lý tài khoản bị khóa
      if (accountLocked || errorHttpStatus === 403) {
        const lockMessage =
          "Your account has been locked due to too many failed attempts. Please contact the administrator for assistance.";

        notification.error({
          message: "Account Locked",
          description: lockMessage
        });

        setError(lockMessage);
        setIsAccountLocked(true);
      }
      // Hiển thị thông báo về số lần thử còn lại
      else if (attemptsLeft !== null && attemptsLeft > 0) {
        const remainingNum = Number(attemptsLeft);
        const message = `Invalid verification code. You have ${attemptsLeft} attempt${
          remainingNum === 1 ? "" : "s"
        } remaining before your account is locked.`;
        notification.warning({
          message: "Invalid Code",
          description: message
        });
        setError(message);
      }
      // Hiển thị thông báo lỗi chung
      else {
        notification.error({
          message: "Verification Error",
          description: message
        });
      }
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

              {/* Admin controls - chỉ hiển thị khi ở chế độ admin */}
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

        {/* Admin button - nhấn để hiện prompt nhập mật khẩu admin */}
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

export default EmailOtpAuthComponent;
