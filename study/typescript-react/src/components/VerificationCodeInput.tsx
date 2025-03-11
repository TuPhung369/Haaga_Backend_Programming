import React, { useState, useEffect } from "react";
import { Form, Button, Typography } from "antd";
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import "../styles/VerificationCodeInput.css";

const { Text } = Typography;

interface VerificationCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onResendCode?: () => Promise<void | boolean>;
  resendCooldown?: number; // Cooldown in seconds
  isSubmitting?: boolean;
  isError?: boolean;
  autoFocus?: boolean;
}

const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  value = "",
  onChange,
  onResendCode,
  resendCooldown = 60,
  isSubmitting = false,
  isError = false,
  autoFocus = false,
}) => {
  // Create an array from the current value, padding with empty strings if needed
  const valueArray = value.split("").concat(Array(6 - value.length).fill(""));

  // Create refs array with useMemo to avoid re-creation on each render
  const inputRefs = React.useMemo(() => {
    return Array(6)
      .fill(0)
      .map(() => React.createRef<HTMLInputElement>());
  }, []);

  // Timer state - only used when onResendCode is provided
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

  // Handle countdown - only run this effect if onResendCode is provided
  useEffect(() => {
    if (!onResendCode) return; // Skip for TOTP authentication

    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      setCanResend(false);
    } else {
      setCanResend(true);
    }

    return () => clearTimeout(timer);
  }, [countdown, onResendCode]);

  // Focus first input on mount if autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRefs[0]?.current) {
      inputRefs[0].current.focus();
    }
  }, [autoFocus, inputRefs]);

  // Handle resend click
  const handleResend = async () => {
    if (!canResend || isResending || !onResendCode) return;

    setIsResending(true);
    try {
      await onResendCode();
      // Reset countdown
      setCountdown(resendCooldown);
      setCanResend(false);
    } catch (error) {
      console.error("Failed to resend code:", error);
    } finally {
      setIsResending(false);
    }
  };

  // Handle input change for a specific position
  const handleChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const digit = e.target.value;

    // Only allow numbers
    if (!/^\d*$/.test(digit)) return;

    // Take only the last character if multiple are pasted
    const singleDigit = digit.slice(-1);

    // Create a new array with the updated digit
    const newValueArray = [...valueArray];
    newValueArray[index] = singleDigit;

    // Call the onChange prop with the new combined value
    const newValue = newValueArray.join("");
    onChange(newValue);

    // Auto-advance to next input if a digit was entered and not deleting
    if (singleDigit && index < 5 && inputRefs[index + 1]?.current) {
      inputRefs[index + 1].current?.focus();
    }
  };

  // Handle keyboard navigation and backspace
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
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

  // Handle paste event (allows pasting the entire code)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();

    // Check if pasted data is numeric and of appropriate length
    if (/^\d+$/.test(pastedData)) {
      // Take only up to 6 digits
      const digits = pastedData.slice(0, 6);

      // Update value through onChange
      onChange(digits);

      // Focus the appropriate input based on paste length
      const focusIndex = Math.min(5, digits.length);
      if (inputRefs[focusIndex]?.current) {
        inputRefs[focusIndex].current?.focus();
      }
    }
  };

  // Check if all digits are filled
  const isComplete = valueArray.every((digit) => digit !== "");

  // Effect to add animation when code is complete
  useEffect(() => {
    if (isComplete && !isError) {
      // Add success animation class after a small delay
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
      // Remove success animation class
      const container = document.querySelector(".verification-code-container");
      if (container) {
        container.classList.remove("complete");
      }
    }
  }, [isComplete, isError]);

  // Add error class when there's an error
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
          <div className="code-input-wrapper" key={index}>
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
              aria-label={`Digit ${index + 1} of verification code`}
              disabled={isSubmitting}
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

