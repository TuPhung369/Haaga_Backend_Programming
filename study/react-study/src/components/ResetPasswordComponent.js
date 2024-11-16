import React from "react";
import { Form, Input, Typography, Modal } from "antd";

const { Text } = Typography;

const ResetPasswordComponent = ({
  isVisible,
  handleConfirm,
  handleCancel,
  formValues,
  setFormValues,
  errors,
}) => (
  <Modal
    title="Reset Your Password"
    visible={isVisible}
    onOk={handleConfirm}
    onCancel={handleCancel}
    okText="Reset Password"
    cancelText="Cancel"
    centered
  >
    <Form layout="vertical">
      <Form.Item
        label={<Text strong>Username</Text>}
        validateStatus={errors.username ? "error" : ""}
        help={errors.username}
      >
        <Input
          value={formValues.username}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, username: e.target.value }))
          }
          placeholder="Enter your username"
          autoComplete="username"
        />
      </Form.Item>
      <Form.Item
        label={<Text strong>New Password</Text>}
        validateStatus={errors.password ? "error" : ""}
        help={errors.password}
      >
        <Input.Password
          value={formValues.newPassword}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, newPassword: e.target.value }))
          }
          placeholder="Enter new password"
          autoComplete="new-password"
        />
      </Form.Item>
      <Form.Item label={<Text strong>Confirm Password</Text>}>
        <Input.Password
          value={formValues.confirmPassword}
          onChange={(e) =>
            setFormValues((prev) => ({
              ...prev,
              confirmPassword: e.target.value,
            }))
          }
          placeholder="Confirm new password"
          autoComplete="new-password"
        />
      </Form.Item>
    </Form>
  </Modal>
);

export default ResetPasswordComponent;

