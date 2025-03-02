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
import { resetAllData } from "../store/resetActions";
import { ValidationInput, AuthState, AuthError } from "../type/authType";
import { COLORS } from "../utils/constant";

const { Title } = Typography;
const { Content } = Layout;

const LoginPage: React.FC = () => {
  const oauth2ClientId = import.meta.env.VITE_OAUTH2_CLIENT_ID;
  const oauth2RedirectUri = import.meta.env.VITE_OAUTH2_REDIRECT_URI;
  const appBaseUri = import.meta.env.VITE_BASE_URI;

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

  const handleLogin = async (values: {
    username: string;
    password: string;
  }) => {
    const errors = validateInput({
      username: values.username,
      password: values.password,
    });

    if (Object.keys(errors).length > 0) {
      return; // Stop if there are validation errors (they’re shown under inputs)
    }

    try {
      const data = await authenticateUser(values.username, values.password);
      const response = await introspectToken(data.result.token);
      if (response.result?.valid) {
        dispatch(resetAllData());
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
      notification.error({
        message: "Login Error",
        description: message,
      });
    }
  };

  const handleGoogleLogin = () => {
    const scope = "openid email profile";
    const responseType = "code";
    const authorizationUri = `https://accounts.google.com/o/oauth2/auth?response_type=${responseType}&client_id=${oauth2ClientId}&redirect_uri=${oauth2RedirectUri}&scope=${scope}`;
    window.location.href = authorizationUri;
  };

  const handleForgotPassword = () => {
    setUsername("");
    setNewPassword("");
    setConfirmPassword("");
    setIsForgotPasswordModalVisible(true);
  };

  const handleForgotPasswordConfirm = async () => {
    const errors = validateInput({ username, password: newPassword });
    if (Object.keys(errors).length > 0) {
      return; // Stop if there are validation errors (they’re shown under inputs)
    }

    if (newPassword !== confirmPassword) {
      return; // Validation handled by Form rules, no need for manual error setting here
    }

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
    const userData: ValidationInput = {
      username,
      password: newPassword,
      firstname,
      lastname,
      dob: dob ? dob.format("YYYY-MM-DD") : undefined,
      email,
      roles: ["User"],
    };

    const errors = validateInput(userData);
    if (Object.keys(errors).length > 0) {
      return; // Stop if there are validation errors (they’re shown under inputs)
    }

    if (newPassword !== confirmPassword) {
      return; // Validation handled by Form rules, no need for manual error setting here
    }

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
      notification.error({
        message: `Error ${serverError?.httpCode || ""}`,
        description: message,
      });
    }
  };

  return (
    <>
      <style>
        {`
          .login-page-form-item .ant-form-item-explain-error {
            color: white !important;
          }
        `}
      </style>
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
                  className="login-button"
                >
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
              name="username"
              label="Username"
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
              className="login-page-modal-form-item"
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
              label="New Password"
              rules={[
                { required: true, message: "Please enter your new password!" },
                {
                  validator: (_, value) => {
                    const errors = validateInput({ password: value });
                    return errors.password
                      ? Promise.reject(errors.password)
                      : Promise.resolve();
                  },
                },
              ]}
              className="login-page-modal-form-item"
            >
              <Input.Password
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                autoComplete="new-password"
              />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              rules={[
                {
                  required: true,
                  message: "Please confirm your new password!",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject("Passwords do not match!");
                  },
                }),
              ]}
              className="login-page-modal-form-item"
            >
              <Input.Password
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                autoComplete="new-password"
              />
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
              name="username"
              label="Username"
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
              className="login-page-modal-form-item"
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
                  validator: (_, value) => {
                    const errors = validateInput({ password: value });
                    return errors.password
                      ? Promise.reject(errors.password)
                      : Promise.resolve();
                  },
                },
              ]}
              className="login-page-modal-form-item"
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
              className="login-page-modal-form-item"
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
                  validator: (_, value) => {
                    const errors = validateInput({ firstname: value });
                    return errors.firstname
                      ? Promise.reject(errors.firstname)
                      : Promise.resolve();
                  },
                },
              ]}
              className="login-page-modal-form-item"
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
                  validator: (_, value) => {
                    const errors = validateInput({ lastname: value });
                    return errors.lastname
                      ? Promise.reject(errors.lastname)
                      : Promise.resolve();
                  },
                },
              ]}
              className="login-page-modal-form-item"
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
                { required: true, message: "Please enter your date of birth!" },
                {
                  validator: (_, value) =>
                    validateInput({
                      dob: value ? value.format("YYYY-MM-DD") : undefined,
                    }).dob
                      ? Promise.reject(
                          validateInput({
                            dob: value ? value.format("YYYY-MM-DD") : undefined,
                          }).dob
                        )
                      : Promise.resolve(),
                },
              ]}
              className="login-page-modal-form-item"
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
                  validator: (_, value) => {
                    const errors = validateInput({ email: value });
                    return errors.email
                      ? Promise.reject(errors.email)
                      : Promise.resolve();
                  },
                },
              ]}
              className="login-page-modal-form-item"
            >
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
              />
            </Form.Item>
          </Form>
        </Modal>
      </Layout>
    </>
  );
};

export default LoginPage;

