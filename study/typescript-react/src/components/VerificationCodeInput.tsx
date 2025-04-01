import React, { useState, useEffect, useRef } from "react";
import { Form, Button, Typography } from "antd";
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  SyncOutlined
} from "@ant-design/icons";
import "../styles/VerificationCodeInput.css"; // Your premium CSS file

const { Text } = Typography;

interface VerificationCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onResendCode?: () => Promise<void | boolean>;
  resendCooldown?: number;
  isSubmitting?: boolean;
  isError?: boolean;
  autoFocus?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
  onFocus?: () => void;
}

const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  value = "",
  onChange,
  onResendCode,
  resendCooldown = 60,
  isSubmitting = false,
  isError = false,
  autoFocus = false,
  inputRef,
  onFocus
}) => {
  // Split the value into an array of digits, padding with empty strings if needed
  const valueArray = value.split("").concat(Array(6 - value.length).fill(""));

  // Track if we've done the initial focus (to prevent constant re-focusing)
  const hasInitialFocused = useRef<boolean>(false);

  // Create refs for each input
  const inputRefs = React.useMemo(() => {
    return Array(6)
      .fill(0)
      .map((_, i) =>
        i === 0 && inputRef ? inputRef : React.createRef<HTMLInputElement>()
      );
  }, [inputRef]);

  // Timer state for resend functionality
  const [countdown, setCountdown] = useState(resendCooldown);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Format seconds to mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Handle countdown for resend functionality
  useEffect(() => {
    if (!onResendCode) return;

    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      setCanResend(false);
    } else {
      setCanResend(true);
    }

    return () => clearTimeout(timer);
  }, [countdown, onResendCode]);

  // Handle initial focus only once
  useEffect(() => {
    if (autoFocus && !hasInitialFocused.current) {
      const focusTimer = setTimeout(() => {
        if (inputRefs[0]?.current) {
          inputRefs[0].current.focus();
          hasInitialFocused.current = true;
          if (onFocus) onFocus();
        }
      }, 200); // Delay focus to ensure component is fully rendered

      return () => clearTimeout(focusTimer);
    }
  }, [autoFocus, inputRefs, onFocus]);

  // Reset the focus state when component unmounts or autoFocus changes to false
  useEffect(() => {
    if (!autoFocus) {
      hasInitialFocused.current = false;
    }

    return () => {
      hasInitialFocused.current = false;
    };
  }, [autoFocus]);

  // Handle resend click
  const handleResend = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!canResend || isResending || !onResendCode) return;

    setIsResending(true);
    try {
      await onResendCode();
      setCountdown(resendCooldown);
      setCanResend(false);
    } catch (error) {
      console.error("Failed to resend code:", error);
    } finally {
      setIsResending(false);
    }
  };

  // Handle input change
  const handleChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    e.stopPropagation();
    const digit = e.target.value;

    // Only allow numbers
    if (!/^\d*$/.test(digit)) return;

    // Take only the last character if multiple are pasted
    const singleDigit = digit.slice(-1);

    // Create a new array with the updated digit
    const newValueArray = [...valueArray];
    newValueArray[index] = singleDigit;

    // Call the onChange prop with the new combined value
    onChange(newValueArray.join(""));

    // Auto-advance to next input if a digit was entered
    if (singleDigit && index < 5 && inputRefs[index + 1]?.current) {
      inputRefs[index + 1].current?.focus();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Tab") {
      // Let Tab work normally for accessibility
      return;
    }

    e.stopPropagation();

    if (
      e.key === "Backspace" &&
      !valueArray[index] &&
      index > 0 &&
      inputRefs[index - 1]?.current
    ) {
      // Move to previous input on backspace if current is empty
      inputRefs[index - 1].current?.focus();
    } else if (
      e.key === "ArrowLeft" &&
      index > 0 &&
      inputRefs[index - 1]?.current
    ) {
      // Move to previous input on left arrow
      inputRefs[index - 1].current?.focus();
    } else if (
      e.key === "ArrowRight" &&
      index < 5 &&
      inputRefs[index + 1]?.current
    ) {
      // Move to next input on right arrow
      inputRefs[index + 1].current?.focus();
    }
  };

  // Handle paste event
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const pastedData = e.clipboardData.getData("text/plain").trim();

    if (/^\d+$/.test(pastedData)) {
      // Take only up to 6 digits
      const digits = pastedData.slice(0, 6);
      onChange(digits);

      // Focus the appropriate input based on paste length
      const focusIndex = Math.min(5, digits.length);
      if (inputRefs[focusIndex]?.current) {
        inputRefs[focusIndex].current?.focus();
      }
    }
  };

  // Handle clicks on the input wrapper to focus the input
  const handleWrapperClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (inputRefs[index]?.current && !isSubmitting) {
      inputRefs[index].current?.focus();
      if (onFocus) onFocus();
    }
  };

  // Check if all digits are filled
  const isComplete = valueArray.every((digit) => digit !== "");

  // Add classes for success animation
  useEffect(() => {
    if (isComplete && !isError) {
      const timer = setTimeout(() => {
        const container = document.querySelector(
          ".verification-code-container"
        );
        if (container) {
          container.classList.add("complete");
        }
      }, 100);

      return () => clearTimeout(timer);
    } else {
      const container = document.querySelector(".verification-code-container");
      if (container) {
        container.classList.remove("complete");
      }
    }
  }, [isComplete, isError]);

  // Add error class
  useEffect(() => {
    const container = document.querySelector(".verification-code-container");
    if (container) {
      if (isError) {
        container.classList.add("error");
        container.classList.remove("all-filled", "complete");
      } else {
        container.classList.remove("error");
      }
    }
  }, [isError]);

  return (
    <Form.Item
      label={onResendCode ? "Verification Code" : "Authenticator Code"}
      extra={
        <div className="verification-extra">
          <Text type="secondary">
            {onResendCode
              ? "Enter the 6-digit code sent to your email address"
              : "Enter the 6-digit code from your authenticator app"}
          </Text>
          {onResendCode && (
            <div className="resend-container">
              {canResend ? (
                <Button
                  type="link"
                  size="small"
                  onClick={handleResend}
                  disabled={isResending}
                  className="resend-button"
                  icon={isResending ? <SyncOutlined spin /> : null}
                >
                  {isResending ? "Sending..." : "Resend code"}
                </Button>
              ) : (
                <Text type="secondary" className="countdown">
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  Resend available in {formatTime(countdown)}
                </Text>
              )}
            </div>
          )}
        </div>
      }
    >
      <div
        className={`verification-code-container ${
          isComplete && !isError ? "all-filled" : ""
        } ${isSubmitting ? "submitting" : ""}`}
      >
        {valueArray.map((digit, index) => (
          <div
            className="code-input-wrapper"
            key={index}
            onClick={(e) => handleWrapperClick(index, e)}
            style={{ cursor: isSubmitting ? "not-allowed" : "text" }}
          >
            <input
              ref={inputRefs[index]}
              className="code-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              onFocus={(e) => {
                e.stopPropagation();
                if (onFocus) onFocus();
              }}
              aria-label={`Digit ${index + 1} of verification code`}
              disabled={isSubmitting}
              data-index={index}
            />
            <div className="input-border"></div>
            {isComplete && !isError && (
              <div className="success-indicator"></div>
            )}
          </div>
        ))}

        {isComplete && !isError && !isSubmitting && (
          <CheckCircleFilled className="completion-icon" />
        )}
      </div>
    </Form.Item>
  );
};

export default VerificationCodeInput;
