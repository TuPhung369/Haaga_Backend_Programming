// src/pages/AuthPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Typography,
  DatePicker,
  notification,
  Divider
} from "antd";
import {
  authenticateUserWithCookies,
  registerUser,
  initiateAuthentication
} from "../services/authService";
import { useApi } from "../hooks/useApi";
import { useFieldErrors } from "../hooks/useFieldErrors";
import { ServiceError } from "../services/baseService";
import {
  LockOutlined,
  KeyOutlined,
  UserOutlined,
  MailOutlined,
  IdcardOutlined,
  CalendarOutlined,
  ContactsOutlined
} from "@ant-design/icons";
import validateInput from "../utils/validateInput";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { setAuthData } from "../store/authSlice";
import { resetAllData } from "../store/resetActions";
import { ValidationInput, AuthState, ValidationErrors } from "../type/types";
import { setupTokenRefresh } from "../utils/tokenRefresh";
import "../styles/AuthPage.css";
import { FcGoogle } from "react-icons/fc";
import LoadingState from "../components/LoadingState";
import TotpAuthComponent from "../components/TotpAuthComponent";
import EmailOtpAuthComponent from "../components/EmailOtpAuthComponent";
import { COLORS } from "../utils/constant";
import ReCaptchaV3 from "../components/ReCaptchaV3";
import { SparklesCore } from "../components/SparklesCore";

// Define error response interface based on your API structure
interface ErrorResponseData {
  message?: string;
  errorCode?: string;
  data?: {
    message?: string;
    errorCode?: string;
  };
}

// Define HTTP error interface
interface HttpErrorResponse {
  response?: {
    data?: ErrorResponseData;
    status?: number;
  };
}

const { Title, Text } = Typography;

