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
  Select,
} from "antd";
import {
  authenticateUser,
  introspectToken,
  resetPassword,
  registerUser,
} from "../services/authService";
import { getAllRoles } from "../services/roleService";
import { getAllPermissions } from "../services/permissionService";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import "../css/LoginPage.css";
import validateInput from "../utils/validateInput"; // Import the validateInput function
import moment from "moment";

const { Title, Text } = Typography;
const { Content } = Layout;
const { Option } = Select;

const LoginPage = () => {
  const [error, setError] = useState("");
  const [isForgotPasswordModalVisible, setIsForgotPasswordModalVisible] =
    useState(false);
  const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [dob, setDob] = useState(moment("1987-07-07", "YYYY-MM-DD")); // Default date of birth
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [firstnameError, setFirstnameError] = useState("");
  const [lastnameError, setLastnameError] = useState("");
  const [dobError, setDobError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/");
    } else {
      localStorage.removeItem("isAuthenticated");
    }
  }, [navigate]);

  useEffect(() => {
    const loadRolesAndPermissions = async () => {
      try {
        const roleData = await getAllRoles();
        const permissionData = await getAllPermissions();
        setRoles(roleData);
        setPermissions(permissionData);
      } catch (err) {
        console.error("Failed to fetch roles or permissions", err);
      }
    };
    loadRolesAndPermissions();
  }, []);

  const colorRoles = (role) => {
    // Assign colors dynamically or use default if not available
    const colors = {
      Admin: "#ff4d4f",
      User: "#1890ff",
      Manager: "#52c41a",
    };
    return colors[role] || "#faad14";
  };

  const colorPermissions = (permission) => {
    // Assign colors dynamically or use default if not available
    const colors = {
      Read: "#2db7f5",
      Write: "#87d068",
      Update: "#1890ff",
      Delete: "#f50",
    };
    return colors[permission] || "#bfbfbf";
  };

  const handleLogin = (values) => {
    const login = async () => {
      try {
        const data = await authenticateUser(values.username, values.password);
        const response = await introspectToken(data.result.token);
        if (response.result?.valid || localStorage.getItem("isAuthenticated")) {
          localStorage.setItem("token", data.result.token);
          window.location.href = "/";
        }
      } catch (error) {
        console.error("Error during login:", error);
        setError(error.message || "Invalid username or password");
      }
    };
    login();
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
      notification.error({
        message: "Error",
        description: error.message || "An error occurred during password reset",
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
    setSelectedRoles([]);
    setSelectedPermissions([]);
    setIsRegisterModalVisible(true);
  };

  const handleRegisterConfirm = async () => {
    setUsernameError("");
    setPasswordError("");
    setFirstnameError("");
    setLastnameError("");
    setDobError("");
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
    if (Object.keys(errors).length > 0) {
      return;
    }

    const userData = {
      username,
      password: newPassword,
      firstname,
      lastname,
      dob: dob.format("YYYY-MM-DD"),
      roles: selectedRoles,
      permissions: selectedPermissions,
    };

    try {
      await registerUser(userData);
      notification.success({
        message: "Success",
        description: "User registered successfully!",
      });
      setIsRegisterModalVisible(false);
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "An error occurred during registration",
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
        background: "linear-gradient(to bottom right, #f0f2f5, #b3cde0)",
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
              <Button
                type="primary"
                htmlType="submit"
                className="login-page-button"
                style={{ width: "100%", borderRadius: "5px" }}
              >
                Login
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
                      backgroundColor: "#1890ff",
                      borderColor: "#1890ff",
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
                      backgroundColor: "#40a9ff",
                      borderColor: "#40a9ff",
                    }}
                  >
                    Forgot Password?
                  </Button>
                </Col>
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
          <Form.Item className="login-page-modal-form-item">
            <label htmlFor="register-roles">
              <Text strong>Roles</Text>
              <Select
                id="register-roles"
                mode="multiple"
                value={selectedRoles}
                onChange={(value) => setSelectedRoles(value)}
                placeholder="Select roles"
                style={{ width: "100%" }}
              >
                {roles.map((role) => (
                  <Option
                    key={role}
                    value={role}
                    style={{ color: colorRoles(role) }}
                  >
                    {role}
                  </Option>
                ))}
              </Select>
            </label>
          </Form.Item>
          <Form.Item className="login-page-modal-form-item">
            <label htmlFor="register-permissions">
              <Text strong>Permissions</Text>
              <Select
                id="register-permissions"
                mode="multiple"
                value={selectedPermissions}
                onChange={(value) => setSelectedPermissions(value)}
                placeholder="Select permissions"
                style={{ width: "100%" }}
              >
                {permissions.map((perm) => (
                  <Option
                    key={perm}
                    value={perm}
                    style={{ color: colorPermissions(perm) }}
                  >
                    {perm}
                  </Option>
                ))}
              </Select>
            </label>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default LoginPage;

