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
import { LockOutlined, UserOutlined, MailOutlined } from "@ant-design/icons";
import validateInput from "../utils/validateInput";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { setAuthData } from "../store/authSlice";
import { resetAllData } from "../store/resetActions";
import {
  ValidationInput,
  AuthState,
  AuthError,
  ValidationErrors,
} from "../type/authType";
import { HandledError } from "../type/types";
import { setupTokenRefresh } from "../utils/tokenRefresh";
import "../styles/AuthPage.css";
import { FcGoogle } from "react-icons/fc";

const { Title, Text } = Typography;

const AuthPage: React.FC = () => {
  // State to control which mode is active (login or register)
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginError, setLoginError] = useState<string | null>(null);

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
  // Instead of isLoading for registration, use useApi
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
    setErrors({});
  };

  // Handle login form submission
  const handleLogin = async (values: {
    username: string;
    password: string;
  }) => {
    setLoginError(null);
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
      const authError = error as AuthError;
      setLoginError(authError.message || "Invalid username or password");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration
  const handleRegister = async () => {
    // Clear previous errors
    setErrors({});

    // Validate form data
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

    // Check password confirmation
    if (registerValues.password !== registerValues.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    // Validate all fields
    const validationErrors = validateInput(userData);
    if (Object.keys(validationErrors).length > 0) {
      // Convert ValidationErrors to Record<string, string>
      const errorRecord: Record<string, string> = {};
      (Object.keys(validationErrors) as Array<keyof ValidationErrors>).forEach(
        (key) => {
          if (validationErrors[key]) {
            errorRecord[key] = validationErrors[key] as string;
          }
        }
      );
      setErrors(errorRecord);
      return;
    }

    // Execute the API call using the hook
    const { success, error } = await executeRegister(userData);

    if (success) {
      // Navigation after success
      navigate("/verify-email", {
        state: {
          username: registerValues.username,
        },
      });
    } else if (error && typeof error === "object") {
      // Try to cast to our HandledError type
      const handledError = error as Partial<HandledError>;

      // Check if we have field information
      if (handledError.field) {
        // Determine the error message to display
        let errorMessage = "Invalid input";

        // Try to extract the actual message from the response
        if (handledError.message) {
          errorMessage = handledError.message;
        } else if (handledError.originalError?.response?.data?.message) {
          errorMessage = handledError.originalError.response.data.message;
        }

        // Set field-specific error with the message from the backend
        if (handledError.field === "username") {
          setErrors((prev) => ({
            ...prev,
            username: errorMessage,
          }));
        } else if (handledError.field === "email") {
          setErrors((prev) => ({
            ...prev,
            email: errorMessage,
          }));
        }
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

  // Handle input changes for registration form
  const handleInputChange = (
    name: string,
    value: string | moment.Moment | null
  ) => {
    setRegisterValues((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
    // Clear error for this field if any
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };
  const validatePasswordConfirmation = useCallback(() => {
    if (registerValues.password !== registerValues.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match",
      }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.confirmPassword;
        return newErrors;
      });
    }
  }, [registerValues.password, registerValues.confirmPassword]);
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
      setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
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
                  validateStatus={errors.username ? "error" : ""}
                  help={errors.username}
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
                  validateStatus={errors.email ? "error" : ""}
                  help={errors.email}
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
                  validateStatus={errors.password ? "error" : ""}
                  help={errors.password}
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
                  validateStatus={errors.confirmPassword ? "error" : ""}
                  help={errors.confirmPassword}
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
                  validateStatus={errors.firstname ? "error" : ""}
                  help={errors.firstname}
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
                  validateStatus={errors.lastname ? "error" : ""}
                  help={errors.lastname}
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
                  validateStatus={errors.dob ? "error" : ""}
                  help={errors.dob}
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