const AuthPage: React.FC = () => {
  // State to control which mode is active (login or register)
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Added for TOTP
  const [showTotpAuth, setShowTotpAuth] = useState<boolean>(false);
  // Added for Email OTP
  const [showEmailOtpAuth, setShowEmailOtpAuth] = useState<boolean>(false);
  const [totpUsername, setTotpUsername] = useState<string>("");
  const [totpPassword, setTotpPassword] = useState<string>("");
  const [isAccountLocked, setIsAccountLocked] = useState<boolean>(false);

  // Use our new field errors hook instead of manual error handling
  const { fieldErrors, setFieldError, clearFieldError, clearAllFieldErrors } =
    useFieldErrors();

  // Form data for registration
  const [registerValues, setRegisterValues] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstname: "",
    lastname: "",
    dob: dayjs("1999-09-09", "YYYY-MM-DD")
  });

  // Use the API hook for registration
  const { execute: executeRegister, loading: registerLoading } =
    useApi(registerUser);

  // Redux hooks
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector(
    (state: { auth: AuthState }) => state.auth
  );

  // OAuth settings
  const oauth2ClientId = import.meta.env.VITE_OAUTH2_CLIENT_ID;
  const oauth2RedirectUri = import.meta.env.VITE_OAUTH2_REDIRECT_URI;

  // Add new state variables for reCAPTCHA
  const [recaptchaV3Token, setRecaptchaV3Token] = useState<string>("");

  // Get reCAPTCHA site keys from environment
  const recaptchaSiteKeyV3 = import.meta.env.VITE_RECAPTCHA_SITE_KEY_V3;

  // Check if we're in development mode
  const isDevelopment = import.meta.env.MODE === "development";
  // Check if we're using test key
  const isUsingTestKey =
    recaptchaSiteKeyV3 === "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      setTimeout(() => navigate("/"), 100);
    }
  }, [navigate, isAuthenticated, token]);

  // Toggle between login and register modes
  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setLoginError(null);
    setIsAccountLocked(false); // Reset account locked state when switching modes
    clearAllFieldErrors(); // Clear all field errors when toggling mode
  };

  // Handle login form submission
  const handleLogin = async (values: {
    username: string;
    password: string;
  }) => {
    setLoginError(null);
    setIsAccountLocked(false); // Reset account locked state
    clearAllFieldErrors();
    setIsLoading(true);

    try {
      // First, initiate authentication to check if TOTP or Email OTP is required
      const authInitResponse = await initiateAuthentication(
        values.username,
        values.password
      );

      // Store credentials for potential TOTP/Email OTP verification
      setTotpUsername(values.username);
      setTotpPassword(values.password);

      if (authInitResponse.requiresTotp) {
        // Show TOTP authentication screen
        setShowTotpAuth(true);
      } else if (authInitResponse.requiresEmailOtp) {
        // Show Email OTP authentication screen
        setShowEmailOtpAuth(true);
      } else {
        // Direct authentication, fall back to the original method
        const data = await authenticateUserWithCookies(
          values.username,
          values.password
        );

        if (data && data.result && data.result.token) {
          // First clear any existing data
          dispatch(resetAllData());

          // Then set the new auth data
          dispatch(
            setAuthData({
              token: data.result.token,
              isAuthenticated: true,
              loginSocial: false
            })
          );

          // Set up token refresh
          setupTokenRefresh(data.result.token);

          notification.success({
            message: "Success",
            description: "Logged in successfully!"
          });

          // Redirect to home page
          navigate("/");
        } else {
          throw new Error("Invalid response format from server");
        }
      }
    } catch (error: unknown) {
      console.error("Login error:", error);

      // Check for account locked error
      // Handle different error formats
      let errorMessage = "Authentication failed";
      let errorCode = "";

      if (error instanceof Error) {
        errorMessage = error.message;

        // Try to extract error code
        if (error instanceof ServiceError && error.errorCode) {
          errorCode = error.errorCode || "";
        } else if (
          typeof error === "object" &&
          error !== null &&
          "response" in error &&
          error.response &&
          typeof error.response === "object" &&
          "data" in error.response &&
          error.response.data &&
          typeof error.response.data === "object" &&
          "errorCode" in error.response.data
        ) {
          const httpError = error as HttpErrorResponse;
          errorCode = httpError.response?.data?.errorCode || "";
        } else if (
          error instanceof ServiceError &&
          error.originalError &&
          typeof error.originalError === "object" &&
          error.originalError !== null
        ) {
          try {
            const originalError = error.originalError as HttpErrorResponse;
            if (
              originalError.response?.data?.errorCode &&
              typeof originalError.response.data.errorCode === "string"
            ) {
              errorCode = originalError.response.data.errorCode;
            }
          } catch (e) {
            console.error("Error extracting errorCode from originalError", e);
          }
        }
      }

      // Log detailed error info for debugging
      console.log("Error message:", errorMessage);
      console.log("Error code:", errorCode);

      // Check if account is locked
      const isLocked =
        errorCode === "ACCOUNT_LOCKED" ||
        errorMessage.includes("locked") ||
        errorMessage.includes("blocked");

      // Additional check for locked/blocked message in response
      let responseHasLockedMessage = false;
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "message" in error.response.data &&
        typeof error.response.data.message === "string"
      ) {
        responseHasLockedMessage =
          error.response.data.message.includes("locked") ||
          error.response.data.message.includes("blocked");
      }

      if (isLocked || responseHasLockedMessage) {
        setIsAccountLocked(true);
        setLoginError(
          "Your account has been locked due to too many failed attempts. Please contact the administrator for assistance."
        );

        notification.error({
          message: "Account Locked",
          description:
            "Your account has been locked due to too many failed attempts. Please contact the administrator for assistance."
        });
      } else {
        // Display a generic error for login failures
        setLoginError("Invalid username or password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration - Updated to only use reCAPTCHA V3
  const handleRegister = async () => {
    clearAllFieldErrors();

    // Use existing environment flags instead of creating a new one
    if (isDevelopment || isUsingTestKey) {
      // In development mode, log extra info about the token
      console.log("Registration in development mode with token details:", {
        tokenLength: recaptchaV3Token?.length || 0,
        tokenPrefix: recaptchaV3Token?.substring(0, 10) + "...",
        isDevelopment,
        isUsingTestKey
      });
    } else {
      // In production, ensure we have a real V3 token
      if (!recaptchaV3Token) {
        notification.error({
          message: "Verification Required",
          description: "Please wait for reCAPTCHA verification to complete."
        });
        return;
      }
    }

    const userData: ValidationInput = {
      username: registerValues.username,
      password: registerValues.password,
      firstname: registerValues.firstname,
      lastname: registerValues.lastname,
      dob: registerValues.dob
        ? registerValues.dob.format("YYYY-MM-DD")
        : undefined,
      email: registerValues.email,
      roles: ["USER"],
      recaptchaToken: recaptchaV3Token
    };

    if (registerValues.password !== registerValues.confirmPassword) {
      setFieldError("confirmPassword", "Passwords do not match");
      return;
    }

    const validationErrors = validateInput(userData);
    if (Object.keys(validationErrors).length > 0) {
      (Object.keys(validationErrors) as Array<keyof ValidationErrors>).forEach(
        (key) => {
          if (validationErrors[key]) {
            setFieldError(key, validationErrors[key] as string);
          }
        }
      );
      return;
    }

    const { success, error } = await executeRegister(userData);

    if (success) {
      notification.success({
        message: "Registration Successful",
        description: "Please check your email to verify your account."
      });
      navigate("/verify-email", {
        state: { username: registerValues.username }
      });
    } else if (error) {
      console.log("Register error:", error); // Debugging

      if (error instanceof ServiceError) {
        if (error.field) {
          setFieldError(error.field, error.message || "Invalid input");
        }
        if (!error.isHandled) {
          notification.error({
            message: "Registration Failed",
            description:
              error.message || "Please check your information and try again."
          });
        }
      } else if (!(error as { isHandled?: boolean })?.isHandled) {
        notification.error({
          message: "Registration Failed",
          description: "An unexpected error occurred. Please try again."
        });
        console.error("Unknown registration error:", error);
      }
    }
  };

  // Handle Google OAuth
  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    const scope = "openid email profile";
    const responseType = "code";
    const authorizationUri = `https://accounts.google.com/o/oauth2/auth?response_type=${responseType}&client_id=${oauth2ClientId}&redirect_uri=${oauth2RedirectUri}&scope=${scope}`;
    window.location.href = authorizationUri;
  };

  // Handle input changes for registration form - Updated to use field errors hook
  const handleInputChange = (
    name: string,
    value: string | dayjs.Dayjs | null
  ) => {
    setRegisterValues((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
    // Clear error for this field
    clearFieldError(name);
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  // Validate password confirmation - Updated to use field errors hook
  const validatePasswordConfirmation = useCallback(() => {
    if (registerValues.password !== registerValues.confirmPassword) {
      setFieldError("confirmPassword", "Passwords do not match");
    } else {
      clearFieldError("confirmPassword");
    }
  }, [
    registerValues.password,
    registerValues.confirmPassword,
    setFieldError,
    clearFieldError
  ]);

  // Validate a single field - Updated to use field errors hook
  const validateField = (name: string, value: string | dayjs.Dayjs | null) => {
    // Create an object with just the field being validated
    const fieldToValidate: Partial<ValidationInput> = { [name]: value };

    // Special handling for date of birth
    if (name === "dob" && dayjs.isDayjs(value)) {
      fieldToValidate[name] = value.format("YYYY-MM-DD");
    }

    // Get validation errors for this field
    const fieldErrors = validateInput(fieldToValidate);

    // Update errors state
    if (fieldErrors[name]) {
      setFieldError(name, fieldErrors[name] as string);
    } else {
      clearFieldError(name);
    }
  };

  useEffect(() => {
    if (registerValues.confirmPassword) {
      validatePasswordConfirmation();
    }
  }, [registerValues.confirmPassword, validatePasswordConfirmation]);

  // If showing TOTP authentication, render TotpAuthComponent
  if (showTotpAuth) {
    return (
      <TotpAuthComponent
        username={totpUsername}
        password={totpPassword}
        onBack={() => {
          setShowTotpAuth(false);
          setTotpUsername("");
          setTotpPassword("");
        }}
        onAuthenticated={() => {
          setShowTotpAuth(false);
          setTotpUsername("");
          setTotpPassword("");
        }}
      />
    );
  }

  // If showing Email OTP authentication, render EmailOtpAuthComponent
  if (showEmailOtpAuth) {
    return (
      <EmailOtpAuthComponent
        username={totpUsername}
        password={totpPassword}
        onBack={() => {
          setShowEmailOtpAuth(false);
          setTotpUsername("");
          setTotpPassword("");
        }}
        onAuthenticated={() => {
          setShowEmailOtpAuth(false);
          setTotpUsername("");
          setTotpPassword("");
        }}
      />
    );
  }

  // Simplified renderCaptcha method - only ReCaptchaV3
  const renderCaptcha = () => {
    return (
      <>
        {/* Invisible v3 reCAPTCHA */}
        <ReCaptchaV3
          sitekey={recaptchaSiteKeyV3}
          action="register"
          onVerify={(token) => setRecaptchaV3Token(token)}
        />
      </>
    );
  };

  return (
    <>
      {/* Fullscreen loading states */}
      {isLoading && <LoadingState tip="Signing you in..." fullscreen={true} />}

      {registerLoading && (
        <LoadingState tip="Creating your account..." fullscreen={true} />
      )}

      {googleLoading && (
        <LoadingState tip="Connecting to Google..." fullscreen={true} />
      )}

      <div className="auth-container">
        <div
          className="sparkles-container"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 0
          }}
        >
          <SparklesCore
            id="auth-sparkles"
            background="transparent"
            minSize={0.6}
            maxSize={2}
            particleDensity={150}
            className="w-full h-full"
            particleColor="#00e5ff"
            speed={0.8}
          />
        </div>

        <div
          className={`auth-card ${
            isLoginMode ? "login-mode" : "register-mode"
          }`}
        >
          {/* Left panel */}
          <div className="panel left-panel">
            <div className="panel-content">
              {isLoginMode ? (
                <>
                  <Title level={2} className="welcome-title">
                    Hello, Welcome!
                  </Title>
                  <Text className="panel-text">Don't have an account?</Text>
                  <Button className="panel-button" onClick={toggleMode}>
                    Register
                  </Button>
                </>
              ) : (
                <Form
                  layout="vertical"
                  className="auth-form register-form"
                  onFinish={handleRegister}
                >
                  <Title level={3} className="form-title">
                    Registration
                  </Title>
                  <Form.Item
                    validateStatus={fieldErrors.username ? "error" : ""}
                    help={fieldErrors.username}
                    rules={[
                      {
                        required: true,
                        message: "Please input your username!"
                      },
                      {
                        validator: (_, value) => {
                          const errors = validateInput({ username: value });
                          return errors.username
                            ? Promise.reject(errors.username)
                            : Promise.resolve();
                        }
                      }
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="Username"
                      value={registerValues.username}
                      onChange={(e) =>
                        handleInputChange("username", e.target.value)
                      }
                    />
                  </Form.Item>
                  <Form.Item
                    validateStatus={fieldErrors.email ? "error" : ""}
                    help={fieldErrors.email}
                    rules={[
                      { required: true, message: "Please input your email!" },
                      {
                        validator: (_, value) => {
                          const errors = validateInput({ email: value });
                          return errors.email
                            ? Promise.reject(errors.email)
                            : Promise.resolve();
                        }
                      }
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined />}
                      placeholder="Email"
                      value={registerValues.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                    />
                  </Form.Item>
                  <Form.Item
                    validateStatus={fieldErrors.password ? "error" : ""}
                    help={fieldErrors.password}
                    rules={[
                      {
                        required: true,
                        message: "Please input your password!"
                      },
                      {
                        validator: (_, value) => {
                          const errors = validateInput({ password: value });
                          return errors.password
                            ? Promise.reject(errors.password)
                            : Promise.resolve();
                        }
                      }
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="Password"
                      value={registerValues.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                    />
                  </Form.Item>

                  <Form.Item
                    validateStatus={fieldErrors.confirmPassword ? "error" : ""}
                    help={fieldErrors.confirmPassword}
                    rules={[
                      {
                        required: true,
                        message: "Please confirm your password!"
                      },
                      {
                        validator: (_, value) => {
                          if (!value || registerValues.password === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject("Passwords do not match!");
                        }
                      }
                    ]}
                  >
                    <Input.Password
                      prefix={<KeyOutlined />}
                      placeholder="Confirm Password"
                      value={registerValues.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                    />
                  </Form.Item>

                  <Form.Item
                    validateStatus={fieldErrors.firstname ? "error" : ""}
                    help={fieldErrors.firstname}
                    rules={[
                      {
                        required: true,
                        message: "Please input your first name!"
                      },
                      {
                        validator: (_, value) => {
                          const errors = validateInput({ firstname: value });
                          return errors.firstname
                            ? Promise.reject(errors.firstname)
                            : Promise.resolve();
                        }
                      }
                    ]}
                  >
                    <Input
                      prefix={<ContactsOutlined />}
                      placeholder="First Name"
                      value={registerValues.firstname}
                      onChange={(e) =>
                        handleInputChange("firstname", e.target.value)
                      }
                    />
                  </Form.Item>

                  <Form.Item
                    validateStatus={fieldErrors.lastname ? "error" : ""}
                    help={fieldErrors.lastname}
                    rules={[
                      {
                        required: true,
                        message: "Please input your last name!"
                      },
                      {
                        validator: (_, value) => {
                          const errors = validateInput({ lastname: value });
                          return errors.lastname
                            ? Promise.reject(errors.lastname)
                            : Promise.resolve();
                        }
                      }
                    ]}
                  >
                    <Input
                      prefix={<IdcardOutlined />}
                      placeholder="Last Name"
                      value={registerValues.lastname}
                      onChange={(e) =>
                        handleInputChange("lastname", e.target.value)
                      }
                    />
                  </Form.Item>

                  <Form.Item
                    validateStatus={fieldErrors.dob ? "error" : ""}
                    help={fieldErrors.dob}
                    rules={[
                      {
                        required: true,
                        message: "Please select your date of birth!"
                      },
                      {
                        validator: (_, value) => {
                          if (!value) return Promise.resolve();
                          const dobString = value.format("YYYY-MM-DD");
                          const errors = validateInput({ dob: dobString });
                          return errors.dob
                            ? Promise.reject(errors.dob)
                            : Promise.resolve();
                        }
                      }
                    ]}
                  >
                    <DatePicker
                      prefix={<CalendarOutlined />}
                      style={{ width: "100%" }}
                      placeholder="Date of Birth"
                      value={registerValues.dob}
                      onChange={(date) => {
                        if (date) {
                          setRegisterValues((prev) => ({
                            ...prev,
                            dob: date
                          }));
                          validateField("dob", date);
                        }
                      }}
                      format="YYYY-MM-DD"
                      allowClear={false}
                    />
                  </Form.Item>

                  {renderCaptcha()}

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      className="auth-button"
                      loading={registerLoading}
                      disabled={registerLoading}
                    >
                      Register
                    </Button>
                  </Form.Item>
                </Form>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="panel right-panel">
            <div className="panel-content">
              {isLoginMode ? (
                <Form
                  layout="vertical"
                  className="auth-form login-form"
                  onFinish={handleLogin}
                >
                  <Title level={3} className="form-title">
                    Login
                  </Title>

                  <Form.Item
                    name="username"
                    rules={[
                      {
                        required: true,
                        message: "Please input your username!"
                      },
                      {
                        validator: (_, value) => {
                          const errors = validateInput({ username: value });
                          return errors.username
                            ? Promise.reject(errors.username)
                            : Promise.resolve();
                        }
                      }
                    ]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Username" />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[
                      {
                        required: true,
                        message: "Please input your password!"
                      },
                      {
                        validator: (_, value) => {
                          const errors = validateInput({ password: value });
                          return errors.password
                            ? Promise.reject(errors.password)
                            : Promise.resolve();
                        }
                      }
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="Password"
                    />
                  </Form.Item>

                  {loginError && !isAccountLocked && (
                    <div className="error-message">{loginError}</div>
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
                        Account Locked
                      </p>
                      <p style={{ margin: "5px 0 0 0" }}>
                        Your account has been locked due to multiple failed
                        authentication attempts.
                      </p>
                      <p
                        style={{
                          margin: "5px 0 0 0",
                          fontWeight: "bold"
                        }}
                      >
                        Please contact the administrator for assistance.
                      </p>
                      <p
                        style={{
                          margin: "5px 0 0 0",
                          fontSize: "0.9em",
                          color: COLORS[3]
                        }}
                      >
                        Email: tuphung0107@gmail.com
                      </p>
                    </div>
                  )}

                  <Form.Item>
                    <div className="forgot-password">
                      <Button type="link" onClick={handleForgotPassword}>
                        Forgot Password?
                      </Button>
                    </div>
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      className="auth-button"
                      loading={isLoading}
                      disabled={isLoading || isAccountLocked}
                    >
                      Login
                    </Button>
                  </Form.Item>

                  <Divider plain>
                    <Text type="secondary">or</Text>
                  </Divider>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="google-login-button"
                    disabled={googleLoading}
                  >
                    <div className="google-icon-wrapper">
                      <FcGoogle size={24} />
                    </div>
                    <span className="google-button-text">
                      {googleLoading ? "Connecting..." : "Continue with Google"}
                    </span>
                  </button>
                </Form>
              ) : (
                <>
                  <Title level={2} className="welcome-title">
                    Welcome Back!
                  </Title>
                  <Text className="panel-text">Already have an account?</Text>
                  <Button className="panel-button" onClick={toggleMode}>
                    Login
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthPage;
