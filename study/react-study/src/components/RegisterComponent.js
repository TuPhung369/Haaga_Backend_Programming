import React from "react";
import { Form, Input, DatePicker, Typography, Modal } from "antd";

const { Text } = Typography;

const RegisterComponent = ({
  isVisible,
  handleRegisterConfirm,
  handleCancel,
  formValues,
  setFormValues,
  errors,
}) => (
  <Modal
    title="Register"
    open={isVisible}
    onOk={handleRegisterConfirm}
    onCancel={handleCancel}
    okText="Register"
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
        label={<Text strong>Password</Text>}
        validateStatus={errors.password ? "error" : ""}
        help={errors.password}
      >
        <Input.Password
          value={formValues.newPassword}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, newPassword: e.target.value }))
          }
          placeholder="Enter your password"
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
          placeholder="Confirm your password"
          autoComplete="new-password"
        />
      </Form.Item>
      <Form.Item
        label={<Text strong>First Name</Text>}
        validateStatus={errors.firstname ? "error" : ""}
        help={errors.firstname}
      >
        <Input
          value={formValues.firstname}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, firstname: e.target.value }))
          }
          placeholder="Enter your first name"
          autoComplete="given-name"
        />
      </Form.Item>
      <Form.Item
        label={<Text strong>Last Name</Text>}
        validateStatus={errors.lastname ? "error" : ""}
        help={errors.lastname}
      >
        <Input
          value={formValues.lastname}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, lastname: e.target.value }))
          }
          placeholder="Enter your last name"
          autoComplete="family-name"
        />
      </Form.Item>
      <Form.Item
        label={<Text strong>Date of Birth</Text>}
        validateStatus={errors.dob ? "error" : ""}
        help={errors.dob}
      >
        <DatePicker
          value={formValues.dob}
          onChange={(date) => setFormValues((prev) => ({ ...prev, dob: date }))}
          format="YYYY-MM-DD"
          placeholder="Select your date of birth"
          style={{ width: "100%" }}
        />
      </Form.Item>
    </Form>
  </Modal>
);

export default RegisterComponent;

