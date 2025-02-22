import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Form, Input, Button, Alert, Typography, Layout, Card } from "antd";
import validateInput from "../utils/validateInput";

const { Title } = Typography;
const { Content } = Layout;

const ResetPasswordPage = () => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const username = queryParams.get("username");

  const handleResetPassword = (values) => {
    const validationErrors = validateInput({
      username,
      password: values.newPassword,
      firstname: "", // Add other fields if needed
      lastname: "", // Add other fields if needed
      dob: "", // Add other fields if needed
      roles: [], // Add other fields if needed
    });

    if (Object.keys(validationErrors).length > 0) {
      setError(Object.values(validationErrors).join(" "));
      return;
    }

    if (values.newPassword !== values.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    // Call your reset password API here
    // Example:
    // resetPassword(username, values.newPassword)
    //   .then(() => {
    //     setSuccess("Password reset successfully!");
    //     setTimeout(() => navigate("/login"), 2000);
    //   })
    //   .catch((error) => {
    //     setError(error.message || "An error occurred during password reset");
    //   });

    // For demonstration purposes, we'll just show a success message
    setSuccess("Password reset successfully!");
    setTimeout(() => navigate("/login"), 2000);
  };

  return (
    <Layout
      style={{
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Content style={{ maxWidth: 400, width: "100%" }}>
        <Card style={{ boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)" }}>
          <Title level={2}>Reset Password</Title>
          <Form
            name="resetPassword"
            onFinish={handleResetPassword}
            layout="vertical"
            style={{ maxWidth: "300px" }}
          >
            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[
                { required: true, message: "Please input your new password!" },
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              rules={[
                {
                  required: true,
                  message: "Please confirm your new password!",
                },
              ]}
            >
              <Input.Password />
            </Form.Item>
            {error && <Alert message={error} type="error" />}
            {success && <Alert message={success} type="success" />}
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Reset Password
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default ResetPasswordPage;

