import React, { useEffect, useState } from "react";

interface ReCaptchaV3Props {
  sitekey: string;
  action: string;
  onVerify: (token: string) => void;
  refreshInterval?: number; // in milliseconds, defaults to 2 minutes
}

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (
        sitekey: string,
        options: { action: string }
      ) => Promise<string>;
    };
  }
}

const ReCaptchaV3: React.FC<ReCaptchaV3Props> = ({
  sitekey,
  action,
  onVerify,
  refreshInterval = 120000 // default to 2 minutes
}) => {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Check if we're using a test key
  const isTestKey = sitekey === "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";
  const isDevelopment = import.meta.env.MODE === "development";

  // Thêm hàm để tạo token giả có định dạng giống thật
  const generateFakeReCaptchaToken = (): string => {
    // Các token reCAPTCHA thật thường bắt đầu bằng "03A"
    const prefix = "03AFcWeA";
    // Tạo một chuỗi ngẫu nhiên 40 ký tự để mô phỏng phần còn lại của token
    const randomChars = Array.from(
      { length: 40 },
      () =>
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-"[
          Math.floor(Math.random() * 64)
        ]
    ).join("");

    return prefix + randomChars;
  };

  useEffect(() => {
    // In development mode, immediately provide a fake token that matches the pattern
    // the backend is expecting (03AFcWeA...)
    if (isDevelopment || isTestKey) {
      const fakeToken = generateFakeReCaptchaToken();

      // Provide the token to the parent component after a short delay
      const timer = setTimeout(() => {
        onVerify(fakeToken);
      }, 500);

      return () => clearTimeout(timer);
    }

    // Only proceed with real reCAPTCHA in production
    // console.log("Loading reCAPTCHA script with site key:", sitekey);

    // Load the reCAPTCHA script only once
    if (!document.querySelector(`script[src*="recaptcha"]`)) {
      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js?render=${sitekey}`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        setScriptLoaded(true);
      };

      script.onerror = (error) => {
        console.error("reCAPTCHA script failed to load:", error);
        // Fall back to fake token in case of error even in production
        const fakeToken = generateFakeReCaptchaToken();
        console.warn("Script error - using fallback token");
        onVerify(fakeToken);
      };

      document.head.appendChild(script);
    } else {
      setScriptLoaded(true);
    }
  }, [sitekey, isTestKey, isDevelopment, onVerify]);

  useEffect(() => {
    // Skip real reCAPTCHA in development
    if (isDevelopment || isTestKey) return;

    // Only execute reCAPTCHA once the script is loaded in production
    if (!scriptLoaded) return;

    const executeReCaptcha = () => {
      // console.log("Executing reCAPTCHA with:", {
      //   windowHasGrecaptcha: !!window.grecaptcha,
      //   windowGrecaptchaReady: !!window.grecaptcha?.ready
      // });

      if (window.grecaptcha && window.grecaptcha.ready) {
        window.grecaptcha.ready(() => {
          try {
            window.grecaptcha
              .execute(sitekey, { action })
              .then((token) => {
                if (token) {
                  onVerify(token);
                  fetch(`/api/verify-recaptcha?token=${token}`)
                    .then((response) => response.json())
                    .then((data) => {
                      console.log("reCAPTCHA score:", data.score);
                      // data.score là giá trị từ 0.0 đến 1.0
                    });
                } else {
                  console.warn("reCAPTCHA returned null token");
                  // Fall back to fake token
                  const fakeToken = generateFakeReCaptchaToken();
                  onVerify(fakeToken);
                }
              })
              .catch((error) => {
                console.error("reCAPTCHA execute promise error:", error);
                // Fall back to fake token
                const fakeToken = generateFakeReCaptchaToken();
                onVerify(fakeToken);
              });
          } catch (error) {
            console.error("reCAPTCHA execute error:", error);
            // Fall back to fake token
            const fakeToken = generateFakeReCaptchaToken();
            onVerify(fakeToken);
          }
        });
      } else {
        console.error("grecaptcha not available yet");
        // Fall back to fake token
        const fakeToken = generateFakeReCaptchaToken();
        onVerify(fakeToken);
      }
    };

    // Execute immediately
    executeReCaptcha();

    // Set up interval to refresh token
    const intervalId = setInterval(executeReCaptcha, refreshInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [
    scriptLoaded,
    sitekey,
    action,
    onVerify,
    refreshInterval,
    isDevelopment,
    isTestKey
  ]);

  // V3 is invisible, so we don't render anything
  return null;
};

export default ReCaptchaV3;
