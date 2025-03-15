import React, { useState, useEffect, useRef } from "react";
import { Form, Button, Typography, Card, notification } from "antd";
import { KeyOutlined, LockOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { setAuthData } from "../store/authSlice";
import { useNavigate } from "react-router-dom";
import { setupTokenRefresh } from "../utils/tokenRefresh";
import { COLORS } from "../utils/constant";
import { motion } from "framer-motion";
import axios from "axios";

const { Title, Text } = Typography;

interface TotpAuthComponentProps {
  username: string;
  password: string;
  onBack: () => void;
  onAuthenticated: () => void;
}

interface CustomVerificationCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

const CustomVerificationCodeInput: React.FC<
  CustomVerificationCodeInputProps
> = ({ value, onChange, disabled = false, style }) => {
  const [codeArray, setCodeArray] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Auto focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    const newCodeArray = value
      .split("")
      .concat(Array(6 - value.length).fill(""));
    setCodeArray(newCodeArray.slice(0, 6));
  }, [value]);

  const handleInputChange = (index: number, newValue: string) => {
    if (newValue.length > 1) return;
    if (!/^[0-9]*$/.test(newValue)) return;

    const newCodeArray = [...codeArray];
    newCodeArray[index] = newValue;
    setCodeArray(newCodeArray);

    const newCode = newCodeArray.join("");
    onChange(newCode);

    // Move to next input if value is entered
    if (newValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !codeArray[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pastedData.length > 0) {
      const newCodeArray = pastedData
        .split("")
        .concat(Array(6 - pastedData.length).fill(""))
        .slice(0, 6);
      setCodeArray(newCodeArray);
      onChange(newCodeArray.join(""));
      // Focus last input after paste
      inputRefs.current[5]?.focus();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "12px",
        ...style
      }}
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          style={{
            position: "relative",
            width: "52px",
            height: "64px"
          }}
        >
          <input
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={codeArray[index]}
            onChange={(e) => handleInputChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            style={{
              width: "100%",
              height: "100%",
              fontSize: "28px",
              fontWeight: "600",
              textAlign: "center",
              border: `2px solid ${disabled ? "#d9d9d9" : "#e6e6e6"}`,
              borderRadius: "12px",
              background: disabled ? "#f5f5f5" : COLORS[12],
              color: COLORS[13],
              outline: "none",
              caretColor: COLORS[9],
              transition: "all 0.3s ease",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
              cursor: disabled ? "not-allowed" : "text"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = COLORS[12];
              e.target.style.boxShadow = `0 0 0 2px ${COLORS[12]}40`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = disabled ? "#d9d9d9" : "#e6e6e6";
              e.target.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.1)";
            }}
          />
          {/* Focus effect */}
          <div
            style={{
              position: "absolute",
              bottom: "-2px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "0",
              height: "2px",
              background: COLORS[12],
              transition: "width 0.3s ease"
            }}
          />
          {/* Display entered number */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: "28px",
              fontWeight: "600",
              color: disabled ? "#999" : COLORS[5],
              pointerEvents: "none"
            }}
          >
            {codeArray[index]}
          </div>
        </div>
      ))}
    </div>
  );
};

