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
  Divider,
} from "antd";
import {
  authenticateUserWithCookies,
  registerUser,
} from "../services/authService";
import { useApi } from "../hooks/useApi";
import { useFieldErrors } from "../hooks/useFieldErrors";
import { ServiceError } from "../services/baseService";
import { LockOutlined, UserOutlined, MailOutlined } from "@ant-design/icons";
import validateInput from "../utils/validateInput";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { setAuthData } from "../store/authSlice";
import { resetAllData } from "../store/resetActions";
import { ValidationInput, AuthState, ValidationErrors } from "../type/types";
import { setupTokenRefresh } from "../utils/tokenRefresh";
import "../styles/AuthPage.css";
import { FcGoogle } from "react-icons/fc";

const { Title, Text } = Typography;

const AuthPage: React.FC = () => {
  // State to control which mode is active (login or register)
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

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
    dob: dayjs("1999-09-09", "YYYY-MM-DD"),
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
    clearAllFieldErrors(); // Clear all field errors when toggling mode
  };

  // Handle login form submission
  const handleLogin = async (values: {
    username: string;
    password: string;
  }) => {
    setLoginError(null);
    clearAllFieldErrors();
    setIsLoading(true);

    try {
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
            loginSocial: false,
          })
        );

        // Set up token refresh
        setupTokenRefresh(data.result.token);

        // Success notification is now likely handled by interceptors,
        // but we can keep it here for certainty
        notification.success({
          message: "Success",
          description: "Logged in successfully!",
        });

        // Redirect to home page
        navigate("/");
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error: unknown) {
      // Hiển thị thông báo lỗi chung chung trong form
      setLoginError("Invalid username or password. Please try again.");

      // Ghi log lỗi chi tiết cho dev
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration - Updated to only show one notification
  const handleRegister = async () => {
    clearAllFieldErrors();

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
        description: "Please check your email to verify your account.",
      });
      navigate("/verify-email", {
        state: { username: registerValues.username },
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
              error.message || "Please check your information and try again.",
          });
        }
      } else if (!(error as { isHandled?: boolean })?.isHandled) {
        notification.error({
          message: "Registration Failed",
          description: "An unexpected error occurred. Please try again.",
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
    value: string | moment.Moment | null
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
    clearFieldError,
  ]);

  // Validate a single field - Updated to use field errors hook
  const validateField = (
    name: string,
    value: string | moment.Moment | null
  ) => {
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

  return (
    <div className="auth-container">
      <div
        className={`auth-card ${isLoginMode ? "login-mode" : "register-mode"}`}
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
                    { required: true, message: "Please input your username!" },
                    {
                      validator: (_, value) => {
                        const errors = validateInput({ username: value });
                        return errors.username
                          ? Promise.reject(errors.username)
                          : Promise.resolve();
                      },
                    },
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
                      },
                    },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="Email"
                    value={registerValues.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </Form.Item>
                <Form.Item
                  validateStatus={fieldErrors.password ? "error" : ""}
                  help={fieldErrors.password}
                  rules={[
                    { required: true, message: "Please input your password!" },
                    {
                      validator: (_, value) => {
                        const errors = validateInput({ password: value });
                        return errors.password
                          ? Promise.reject(errors.password)
                          : Promise.resolve();
                      },
                    },
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
                      message: "Please confirm your password!",
                    },
                    {
                      validator: (_, value) => {
                        if (!value || registerValues.password === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject("Passwords do not match!");
                      },
                    },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
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
                      message: "Please input your first name!",
                    },
                    {
                      validator: (_, value) => {
                        const errors = validateInput({ firstname: value });
                        return errors.firstname
                          ? Promise.reject(errors.firstname)
                          : Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input
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
                    { required: true, message: "Please input your last name!" },
                    {
                      validator: (_, value) => {
                        const errors = validateInput({ lastname: value });
                        return errors.lastname
                          ? Promise.reject(errors.lastname)
                          : Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input
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
                      message: "Please select your date of birth!",
                    },
                    {
                      validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        const dobString = value.format("YYYY-MM-DD");
                        const errors = validateInput({ dob: dobString });
                        return errors.dob
                          ? Promise.reject(errors.dob)
                          : Promise.resolve();
                      },
                    },
                  ]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    placeholder="Date of Birth"
                    value={registerValues.dob}
                    onChange={(date) => {
                      if (date) {
                        setRegisterValues((prev) => ({
                          ...prev,
                          dob: date,
                        }));
                        validateField("dob", date);
                      }
                    }}
                    format="YYYY-MM-DD"
                    allowClear={false}
                  />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    className="auth-button"
                    loading={registerLoading}
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
                    { required: true, message: "Please input your username!" },
                    {
                      validator: (_, value) => {
                        const errors = validateInput({ username: value });
                        return errors.username
                          ? Promise.reject(errors.username)
                          : Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Username" />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: "Please input your password!" },
                    {
                      validator: (_, value) => {
                        const errors = validateInput({ password: value });
                        return errors.password
                          ? Promise.reject(errors.password)
                          : Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Password"
                  />
                </Form.Item>

                {loginError && (
                  <div className="error-message">{loginError}</div>
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
  );
};

export default AuthPage;

