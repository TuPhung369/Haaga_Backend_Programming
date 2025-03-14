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

const LOCK_STORAGE_KEY = "locked_accounts";
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 phút (tính bằng ms)

// Hàm kiểm tra xem username có đang bị khóa không
const isUserLocked = (username: string): boolean => {
  try {
    const lockedAccountsStr = localStorage.getItem(LOCK_STORAGE_KEY);
    if (!lockedAccountsStr) return false;

    const lockedAccounts = JSON.parse(lockedAccountsStr);
    const accountData = lockedAccounts[username];

    if (!accountData) return false;

    // Kiểm tra xem khóa đã hết hạn chưa
    const lockExpiry = accountData.expiresAt;
    const now = Date.now();

    if (now > lockExpiry) {
      // Khóa đã hết hạn, xóa khỏi localStorage
      unlockUser(username);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking lock status:", error);
    return false;
  }
};

// Hàm để khóa một username
const lockUser = (username: string): void => {
  try {
    const now = Date.now();
    const expiresAt = now + LOCK_DURATION_MS;

    let lockedAccounts = {};
    const lockedAccountsStr = localStorage.getItem(LOCK_STORAGE_KEY);

    if (lockedAccountsStr) {
      lockedAccounts = JSON.parse(lockedAccountsStr);
    }

    lockedAccounts[username] = {
      lockedAt: now,
      expiresAt: expiresAt
    };

    localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(lockedAccounts));
  } catch (error) {
    console.error("Error locking user:", error);
  }
};

// Hàm để mở khóa username
const unlockUser = (username: string): void => {
  try {
    const lockedAccountsStr = localStorage.getItem(LOCK_STORAGE_KEY);
    if (!lockedAccountsStr) return;

    const lockedAccounts = JSON.parse(lockedAccountsStr);

    if (lockedAccounts[username]) {
      delete lockedAccounts[username];
      localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(lockedAccounts));
    }
  } catch (error) {
    console.error("Error unlocking user:", error);
  }
};