const MAX_ATTEMPTS = 3;

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

  const enableAdminMode = () => {
    const adminPassword = prompt("Enter admin password:");
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

  const handleAdminUnlock = () => {
    if (!isAdminMode) {
      notification.error({
        message: "Permission Denied",
        description: "You must be in admin mode to unlock accounts."
      });
      return;
    }

    try {
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

  const handleTotpSubmit = async () => {
    if (!totpCode || totpCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

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
      const API_BASE_URI = import.meta.env.VITE_API_BASE_URI || "";
      const result = await axios.post(
        `${API_BASE_URI}/auth/totp/token`,
        {
          username,
          password,
          totpCode
        },
        {
          validateStatus: () => true
        }
      );

      console.log("Direct API response:", result);

      if (result.status === 200 && result.data?.result?.token) {
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

      const responseData = result.data;
      let attemptsLeft: number | null = null;
      let accountLocked = false;
      let errorMessage = "Authentication failed";

      console.log("Error response data:", responseData);

      if (responseData) {
        if (responseData.message) {
          errorMessage = responseData.message;
          console.log("Error message from response:", errorMessage);
        }

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

        if (
          responseData.metadata &&
          typeof responseData.metadata === "object" &&
          typeof responseData.metadata.remainingAttempts === "number"
        ) {
          attemptsLeft = responseData.metadata.remainingAttempts;
          console.log("Found remainingAttempts in metadata:", attemptsLeft);

          if (attemptsLeft === 0) {
            accountLocked = true;
          }
        }
      }

      console.log("Final remaining attempts:", attemptsLeft);
      console.log("Is account locked:", accountLocked);

      setError(errorMessage);

      if (attemptsLeft !== null) {
        setRemainingAttempts(attemptsLeft);
      }

      if (accountLocked) {
        setIsAccountLocked(true);
      }

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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        minHeight: "100vh",
        background: "linear-gradient(145deg, #2E2E2E 0%, #1A1A1A 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-100px",
          left: "-100px",
          width: "300px",
          height: "300px",
          background:
            "radial-gradient(circle, rgba(255, 255, 255, 0.1), transparent)",
          pointerEvents: "none"
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-150px",
          right: "-150px",
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(circle, rgba(255, 255, 255, 0.15), transparent)",
          pointerEvents: "none"
        }}
      />

      {isSubmitting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.85)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            gap: "20px"
          }}
        >
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.2, 1]
            }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: "easeInOut"
            }}
            style={{
              width: "60px",
              height: "60px",
              border: `4px solid ${COLORS[12]}`,
              borderTop: "4px solid transparent",
              borderRadius: "50%"
            }}
          />
          <Text style={{ color: "#fff", fontSize: "16px" }}>Verifying...</Text>
        </motion.div>
      )}

      <Card
        style={{
          width: 450,
          maxWidth: "95%",
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "20px",
          boxShadow:
            "0 12px 40px rgba(0, 0, 0, 0.2), 0 0 20px rgba(255, 255, 255, 0.1)",
          border: "none",
          padding: "20px",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: "20px",
            border: "2px solid transparent",
            background: `linear-gradient(45deg, ${COLORS[12]}, ${COLORS[10]})`,
            zIndex: -1
          }}
        />

        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${COLORS[12]} 0%, ${COLORS[10]} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 6px 20px rgba(0, 0, 0, 0.3)"
            }}
          >
            <KeyOutlined style={{ fontSize: 36, color: "#fff" }} />
          </motion.div>

          <Title
            level={3}
            style={{
              color: COLORS[9],
              margin: 0,
              fontSize: 28,
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 700,
              letterSpacing: "0.5px"
            }}
          >
            Two-Factor Authentication
          </Title>
          <Text
            style={{
              display: "block",
              marginTop: 10,
              color: "#666",
              fontSize: 16,
              fontFamily: "'Inter', sans-serif"
            }}
          >
            Please enter the verification code from your authenticator app
          </Text>
        </div>

        <Form layout="vertical" onFinish={handleTotpSubmit}>
          <Form.Item>
            <CustomVerificationCodeInput
              value={totpCode}
              onChange={setTotpCode}
              disabled={isAccountLocked}
            />
          </Form.Item>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                color: "#ff4d4f",
                marginBottom: 16,
                textAlign: "center",
                padding: "12px 15px",
                background: "linear-gradient(90deg, #fff2f0, #ffe6e6)",
                borderRadius: "10px",
                border: "1px solid #ffccc7",
                boxShadow: "0 4px 10px rgba(255, 77, 79, 0.1)",
                fontFamily: "'Inter', sans-serif"
              }}
            >
              {error}
            </motion.div>
          )}

          {remainingAttempts !== null &&
            !error?.includes(`${remainingAttempts} attempt`) &&
            !isAccountLocked && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  color: "#fa8c16",
                  marginBottom: 16,
                  textAlign: "center",
                  padding: "12px 15px",
                  background: "linear-gradient(90deg, #fffbe6, #fff1b8)",
                  borderRadius: "10px",
                  border: "1px solid #ffe58f",
                  boxShadow: "0 4px 10px rgba(250, 140, 22, 0.1)",
                  fontFamily: "'Inter', sans-serif"
                }}
              >
                You have {remainingAttempts} attempt
                {remainingAttempts === 1 ? "" : "s"} remaining before your
                account is locked.
              </motion.div>
            )}

          {isAccountLocked && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: 16,
                textAlign: "center",
                padding: "20px",
                background: "linear-gradient(90deg, #fff2f0, #ffe6e6)",
                borderRadius: "12px",
                border: "1px solid #ffccc7",
                boxShadow: "0 4px 10px rgba(255, 77, 79, 0.1)"
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: "#ff4d4f",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 15px",
                  boxShadow: "0 4px 10px rgba(255, 77, 79, 0.2)"
                }}
              >
                <LockOutlined style={{ fontSize: 24, color: "#fff" }} />
              </div>
              <Title
                level={4}
                style={{
                  color: "#ff4d4f",
                  margin: "0 0 10px",
                  fontFamily: "'Poppins', sans-serif"
                }}
              >
                Account Locked
              </Title>
              <Text
                style={{
                  color: "#666",
                  display: "block",
                  marginBottom: 10,
                  fontFamily: "'Inter', sans-serif"
                }}
              >
                Your account has been locked due to multiple failed attempts.
              </Text>
              <Text
                strong
                style={{
                  color: "#666",
                  display: "block",
                  marginBottom: 5,
                  fontFamily: "'Inter', sans-serif"
                }}
              >
                Contact the administrator:
              </Text>
              <a
                href="mailto:tuphung0107@gmail.com"
                style={{ color: COLORS[8], fontWeight: 600, fontSize: 16 }}
              >
                tuphung0107@gmail.com
              </a>

              {isAdminMode && (
                <Button
                  type="primary"
                  danger
                  style={{
                    marginTop: 15,
                    borderRadius: "8px",
                    height: "40px",
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    background: "linear-gradient(45deg, #ff4d4f, #ff7875)",
                    border: "none",
                    boxShadow: "0 4px 10px rgba(255, 77, 79, 0.3)"
                  }}
                  onClick={handleAdminUnlock}
                >
                  Unlock Account
                </Button>
              )}
            </motion.div>
          )}

          <Form.Item style={{ marginBottom: 10, marginTop: 24 }}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  width: "100%",
                  height: "50px",
                  borderRadius: "12px",
                  fontSize: "17px",
                  fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                  marginBottom: 16,
                  background: isAccountLocked
                    ? "#d9d9d9"
                    : `linear-gradient(45deg, ${COLORS[12]}, ${COLORS[10]})`,
                  border: "none",
                  boxShadow: "0 6px 15px rgba(0, 0, 0, 0.2)",
                  transition: "all 0.3s ease"
                }}
                disabled={isAccountLocked || !totpCode || totpCode.length !== 6}
              >
                Verify Code
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={onBack}
                style={{
                  width: "100%",
                  height: "50px",
                  borderRadius: "12px",
                  fontSize: "17px",
                  fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                  border: `2px solid ${COLORS[12]}`,
                  color: COLORS[5],
                  background: "transparent",
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                  transition: "all 0.3s ease"
                }}
              >
                Back to Login
              </Button>
            </motion.div>
          </Form.Item>
        </Form>

        <div
          style={{
            textAlign: "center",
            marginTop: 20,
            borderTop: "1px solid #f0f0f0",
            paddingTop: 20
          }}
        >
          <Button
            type="link"
            size="small"
            onClick={enableAdminMode}
            style={{
              fontSize: "14px",
              color: isAdminMode ? COLORS[12] : "#d9d9d9",
              fontFamily: "'Inter', sans-serif",
              transition: "all 0.3s ease"
            }}
          >
            {isAdminMode ? "Admin Mode Enabled" : "Admin"}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default TotpAuthComponent;
