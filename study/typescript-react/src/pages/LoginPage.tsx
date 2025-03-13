import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Typography,
  Layout,
  Card,
  Modal,
  notification,
  Row,
  Col,
  DatePicker,
} from "antd";
import {
  authenticateUserWithCookies,
  registerUser,
} from "../services/authService";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { FcGoogle } from "react-icons/fc";
import "../styles/LoginPage.css";
import validateInput from "../utils/validateInput";
import moment, { Moment } from "moment";
import { useDispatch, useSelector } from "react-redux";
import { setAuthData } from "../store/authSlice";
import { setUserInfo } from "../store/userSlice";
import { getMyInfo } from "../services/userService";
import { handleServiceError } from "../services/baseService";
import { resetAllData } from "../store/resetActions";
import {
  ValidationInput,
  AuthState,
  AuthError,
  User,
  Role,
} from "../type/types";
import { setupTokenRefresh } from "../utils/tokenRefresh";
import { COLORS } from "../utils/constant";
import LoadingState from "../components/LoadingState";

const { Title } = Typography;
const { Content } = Layout;

const LoginPage: React.FC = () => {
  const oauth2ClientId = import.meta.env.VITE_OAUTH2_CLIENT_ID;
  const oauth2RedirectUri = import.meta.env.VITE_OAUTH2_REDIRECT_URI;
  //const appBaseUri = import.meta.env.VITE_BASE_URI;

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [isRegisterModalVisible, setIsRegisterModalVisible] =
    useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [firstname, setFirstname] = useState<string>("");
  const [lastname, setLastname] = useState<string>("");
  const [dob, setDob] = useState<Moment>(moment("1987-07-07", "YYYY-MM-DD"));
  const [email, setEmail] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [registerLoading, setRegisterLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector(
    (state: { auth: AuthState }) => state.auth
  );
  const [registerForm] = Form.useForm();

  // For debugging purposes
  useEffect(() => {
    console.log("registerLoading state changed:", registerLoading);
  }, [registerLoading]);

  useEffect(() => {
    if (isAuthenticated && token) {
      setTimeout(() => navigate("/"), 100);
    }
  }, [navigate, isAuthenticated, token]);

  // Updated login function in src/pages/LoginPage.tsx
  const handleLogin = async (values: {
    username: string;
    password: string;
  }) => {
    const errors = validateInput({
      username: values.username,
      password: values.password,
    });

    if (Object.keys(errors).length > 0) {
      return;
    }
    console.log("Login: Setting isSubmitting to true");
    setIsSubmitting(true);
    try {
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
            loginSocial: false,
          })
        );
        setupTokenRefresh(data.result.token);
        try {
          const userInfoResponse = await getMyInfo(data.result.token);
          if (userInfoResponse && userInfoResponse.result) {
            const userData: User = {
              id: userInfoResponse.result.id,
              username: userInfoResponse.result.username,
              firstname: userInfoResponse.result.firstname,
              lastname: userInfoResponse.result.lastname,
              dob: userInfoResponse.result.dob,
              email: userInfoResponse.result.email,
              roles: userInfoResponse.result.roles.map((role: Role) => ({
                name: role.name,
                description: role.description,
                color: role.color,
                permissions: role.permissions?.map((permission) => ({
                  name: permission.name,
                  description: permission.description,
                  color: permission.color,
                })),
              })),
              totpSecurity: userInfoResponse.result.totpSecurity,
            };
            dispatch(setUserInfo(userData));
          }
        } catch (error) {
          handleServiceError(error);
          console.error("Failed to fetch user info after login:", error);
        }

        notification.success({
          message: "Success",
          description: "Logged in successfully!",
        });
        navigate("/");
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error: unknown) {
      const authError = error as AuthError;
      const message = authError.message || "Invalid username or password";
      notification.error({
        message: "Login Error",
        description: message,
      });
    } finally {
      console.log("Login: Setting isSubmitting to false");
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log("Google Login: Setting isGoogleLoading to true");
    setIsGoogleLoading(true);
    try {
      const scope = "openid email profile";
      const responseType = "code";
      const authorizationUri = `https://accounts.google.com/o/oauth2/auth?response_type=${responseType}&client_id=${oauth2ClientId}&redirect_uri=${oauth2RedirectUri}&scope=${scope}`;
      window.location.href = authorizationUri;
    } catch (error) {
      console.error("Google login error:", error);
      setIsGoogleLoading(false);
      notification.error({
        message: "Google Login Error",
        description: "Failed to initialize Google login",
      });
    }
    // Note: We don't set isGoogleLoading to false here since we're redirecting away
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  const handleRegister = () => {
    console.log("Opening register modal");
    setUsername("");
    setNewPassword("");
    setConfirmPassword("");
    setFirstname("");
    setLastname("");
    setDob(moment("1987-07-07", "YYYY-MM-DD"));
    setEmail("");
    setIsRegisterModalVisible(true);
    registerForm.resetFields();
  };

  const handleRegisterConfirm = async () => {
    console.log("Register button clicked");
    try {
      console.log("Validating form fields");
      await registerForm.validateFields(); // Validate all fields first
      const userData: ValidationInput = {
        username,
        password: newPassword,
        firstname,
        lastname,
        dob: dob ? dob.format("YYYY-MM-DD") : undefined,
        email,
        roles: ["User"],
      };
      console.log("Form data:", userData);

      const errors = validateInput(userData);
      if (Object.keys(errors).length > 0) {
        console.log("Validation errors:", errors);
        return;
      }

      if (newPassword !== confirmPassword) {
        console.log("Passwords don't match");
        registerForm.setFields([
          {
            name: "confirmPassword",
            errors: ["Passwords do not match!"],
          },
        ]);
        return;
      }

      console.log("Setting registerLoading to true");
      setRegisterLoading(true);

      // Force render to ensure the loading state is applied
      setTimeout(() => {
        console.log("After timeout, registerLoading is:", registerLoading);
      }, 0);

      // Don't hide modal immediately to give visual feedback of submit
      try {
        console.log("Calling registerUser API");
        await registerUser(userData);
        console.log("Registration successful");

        // Only after successful registration, hide modal
        // Give enough time for user to see loading animation
        console.log("Setting timeout before navigation");
        setTimeout(() => {
          console.log("Timeout completed, hiding modal and navigating");
          setIsRegisterModalVisible(false);
          navigate("/verify-email", { state: { username } });
        }, 1500); // Increased timeout for better visibility
      } catch (error: unknown) {
        console.error("Registration error:", error);
        if (error instanceof Error) {
          // Handle validation errors
          return;
        }
        const authError = error as AuthError;
        const serverError = authError.response?.data;
        const message =
          serverError?.message || "An error occurred during registration";
        notification.error({
          message: `Error ${serverError?.httpCode || ""}`,
          description: message,
        });
        console.log("Setting registerLoading to false after error");
        setRegisterLoading(false);
      }
    } catch (error: unknown) {
      // Handle form validation errors
      console.error("Form validation error:", error);
    }
  };

  // Debug: to check when the LoadingState should be shown
  console.log("Render - registerLoading:", registerLoading);
  console.log("Render - isRegisterModalVisible:", isRegisterModalVisible);

  return (
    <>
      <style>
        {`
          .login-page-form-item .ant-form-item-explain-error {
            color: white !important;
          }
        `}
      </style>

      {/* Fullscreen loading for login submission */}
      {isSubmitting && <LoadingState tip="Logging in..." fullscreen={true} />}

      <Layout
        className="login-page-layout"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Content
          className="login-page-content"
          style={{ maxWidth: 400, width: "100%", padding: "20px" }}
        >
          <Card
            className="login-page-card"
            style={{
              boxShadow: "0 6px 16px rgba(0, 0, 0, 0.1)",
              borderRadius: "10px",
            }}
          >
            <Title
              level={2}
              className="login-page-title"
              style={{
                textAlign: "center",
                marginBottom: "20px",
                color: COLORS[12],
              }}
            >
              Login
            </Title>
            <Form
              name="login"
              onFinish={handleLogin}
              layout="vertical"
              size="large"
              style={{ maxWidth: "100%" }}
              initialValues={{ remember: true }}
              className="login-page-form"
              autoComplete="off"
            >
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: "Please enter your username!" },
                  {
                    validator: (_, value) => {
                      const errors = validateInput({ username: value });
                      return errors.username
                        ? Promise.reject(errors.username)
                        : Promise.resolve();
                    },
                  },
                ]}
                className="login-page-form-item"
              >
                <Input
                  prefix={<UserOutlined className="site-form-item-icon" />}
                  placeholder="Enter your Username"
                  autoComplete="username"
                />
              </Form.Item>
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: "Please enter your password!" },
                  {
                    validator: (_, value) => {
                      const errors = validateInput({ password: value });
                      return errors.password
                        ? Promise.reject(errors.password)
                        : Promise.resolve();
                    },
                  },
                ]}
                className="login-page-form-item"
              >
                <Input.Password
                  prefix={<LockOutlined className="site-form-item-icon" />}
                  placeholder="Enter your Password"
                  autoComplete="current-password"
                />
              </Form.Item>
              <Form.Item>
                <Row justify="space-between">
                  <Col span={11}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <input
                        type="checkbox"
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={() => setRememberMe(!rememberMe)}
                        style={{ marginRight: "8px" }}
                      />
                      <span
                        style={{
                          color: COLORS[12],
                          fontWeight: 500,
                          fontSize: "16px",
                          cursor: "pointer",
                        }}
                      >
                        Remember me
                      </span>
                    </div>
                  </Col>
                  <Col span={11}>
                    <span
                      style={{
                        color: COLORS[12],
                        fontWeight: 500,
                        fontSize: "16px",
                        cursor: "pointer",
                      }}
                      onClick={handleForgotPassword}
                    >
                      Forgot Password?
                    </span>
                  </Col>
                </Row>
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSubmitting}
                  style={{ width: "100%" }}
                >
                  Login
                </Button>
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  onClick={handleGoogleLogin}
                  loading={isGoogleLoading}
                  className="google-login-button"
                  style={{ width: "100%" }}
                >
                  <span style={{ marginRight: "10px" }}>
                    <FcGoogle size={24} />
                  </span>
                  Login with Google
                </Button>
              </Form.Item>
              <Form.Item>
                <Row justify="center">
                  <span
                    style={{
                      color: COLORS[12],
                      fontWeight: 500,
                      fontSize: "16px",
                      cursor: "pointer",
                    }}
                    onClick={handleRegister}
                  >
                    Don't have an account?{" "}
                    <span style={{ fontWeight: "bold" }}>Register</span>
                  </span>
                </Row>
              </Form.Item>
            </Form>
          </Card>
        </Content>

        {/* Register Modal */}
        <Modal
          title="Register"
          open={isRegisterModalVisible}
          onCancel={() => !registerLoading && setIsRegisterModalVisible(false)}
          footer={null}
          maskClosable={false}
          centered
          className="login-page-modal"
          style={{ zIndex: 1000 }}
        >
          {registerLoading && (
            <>
              {console.log("Should show LoadingState now")}
              <LoadingState tip="Registering user..." fullscreen={false} />
            </>
          )}

          {!registerLoading && (
            <Form
              form={registerForm} // Connect form instance
              layout="vertical"
              className="login-page-modal-form"
              autoComplete="off"
            >
              <Form.Item
                name="username"
                label="Username"
                rules={[
                  { required: true, message: "Please enter your username!" },
                  {
                    validator: (_, value) =>
                      validateInput({ username: value }).username
                        ? Promise.reject(
                            validateInput({ username: value }).username
                          )
                        : Promise.resolve(),
                  },
                ]}
              >
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                />
              </Form.Item>
              <Form.Item
                name="newPassword"
                label="Password"
                rules={[
                  { required: true, message: "Please enter your password!" },
                  {
                    validator: (_, value) =>
                      validateInput({ password: value }).password
                        ? Promise.reject(
                            validateInput({ password: value }).password
                          )
                        : Promise.resolve(),
                  },
                ]}
              >
                <Input.Password
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="new-password"
                />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="Confirm Password"
                dependencies={["newPassword"]}
                rules={[
                  { required: true, message: "Please confirm your password!" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("newPassword") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject("Passwords do not match!");
                    },
                  }),
                ]}
              >
                <Input.Password
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />
              </Form.Item>
              <Form.Item
                name="firstname"
                label="First Name"
                rules={[
                  { required: true, message: "Please enter your first name!" },
                  {
                    validator: (_, value) =>
                      validateInput({ firstname: value }).firstname
                        ? Promise.reject(
                            validateInput({ firstname: value }).firstname
                          )
                        : Promise.resolve(),
                  },
                ]}
              >
                <Input
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                  placeholder="Enter your first name"
                  autoComplete="given-name"
                />
              </Form.Item>
              <Form.Item
                name="lastname"
                label="Last Name"
                rules={[
                  { required: true, message: "Please enter your last name!" },
                  {
                    validator: (_, value) =>
                      validateInput({ lastname: value }).lastname
                        ? Promise.reject(
                            validateInput({ lastname: value }).lastname
                          )
                        : Promise.resolve(),
                  },
                ]}
              >
                <Input
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                  placeholder="Enter your last name"
                  autoComplete="family-name"
                />
              </Form.Item>
              <Form.Item
                name="dob"
                label="Date of Birth"
                rules={[
                  {
                    required: true,
                    message: "Please enter your date of birth!",
                  },
                  {
                    validator: (_, value) =>
                      validateInput({
                        dob: value ? value.format("YYYY-MM-DD") : undefined,
                      }).dob
                        ? Promise.reject(
                            validateInput({
                              dob: value
                                ? value.format("YYYY-MM-DD")
                                : undefined,
                            }).dob
                          )
                        : Promise.resolve(),
                  },
                ]}
              >
                <DatePicker
                  value={dob}
                  onChange={(date) => setDob(date || moment())}
                  format="YYYY-MM-DD"
                  style={{ width: "100%" }}
                />
              </Form.Item>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Please enter your email!" },
                  {
                    validator: (_, value) =>
                      validateInput({ email: value }).email
                        ? Promise.reject(validateInput({ email: value }).email)
                        : Promise.resolve(),
                  },
                ]}
              >
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  onClick={() => {
                    console.log("Register button clicked directly");
                    handleRegisterConfirm();
                  }}
                  style={{ width: "100%" }}
                >
                  Register
                </Button>
              </Form.Item>
            </Form>
          )}
        </Modal>
      </Layout>
    </>
  );
};

export default LoginPage;

