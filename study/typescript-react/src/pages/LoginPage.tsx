import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Alert,
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
  authenticateUser,
  introspectToken,
  resetPassword,
  registerUser,
} from "../services/authService";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { FcGoogle } from "react-icons/fc";
import "../styles/LoginPage.css";
import validateInput from "../utils/validateInput";
import moment, { Moment } from "moment";
import { useDispatch, useSelector } from "react-redux";
import { setAuthData } from "../store/authSlice";
import { ValidationInput } from "../type/loginType";

const { Title, Text } = Typography;
const { Content } = Layout;

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
}

interface AuthError {
  message?: string;
  response?: { data?: { httpCode?: number; message?: string } };
}

const LoginPage: React.FC = () => {
  const oauth2ClientId = import.meta.env.VITE_OAUTH2_CLIENT_ID;
  const oauth2RedirectUri = import.meta.env.VITE_OAUTH2_REDIRECT_URI;
  const appBaseUri = import.meta.env.VITE_BASE_URI;

  const [error, setError] = useState<string>("");
  const [isForgotPasswordModalVisible, setIsForgotPasswordModalVisible] =
    useState<boolean>(false);
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
  const [usernameError, setUsernameError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [firstnameError, setFirstnameError] = useState<string>("");
  const [lastnameError, setLastnameError] = useState<string>("");
  const [dobError, setDobError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector(
    (state: { auth: AuthState }) => state.auth
  );

  useEffect(() => {
    if (isAuthenticated && token) {
      setTimeout(() => navigate("/"), 100);
    }
  }, [navigate, isAuthenticated, token]);

  const handleLogin = (values: { username: string; password: string }) => {
    const login = async () => {
      const errors = validateInput({
        username: values.username,
        password: values.password,
      });

      if (Object.keys(errors).length > 0) {
        setError(
          errors.username || errors.password || "Please check your input!"
        );
        notification.error({
          message: "Validation Error",
          description:
            errors.username || errors.password || "Please check your input!",
        });
        return;
      }

      try {
        const data = await authenticateUser(values.username, values.password);
        const response = await introspectToken(data.result.token);
        if (response.result?.valid) {
          dispatch(
            setAuthData({
              token: data.result.token,
              isAuthenticated: true,
              loginSocial: false,
            })
          );
          notification.success({
            message: "Success",
            description: "Logged in successfully!",
          });
          window.location.href = appBaseUri;
        }
      } catch (error: unknown) {
        const authError = error as AuthError;
        const message = authError.message || "Invalid username or password";
        setError(message);
        notification.error({
          message: "Login Error",
          description: message,
        });
      }
    };
    login();
  };

  const handleGoogleLogin = () => {
    const scope = "openid email profile";
    const responseType = "code";
    const authorizationUri = `https://accounts.google.com/o/oauth2/auth?response_type=${responseType}&client_id=${oauth2ClientId}&redirect_uri=${oauth2RedirectUri}&scope=${scope}`;
    window.location.href = authorizationUri;
  };

  const handleForgotPassword = () => {
    setUsername("");
    setConfirmPassword("");
    setNewPassword("");
    setIsForgotPasswordModalVisible(true);
  };

  const handleForgotPasswordConfirm = async () => {
    setUsernameError("");
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match!");
      notification.error({
        message: "Error",
        description: "Passwords do not match!",
      });
      return;
    }

    const errors = validateInput({ username, password: newPassword });
    if (errors.username) setUsernameError(errors.username);
    if (errors.password) setPasswordError(errors.password);
    if (Object.keys(errors).length > 0) return;

    try {
      await resetPassword(username, newPassword);
      notification.success({
        message: "Success",
        description: "Password reset successfully!",
      });
      setIsForgotPasswordModalVisible(false);
    } catch (error: unknown) {
      const authError = error as AuthError;
      const serverError = authError.response?.data;
      const message =
        serverError?.message || "An error occurred during password reset";
      setError(message);
      notification.error({
        message: `Error ${serverError?.httpCode || ""}`,
        description: message,
      });
    }
  };

  const handleRegister = () => {
    setUsername("");
    setNewPassword("");
    setConfirmPassword("");
    setFirstname("");
    setLastname("");
    setDob(moment("1987-07-07", "YYYY-MM-DD"));
    setEmail("");
    setIsRegisterModalVisible(true);
  };

  const handleRegisterConfirm = async () => {
    setUsernameError("");
    setPasswordError("");
    setFirstnameError("");
    setLastnameError("");
    setDobError("");
    setEmailError("");

    const userData: ValidationInput = {
      username,
      password: newPassword,
      firstname,
      lastname,
      dob: dob ? dob.format("YYYY-MM-DD") : undefined, // Changed null to undefined
      email,
      roles: ["User"],
    };

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match!");
      notification.error({
        message: "Error",
        description: "Passwords do not match!",
      });
      return;
    }

    const errors = validateInput(userData);
    if (errors.username) setUsernameError(errors.username);
    if (errors.password) setPasswordError(errors.password);
    if (errors.firstname) setFirstnameError(errors.firstname);
    if (errors.lastname) setLastnameError(errors.lastname);
    if (errors.dob) setDobError(errors.dob);
    if (errors.email) setEmailError(errors.email);
    if (Object.keys(errors).length > 0) return;

    try {
      await registerUser(userData);
      notification.success({
        message: "Success",
        description: "User registered successfully!",
      });
      setIsRegisterModalVisible(false);
    } catch (error: unknown) {
      const authError = error as AuthError;
      const serverError = authError.response?.data;
      const message =
        serverError?.message || "An error occurred during registration";
      setError(message);
      notification.error({
        message: `Error ${serverError?.httpCode || ""}`,
        description: message,
      });
    }
  };

  return (
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
              color: "#FFFFFF",
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
            <Form.Item name="username" className="login-page-form-item">
              <label htmlFor="login-username">
                <Input
                  id="login-username"
                  name="username"
                  prefix={<UserOutlined className="site-form-item-icon" />}
                  placeholder="Enter your Username"
                  autoComplete="username"
                />
              </label>
            </Form.Item>
            <Form.Item name="password" className="login-page-form-item">
              <label htmlFor="login-password">
                <Input.Password
                  id="login-password"
                  name="password"
                  prefix={<LockOutlined className="site-form-item-icon" />}
                  placeholder="Enter your Password"
                  autoComplete="current-password"
                />
              </label>
            </Form.Item>
            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                closable
                style={{ marginBottom: "15px" }}
                className="login-page-alert"
              />
            )}
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
                        color: "#FFFFFF",
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
                      color: "#FFFFFF",
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
              <Button type="primary" htmlType="submit" className="login-button">
                Login
              </Button>
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                onClick={handleGoogleLogin}
                className="google-login-button"
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
                    color: "#FFFFFF",
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

      {/* Forgot Password Modal */}
      <Modal
        title="Reset Your Password"
        open={isForgotPasswordModalVisible}
        onOk={handleForgotPasswordConfirm}
        onCancel={() => setIsForgotPasswordModalVisible(false)}
        okText="Reset Password"
        cancelText="Cancel"
        maskClosable={false}
        centered
        className="login-page-modal"
      >
        <Form
          layout="vertical"
          className="login-page-modal-form"
          autoComplete="off"
        >
          <Form.Item
            validateStatus={usernameError ? "error" : ""}
            help={usernameError}
            className="login-page-modal-form-item"
          >
            <label htmlFor="forgot-username">
              <Text strong>Username</Text>
              <Input
                id="forgot-username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
              />
            </label>
          </Form.Item>
          <Form.Item
            validateStatus={passwordError ? "error" : ""}
            help={passwordError}
            className="login-page-modal-form-item"
          >
            <label htmlFor="forgot-new-password">
              <Text strong>New Password</Text>
              <Input.Password
                id="forgot-new-password"
                name="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                autoComplete="new-password"
              />
            </label>
          </Form.Item>
          <Form.Item
            validateStatus={passwordError ? "error" : ""}
            help={passwordError}
            className="login-page-modal-form-item"
          >
            <label htmlFor="forgot-confirm-password">
              <Text strong>Confirm Password</Text>
              <Input.Password
                id="forgot-confirm-password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                autoComplete="new-password"
              />
            </label>
          </Form.Item>
        </Form>
      </Modal>

      {/* Register Modal */}
      <Modal
        title="Register"
        open={isRegisterModalVisible}
        onOk={handleRegisterConfirm}
        onCancel={() => setIsRegisterModalVisible(false)}
        okText="Register"
        cancelText="Cancel"
        maskClosable={false}
        centered
        className="login-page-modal"
      >
        <Form
          layout="vertical"
          className="login-page-modal-form"
          autoComplete="off"
        >
          <Form.Item
            validateStatus={usernameError ? "error" : ""}
            help={usernameError}
            className="login-page-modal-form-item"
          >
            <label htmlFor="register-username">
              <Text strong>Username</Text>
              <Input
                id="register-username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
              />
            </label>
          </Form.Item>
          <Form.Item
            validateStatus={passwordError ? "error" : ""}
            help={passwordError}
            className="login-page-modal-form-item"
          >
            <label htmlFor="register-password">
              <Text strong>Password</Text>
              <Input.Password
                id="register-password"
                name="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="new-password"
              />
            </label>
          </Form.Item>
          <Form.Item
            validateStatus={passwordError ? "error" : ""}
            help={passwordError}
            className="login-page-modal-form-item"
          >
            <label htmlFor="register-confirm-password">
              <Text strong>Confirm Password</Text>
              <Input.Password
                id="register-confirm-password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
            </label>
          </Form.Item>
          <Form.Item
            validateStatus={firstnameError ? "error" : ""}
            help={firstnameError}
            className="login-page-modal-form-item"
          >
            <label htmlFor="register-firstname">
              <Text strong>First Name</Text>
              <Input
                id="register-firstname"
                name="firstname"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                placeholder="Enter your first name"
                autoComplete="given-name"
              />
            </label>
          </Form.Item>
          <Form.Item
            validateStatus={lastnameError ? "error" : ""}
            help={lastnameError}
            className="login-page-modal-form-item"
          >
            <label htmlFor="register-lastname">
              <Text strong>Last Name</Text>
              <Input
                id="register-lastname"
                name="lastname"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                placeholder="Enter your last name"
                autoComplete="family-name"
              />
            </label>
          </Form.Item>
          <Form.Item
            validateStatus={dobError ? "error" : ""}
            help={dobError}
            className="login-page-modal-form-item"
          >
            <label htmlFor="register-dob">
              <Text strong>Date of Birth</Text>
              <DatePicker
                id="register-dob"
                name="dob"
                value={dob}
                onChange={(date) => setDob(date || moment())}
                format="YYYY-MM-DD"
                style={{ width: "100%" }}
              />
            </label>
          </Form.Item>
          <Form.Item
            validateStatus={emailError ? "error" : ""}
            help={emailError}
            className="login-page-modal-form-item"
          >
            <label htmlFor="register-email">
              <Text strong>Email</Text>
              <Input
                id="register-email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
              />
            </label>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default LoginPage;
