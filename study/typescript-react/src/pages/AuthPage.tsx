// src/pages/AuthPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Typography,
  DatePicker,
  notification
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
import { ValidationInput, AuthState, ValidationErrors } from "../types/AuthTypes";
import { setupTokenRefresh } from "../utils/tokenRefresh";
import "../styles/AuthPage.css";
import { FcGoogle } from "react-icons/fc";
import LoadingState from "../components/LoadingState";
import TotpAuthComponent from "../components/TotpAuthComponent";
import EmailOtpAuthComponent from "../components/EmailOtpAuthComponent";
import { COLORS } from "../utils/constant";
import ReCaptchaV3 from "../components/ReCaptchaV3";
import { SparklesCore } from "../components/SparklesCore";
import { GradientButton } from "../components/GradientButton";
import { SparklesText } from "../components/SparklesText";
import { ShineBorder } from "../components/ShineBorder";
import LoginRegisterTitle from "../components/LoginRegisterTitle";
import { SplineScene } from "../components/SplineScene";
import { FaFacebook, FaGithub } from "react-icons/fa";

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

const { Text } = Typography;

const ModelList = [
  "kZDDjO5HuC9GJUM2",
  "esVFW2MBH1aph2q9",
  "NyQ0ZBDp0dijSlWk",
  "j5ehxuzV3FHCaSfK",
  "6TPRZlnxSvkOEA3K",
  "LjqCyuErUCLpmQBK",
  "z0TqfH0-FGkgK7No"
];
//  const ModelList = ["kZDDjO5HuC9GJUM2", "esVFW2MBH1aph2q9", "j5ehxuzV3FHCaSfK"];