// Hàm để lấy thời gian còn lại (ms) trước khi tài khoản được mở khóa
const getLockRemainingTime = (username: string): number => {
  try {
    const lockedAccountsStr = localStorage.getItem(LOCK_STORAGE_KEY);
    if (!lockedAccountsStr) return 0;

    const lockedAccounts = JSON.parse(lockedAccountsStr);
    const accountData = lockedAccounts[username];

    if (!accountData) return 0;

    const lockExpiry = accountData.expiresAt;
    const now = Date.now();

    return Math.max(0, lockExpiry - now);
  } catch (error) {
    console.error("Error getting lock remaining time:", error);
    return 0;
  }
};

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

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Kiểm tra trạng thái khóa khi component khởi tạo
  useEffect(() => {
    // Hàm để cập nhật lỗi hiển thị với thời gian còn lại
    const updateLockErrorMessage = () => {
      if (isUserLocked(username)) {
        const remainingTime = getLockRemainingTime(username);

        if (remainingTime <= 0) {
          // Đã hết thời gian khóa
          setIsAccountLocked(false);
          setError(null);
          return false;
        } else {
          // Vẫn còn thời gian khóa
          const minutes = Math.ceil(remainingTime / 60000);
          setError(
            `Account locked: Too many failed attempts. Please try again in ${minutes} minute(s).`
          );
          return true;
        }
      }
      return false;
    };

    // Kiểm tra trạng thái khóa khi khởi tạo
    const locked = updateLockErrorMessage();
    setIsAccountLocked(locked);

    // Thiết lập timer nếu tài khoản đang bị khóa
    let timer: ReturnType<typeof setInterval> | null = null;

    if (locked) {
      timer = setInterval(() => {
        // Nếu không còn bị khóa nữa thì xóa timer
        if (!updateLockErrorMessage()) {
          if (timer) clearInterval(timer);
        }
      }, 60000); // Cập nhật mỗi phút
    }

    // Cleanup
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [username]);

  const handleOtpSubmit = async () => {
    if (!otpCode) {
      setError("Please enter the verification code sent to your email");
      return;
    }

    // Kiểm tra nếu tài khoản đã bị khóa
    if (isAccountLocked) {
      const remainingTime = getLockRemainingTime(username);
      const minutes = Math.ceil(remainingTime / 60000);

      notification.error({
        message: "Account Locked",
        description: `Your account has been temporarily locked due to too many failed attempts. Please try again in ${minutes} minute(s).`
      });
      return;
    }

    // Kiểm tra nếu số lần thử còn lại là 0, ngăn việc gọi API
    if (remainingAttempts !== null && remainingAttempts <= 0) {
      // Khóa tài khoản
      lockUser(username);
      setIsAccountLocked(true);

      const remainingTime = getLockRemainingTime(username);
      const minutes = Math.ceil(remainingTime / 60000);

      notification.error({
        message: "Account Locked",
        description: `Your account has been temporarily locked due to too many failed attempts. Please try again in ${minutes} minute(s).`
      });

      setError(
        `Account locked: Too many failed attempts. Please try again in ${minutes} minute(s).`
      );
      return;
    }

    setError(null);
    setRemainingAttempts(null);
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

      setRemainingAttempts(attemptsLeft);

      // Thiết lập lỗi và số lần thử còn lại
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
      if (attemptsLeft !== null) {
        setRemainingAttempts(attemptsLeft);
      }

      // Ưu tiên xử lý tài khoản bị khóa dựa trên nhiều dấu hiệu
      if (
        accountLocked ||
        errorHttpStatus === 403 ||
        (attemptsLeft !== null && attemptsLeft <= 0)
      ) {
        // Khóa tài khoản trong localStorage
        lockUser(username);
        setIsAccountLocked(true);

        const remainingTime = getLockRemainingTime(username);
        const minutes = Math.ceil(remainingTime / 60000);

        const lockMessage = `Your account has been temporarily locked due to too many failed attempts. Please try again in ${minutes} minute(s).`;

        notification.error({
          message: "Account Locked",
          description: lockMessage
        });

        setError(
          `Account locked: Too many failed attempts. Please try again in ${minutes} minute(s).`
        );
      }
      // Kiểm tra nếu có thông tin về số lần thử còn lại
      else if (attemptsLeft !== null) {
        const remainingNum = Number(attemptsLeft);
        const message = `Invalid verification code. You have ${attemptsLeft} attempt${
          remainingNum === 1 ? "" : "s"
        } remaining before your account is temporarily locked.`;
        notification.warning({
          message: "Invalid Code",
          description: message
        });
        setError(message);
      }
      // Hiển thị thông báo lỗi tùy theo tình huống
      else if (
        message.toLowerCase().includes("invalid") ||
        message.includes("Invalid email verification") ||
        message.includes("verification code")
      ) {
        // Sử dụng số lần thử còn lại từ API nếu có, mặc định là 3 nếu không có
        const remaining = attemptsLeft !== null ? attemptsLeft : 3;
        setRemainingAttempts(remaining);

        const remainingNum = Number(remaining);
        const warningMessage = `${message} You have ${remaining} attempt${
          remainingNum === 1 ? "" : "s"
        } remaining before your account is temporarily locked.`;

        notification.warning({
          message: "Invalid Code",
          description: warningMessage
        });
      } else {
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
            !error?.includes(`${remainingAttempts} attempt`) && (
              <div
                style={{
                  color: "orange",
                  marginBottom: 16,
                  textAlign: "center"
                }}
              >
                You have {remainingAttempts} attempt(s) remaining before your
                account is temporarily locked.
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
              <p style={{ fontWeight: "bold", margin: 0 }}>
                Account Temporarily Locked
              </p>
              <p style={{ margin: "5px 0 0 0" }}>
                Due to multiple failed attempts, your account has been locked.
                {error && error.includes("minute")
                  ? ` ${error.substring(error.indexOf("Please"))}`
                  : " Please try again later."}
              </p>
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
      </Card>
    </div>
  );
};

export default EmailOtpAuthComponent;

