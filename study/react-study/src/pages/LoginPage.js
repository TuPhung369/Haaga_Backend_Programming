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
import moment from "moment";

const { Title, Text } = Typography;
const { Content } = Layout;

const LoginPage = () => {
  const oauth2ClientId = process.env.REACT_APP_OAUTH2_CLIENT_ID;
  const oauth2RedirectUri = process.env.REACT_APP_OAUTH2_REDIRECT_URI;
  const appBaseUri = process.env.REACT_APP_BASE_URI;
  const [error, setError] = useState("");
  const [isForgotPasswordModalVisible, setIsForgotPasswordModalVisible] =
    useState(false);
  const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [dob, setDob] = useState(moment("1987-07-07", "YYYY-MM-DD"));
  const [email, setEmail] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [firstnameError, setFirstnameError] = useState("");
  const [lastnameError, setLastnameError] = useState("");
  const [dobError, setDobError] = useState("");
  const [emailError, setEmailError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } else {
      localStorage.removeItem("isAuthenticated");
    }
  }, [navigate]);

  const handleLogin = (values) => {
    const login = async () => {
      try {
        const data = await authenticateUser(values.username, values.password);
        const response = await introspectToken(data.result.token);
        if (response.result?.valid || localStorage.getItem("isAuthenticated")) {
          localStorage.setItem("token", data.result.token);
          window.location.href = appBaseUri;
        }
      } catch (error) {
        console.error("Error during login:", error);
        setError(error.message || "Invalid username or password");
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
      notification.error({
        message: "Error",
        description: "Passwords do not match!",
      });
      return;
    }

    const errors = validateInput({ username, password: newPassword });
    if (errors.username) {
      setUsernameError(errors.username);
    }
    if (errors.password) {
      setPasswordError(errors.password);
    }
    if (Object.keys(errors).length > 0) {
      return;
    }
    try {
      await resetPassword(username, newPassword);
      notification.success({
        message: "Success",
        description: "Password reset successfully!",
      });
      setIsForgotPasswordModalVisible(false);
    } catch (error) {
      const serverError = error.response?.data;
      notification.error({
        message: `Error ${serverError?.httpCode || ""}`,
        description:
          serverError?.message || "An error occurred during password reset",
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
    const userData = {
      username,
      password: newPassword,
      firstname,
      lastname,
      dob: dob.format("YYYY-MM-DD"),
      email,
      roles: ["User"],
    };
    if (newPassword !== confirmPassword) {
      notification.error({
        message: "Error",
        description: "Passwords do not match!",
      });
      return;
    }

    const errors = validateInput({
      username,
      password: newPassword,
      firstname,
      lastname,
      dob: dob ? dob.format("YYYY-MM-DD") : null,
      email,
    });

    if (errors.username) {
      setUsernameError(errors.username);
    }
    if (errors.password) {
      setPasswordError(errors.password);
    }
    if (errors.firstname) {
      setFirstnameError(errors.firstname);
    }
    if (errors.lastname) {
      setLastnameError(errors.lastname);
    }
    if (errors.dob) {
      setDobError(errors.dob);
    }
    if (errors.email) {
      setEmailError(errors.email);
    }
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      await registerUser(userData);
      notification.success({
        message: "Success",
        description: "User registered successfully!",
      });
      setIsRegisterModalVisible(false);
    } catch (error) {
      const serverError = error.response?.data;
      notification.error({
        message: `Error ${serverError?.httpCode || ""}`,
        description:
          serverError?.message || "An error occurred during password reset",
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
        background: "linear-gradient(to bottom right, #F0F2F5, #B3CDE0)",
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
          hoverable
        >
          <Title
            level={2}
            className="login-page-title"
            style={{ textAlign: "center", marginBottom: "20px" }}
          >
            Login to Your Account
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
                <Text strong>Username</Text>
                <Input
                  id="login-username"
                  name="username"
                  prefix={<UserOutlined className="site-form-item-icon" />}
                  placeholder="Enter your username"
                  autoComplete="username"
                />
              </label>
            </Form.Item>
            <Form.Item name="password" className="login-page-form-item">
              <label htmlFor="login-password">
                <Text strong>Password</Text>
                <Input.Password
                  id="login-password"
                  name="password"
                  prefix={<LockOutlined className="site-form-item-icon" />}
                  placeholder="Enter your password"
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
                <FcGoogle style={{ marginRight: "10px", fontSize: "24px" }} />
                Login with Google
              </Button>
            </Form.Item>
            <Form.Item>
              <Row justify="space-between">
                <Col span={11}>
                  <Button
                    type="primary"
                    onClick={handleRegister}
                    className="login-page-register-button"
                    style={{
                      width: "100%",
                      backgroundColor: "#1890FF",
                      borderColor: "#1890FF",
                    }}
                  >
                    Register
                  </Button>
                </Col>
                <Col span={11}>
                  <Button
                    type="primary"
                    onClick={handleForgotPassword}
                    className="login-page-forgot-button"
                    style={{
                      width: "100%",
                      backgroundColor: "#40A9FF",
                      borderColor: "##40A9FF",
                    }}
                  >
                    Forgot Password
                  </Button>
                </Col>
              </Row>
            </Form.Item>
          </Form>
        </Card>
      </Content>

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
                placeholder="Enter new password"
                autoComplete="new-password"
              />
            </label>
          </Form.Item>
          <Form.Item className="login-page-modal-form-item">
            <label htmlFor="forgot-confirm-password">
              <Text strong>Confirm Password</Text>
              <Input.Password
                id="forgot-confirm-password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
            </label>
          </Form.Item>
        </Form>
      </Modal>

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
          <Form.Item className="login-page-modal-form-item">
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
                onChange={(date) => setDob(date)}
                format="YYYY-MM-DD"
                placeholder="Select your date of birth"
                style={{ width: "100%" }}
              />
            </label>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default LoginPage;