const AuthPage: React.FC = () => {
  const [splineSceneUrl, setSplineSceneUrl] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [showTotpAuth, setShowTotpAuth] = useState<boolean>(false);
  const [showEmailOtpAuth, setShowEmailOtpAuth] = useState<boolean>(false);
  const [totpUsername, setTotpUsername] = useState<string>("");
  const [totpPassword, setTotpPassword] = useState<string>("");
  const [isAccountLocked, setIsAccountLocked] = useState<boolean>(false);

  const { fieldErrors, setFieldError, clearFieldError, clearAllFieldErrors } =
    useFieldErrors();

  const [registerValues, setRegisterValues] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstname: "",
    lastname: "",
    dob: dayjs("1999-09-09", "YYYY-MM-DD")
  });

  const { execute: executeRegister, loading: registerLoading } =
    useApi(registerUser);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector(
    (state: { auth: AuthState }) => state.auth
  );

  const oauth2ClientId = import.meta.env.VITE_OAUTH2_CLIENT_ID;
  const oauth2RedirectUri = import.meta.env.VITE_OAUTH2_REDIRECT_URI;

  const [recaptchaV3Token, setRecaptchaV3Token] = useState<string>("");

  const recaptchaSiteKeyV3 = import.meta.env.VITE_RECAPTCHA_SITE_KEY_V3;

  const isDevelopment = import.meta.env.MODE === "development";

  useEffect(() => {
    const randomModel = ModelList[Math.floor(Math.random() * ModelList.length)];
    setSelectedModel(randomModel);
    setSplineSceneUrl(
      `https://prod.spline.design/${randomModel}/scene.splinecode`
    );
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      setTimeout(() => navigate("/"), 100);
    }
  }, [navigate, isAuthenticated, token]);

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setLoginError(null);
    setIsAccountLocked(false);
    clearAllFieldErrors();
  };

  const handleLogin = async (values: {
    username: string;
    password: string;
  }) => {
    setLoginError(null);
    setIsAccountLocked(false);
    clearAllFieldErrors();
    setIsLoading(true);

    try {
      const authInitResponse = await initiateAuthentication(
        values.username,
        values.password
      );

      setTotpUsername(values.username);
      setTotpPassword(values.password);

      if (authInitResponse.requiresTotp) {
        setShowTotpAuth(true);
      } else if (authInitResponse.requiresEmailOtp) {
        setShowEmailOtpAuth(true);
      } else {
        const data = await authenticateUserWithCookies(
          values.username,
          values.password
        );

        if (data && data.result && data.result.token) {
          dispatch(resetAllData());
          dispatch(
            setAuthData({
              token: data.result.token,
              isAuthenticated: true,
              loginSocial: false
            })
          );

          setupTokenRefresh(data.result.token);

          notification.success({
            message: "Success",
            description: "Logged in successfully!"
          });

          navigate("/");
        } else {
          throw new Error("Invalid response format from server");
        }
      }
    } catch (error: unknown) {
      console.error("Login error:", error);

      let errorMessage = "Authentication failed";
      let errorCode = "";

      if (error instanceof Error) {
        errorMessage = error.message;

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

      console.log("Error message:", errorMessage);
      console.log("Error code:", errorCode);

      const isLocked =
        errorCode === "ACCOUNT_LOCKED" ||
        errorMessage.includes("locked") ||
        errorMessage.includes("blocked");

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
        setLoginError("Invalid username or password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    clearAllFieldErrors();

    if (isDevelopment) {
      console.log("Registration in development mode with token details:", {
        tokenLength: recaptchaV3Token?.length || 0,
        tokenPrefix: recaptchaV3Token?.substring(0, 10) + "...",
        isDevelopment
      });
    } else {
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
      console.log("Register error:", error);

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

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    const scope = "openid email profile";
    const responseType = "code";
    const authorizationUri = `https://accounts.google.com/o/oauth2/auth?response_type=${responseType}&client_id=${oauth2ClientId}&redirect_uri=${oauth2RedirectUri}&scope=${scope}`;
    window.location.href = authorizationUri;
  };

  const handleFacebookLogin = () => {
    setFacebookLoading(true);
    const apiBaseUri = import.meta.env.VITE_API_BASE_URI || "";
    const redirectUrl = `${apiBaseUri}/oauth2/authorization/facebook`;
    window.location.href = redirectUrl;
  };

  const handleGithubLogin = () => {
    setGithubLoading(true);
    const scope = "user:email read:user";
    const githubClientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const githubRedirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI;
    const authorizationUri = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${githubRedirectUri}&scope=${scope}`;
    window.location.href = authorizationUri;
  };

  const handleInputChange = (
    name: string,
    value: string | dayjs.Dayjs | null
  ) => {
    setRegisterValues((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
    clearFieldError(name);
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  const validateField = (name: string, value: string | dayjs.Dayjs | null) => {
    const fieldToValidate: Partial<ValidationInput> = { [name]: value };

    if (name === "dob" && dayjs.isDayjs(value)) {
      fieldToValidate[name] = value.format("YYYY-MM-DD");
    }

    const fieldErrors = validateInput(fieldToValidate);

    if (fieldErrors[name]) {
      setFieldError(name, fieldErrors[name] as string);
    } else {
      clearFieldError(name);
    }
  };

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

  const renderCaptcha = () => {
    return (
      <>
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
      {isLoading && <LoadingState tip="Signing you in..." fullscreen={true} />}
      {registerLoading && (
        <LoadingState tip="Creating your account..." fullscreen={true} />
      )}
      {googleLoading && (
        <LoadingState tip="Connecting to Google..." fullscreen={true} />
      )}
      {githubLoading && (
        <LoadingState tip="Connecting to GitHub..." fullscreen={true} />
      )}
      {facebookLoading && (
        <LoadingState tip="Connecting to Facebook..." fullscreen={true} />
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
            minSize={0.5}
            maxSize={1.5}
            particleDensity={100}
            className="w-full h-full"
            particleColor="#00e5ff"
            speed={0.6}
          />
        </div>

        <ShineBorder
          borderRadius={20}
          borderWidth={2}
          duration={10}
          color={["#9E7AFF", "#00e5ff", "#9E7AFF", "#FE8BBB", "#FEE000"]}
          className="auth-shine-border"
        >
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
                    <div className="text-container">
                      <SparklesText
                        text="Welcome Back!"
                        className="welcome-title"
                        sparklesCount={5}
                        colors={{ first: "#9E7AFF", second: "#FE8BBB" }}
                        shimmer={true}
                        duration={1.8}
                        spread={1.5}
                        textColor="#9E7AFF"
                      />
                      <Text className="panel-text">Don't have an account?</Text>
                      <GradientButton
                        className="panel-register-button"
                        onClick={toggleMode}
                      >
                        Register
                      </GradientButton>
                    </div>
                    <div className="spline-container">
                      <SplineScene
                        scene={splineSceneUrl}
                        className={`spline-robot ${
                          selectedModel === ModelList[0]
                            ? "black-robot"
                            : selectedModel === ModelList[1]
                            ? "white-robot"
                            : "other-robot"
                        }`}
                      />
                    </div>
                  </>
                ) : (
                  <Form
                    layout="vertical"
                    className="auth-form register-form"
                    onFinish={handleRegister}
                  >
                    <LoginRegisterTitle
                      type="register"
                      text="Registration"
                      className="register-title"
                    />
                    <Form.Item
                      required
                      validateStatus={fieldErrors.username ? "error" : ""}
                      help={fieldErrors.username}
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
                      required
                      validateStatus={fieldErrors.email ? "error" : ""}
                      help={fieldErrors.email}
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
                      required
                      validateStatus={fieldErrors.password ? "error" : ""}
                      help={fieldErrors.password}
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
                      required
                      validateStatus={
                        fieldErrors.confirmPassword ? "error" : ""
                      }
                      help={fieldErrors.confirmPassword}
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
                      required
                      validateStatus={fieldErrors.firstname ? "error" : ""}
                      help={fieldErrors.firstname}
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
                      required
                      validateStatus={fieldErrors.lastname ? "error" : ""}
                      help={fieldErrors.lastname}
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
                      required
                      validateStatus={fieldErrors.dob ? "error" : ""}
                      help={fieldErrors.dob}
                    >
                      <DatePicker
                        prefix={<CalendarOutlined />}
                        style={{ width: "100%" }}
                        placeholder="Date of Birth"
                        value={registerValues.dob}
                        onChange={(date: dayjs.Dayjs | null) => {
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
                    <LoginRegisterTitle
                      type="login"
                      text="Login Now"
                      className="login-title"
                    />
                    <Form.Item
                      name="username"
                      rules={[
                        {
                          validator: (_, value) => {
                            if (!value) {
                              return Promise.reject(
                                "Please input your username!"
                              );
                            }
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
                        spellCheck={false}
                        className="autofill-input"
                      />
                    </Form.Item>
                    <Form.Item
                      name="password"
                      rules={[
                        {
                          validator: (_, value) => {
                            if (!value) {
                              return Promise.reject(
                                "Please input your password!"
                              );
                            }
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
                        className="autofill-input"
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
                      <Button
                        type="primary"
                        htmlType="submit"
                        className="auth-button"
                        loading={isLoading}
                        disabled={isLoading || isAccountLocked}
                      >
                        LOGIN
                      </Button>
                    </Form.Item>
                    <div className="social-login-container">
                      <button
                        type="button"
                        onClick={handleGithubLogin}
                        className="social-login-button github"
                        disabled={githubLoading}
                      >
                        <span className="icon-wrapper">
                          <FaGithub size={40} color="#FFFFFF" />
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="social-login-button google"
                        disabled={googleLoading}
                      >
                        <span className="icon-wrapper">
                          <FcGoogle size={40} />
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={handleFacebookLogin}
                        className="social-login-button facebook"
                        disabled={facebookLoading}
                      >
                        <span className="icon-wrapper">
                          <FaFacebook size={40} color="#FFFFFF" />
                        </span>
                      </button>
                    </div>
                    <Form.Item>
                      <div className="forgot-password">
                        <Button type="link" onClick={handleForgotPassword}>
                          <Text type="secondary">Forgot Password?</Text>
                        </Button>
                      </div>
                    </Form.Item>
                  </Form>
                ) : (
                  <>
                    <div className="text-container">
                      <SparklesText
                        text="Welcome Back!"
                        className="welcome-title"
                        sparklesCount={5}
                        colors={{ first: "#9E7AFF", second: "#FE8BBB" }}
                        shimmer={true}
                        duration={1.8}
                        spread={1.5}
                        textColor="#9E7AFF"
                      />
                      <Text className="panel-text">
                        Already have an account?
                      </Text>
                      <GradientButton
                        className="panel-login-button"
                        onClick={toggleMode}
                        variant="variant"
                      >
                        Login
                      </GradientButton>
                    </div>
                    <div className="spline-container">
                      <SplineScene
                        scene={splineSceneUrl}
                        className={`spline-robot ${
                          selectedModel === ModelList[0]
                            ? "black-robot"
                            : selectedModel === ModelList[1]
                            ? "white-robot"
                            : "other-robot"
                        }`}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </ShineBorder>
      </div>
    </>
  );
};

export default AuthPage;
