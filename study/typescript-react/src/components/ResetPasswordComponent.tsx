import React from "react";
import { Form, Input, Typography, Modal } from "antd";

const { Text } = Typography;

interface FormValues {
  username: string;
  newPassword: string;
  confirmPassword: string;
}

interface ResetPasswordProps {
  isVisible: boolean;
  handleConfirm: () => void;
  handleCancel: () => void;
  formValues: FormValues;
  setFormValues: React.Dispatch<React.SetStateAction<FormValues>>;
  errors: Partial<Record<keyof FormValues, string>>;
}

const ResetPasswordComponent: React.FC<ResetPasswordProps> = ({
  isVisible,
  handleConfirm,
  handleCancel,
  formValues,
  setFormValues,
  errors,
}) => (
  <Modal
    title="Reset Your Password"
    open={isVisible} // Thay `visible` bằng `open` (Ant Design v4+)
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
        validateStatus={errors.newPassword ? "error" : ""}
        help={errors.newPassword}
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
      <Form.Item
        label={<Text strong>Confirm Password</Text>}
        validateStatus={errors.confirmPassword ? "error" : ""}
        help={errors.confirmPassword}
      >
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
