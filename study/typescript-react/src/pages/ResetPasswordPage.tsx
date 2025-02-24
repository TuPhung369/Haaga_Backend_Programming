import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Form, Input, Button, Alert, Typography, Layout, Card } from "antd";
import validateInput from "../utils/validateInput";

const { Title } = Typography;
const { Content } = Layout;

// Define type for form values
interface ResetPasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

const ResetPasswordPage: React.FC = () => {
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const username = queryParams.get("username") ?? undefined; // Convert null to undefined

  const handleResetPassword = (values: ResetPasswordFormValues) => {
    const validationErrors = validateInput({
      username,
      password: values.newPassword,
      firstname: "", // Optional fields for validateInput
      lastname: "",
      dob: "",
      roles: [],
    });

    if (Object.keys(validationErrors).length > 0) {
      setError(Object.values(validationErrors).join(" "));
      return;
    }

    if (values.newPassword !== values.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    // For demonstration purposes (uncomment and implement API call as needed)
    setSuccess("Password reset successfully!");
    setTimeout(() => navigate("/login"), 2000);
  };

  return (
    <Layout
      style={{
        minHeight: "100vh",
        display: "flex", // Added for proper centering
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Content style={{ maxWidth: 400, width: "100%", padding: "20px" }}>
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
            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                style={{ marginBottom: "15px" }}
              />
            )}
            {success && (
              <Alert
                message={success}
                type="success"
                showIcon
                style={{ marginBottom: "15px" }}
              />
            )}
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

