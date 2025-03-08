import React, { useState, useCallback, useEffect } from "react";
import {
  Descriptions,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  notification,
  Button,
  Space,
  Divider,
} from "antd";
import { EditOutlined, MailOutlined, KeyOutlined } from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import {
  invalidateUserInfo,
  setAllUsers,
  setUserInfo,
} from "../store/userSlice";
import { updateMyInfo } from "../services/userService";
import {
  verifyEmailChange,
  requestEmailChangeCode,
} from "../services/authService";
import validateInput from "../utils/validateInput";
import { AxiosError } from "axios";
import { RootState, ExtendApiError, User } from "../type/types";
import VerificationCodeInput from "./VerificationCodeInput";
import styled from "styled-components";
import { COLORS } from "../utils/constant";

const { Option } = Select;

// Define styled component outside of component function
const MyInfoStyle = styled.div`
  .custom-descriptions.mt-0 {
    margin-top: 0 !important;
    padding-top: 0 !important;
  }

  .descriptions-title-container {
    display: flex;
    flex-direction: row;
    justify-content: start;
    align-items: center;
  }

  .section-title {
    font-size: 20px;
    margin: 0;
    font-weight: 700;
  }

  .edit-icon {
    cursor: pointer;
    margin-left: 10px;
    font-size: 18px;
    color: ${COLORS[14]};
    transition: color 0.3s;
  }

  .edit-icon:hover {
    opacity: 0.8;
  }

  /* Make tags more compact */
  .ant-tag {
    margin-right: 4px;
    margin-bottom: 4px;
    padding: 0 6px;
  }

  /* Reduce overall padding */
  .ant-descriptions-item-label,
  .ant-descriptions-item-content {
    padding: 8px 12px !important;
  }

  /* Adjust spacing for modals */
  .ant-modal-body .ant-form-item {
    margin-bottom: 12px;
  }
`;

interface MyInfoProps {
  onUpdateSuccess?: () => void;
}

const MyInfo: React.FC<MyInfoProps> = ({ onUpdateSuccess }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEmailChangeModalVisible, setIsEmailChangeModalVisible] =
    useState(false);
  const [form] = Form.useForm();
  const [emailChangeForm] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const [verificationCode, setVerificationCode] = useState("");
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [verificationError, setVerificationError] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<{
    type: "success" | "error";
    message: string;
    description: string;
  } | null>(null);

  const { token, loginSocial } = useSelector((state: RootState) => state.auth);
  const { userInfo, roles, allUsers } = useSelector(
    (state: RootState) => state.user
  );
  const dispatch = useDispatch();

  const openNotificationWithIcon = useCallback(
    (type: "success" | "error", message: string, description: string) => {
      api[type]({
        message,
        description,
      });
    },
    [api]
  );

  useEffect(() => {
    if (notificationMessage) {
      openNotificationWithIcon(
        notificationMessage.type,
        notificationMessage.message,
        notificationMessage.description
      );
      setNotificationMessage(null);
    }
  }, [notificationMessage, openNotificationWithIcon]);

  const showModalUpdate = () => {
    if (userInfo) {
      setIsModalVisible(true);
      form.setFieldsValue({
        username: userInfo.username || "",
        password: "",
        firstname: userInfo.firstname || "",
        lastname: userInfo.lastname || "",
        dob: userInfo.dob || "",
        email: userInfo.email || "",
        roles: userInfo.roles?.map((role) => role.name) || [],
      });
    }
  };

  const showEmailChangeModal = () => {
    setIsEmailChangeModalVisible(true);
    emailChangeForm.resetFields();
    setCodeSent(false);
    setVerificationCode("");
    setVerificationError(false);
  };

  const handleRequestVerificationCode = async () => {
    try {
      if (!token) {
        setNotificationMessage({
          type: "error",
          message: "Authentication Error",
          description: "You are not authenticated. Please log in again.",
        });
        return;
      }
      const values = await emailChangeForm.validateFields([
        "newEmail",
        "currentPassword",
      ]);
      setIsRequestingCode(true);
      setVerificationError(false);

      // Validate email format
      const errors = validateInput({ email: values.newEmail });
      if (errors.email) {
        emailChangeForm.setFields([
          {
            name: "newEmail",
            errors: [errors.email],
          },
        ]);
        setIsRequestingCode(false);
        return;
      }

      // Call API to request verification code
      await requestEmailChangeCode({
        userId: userInfo?.id || "",
        currentEmail: userInfo?.email || "",
        newEmail: values.newEmail,
        password: values.currentPassword,
        token,
      });

      setCodeSent(true);
      setNotificationMessage({
        type: "success",
        message: "Verification Code Sent",
        description: `A verification code has been sent to ${values.newEmail}`,
      });
    } catch (error) {
      const axiosError = error as AxiosError<ExtendApiError>;
      setNotificationMessage({
        type: "error",
        message: "Error",
        description:
          axiosError.response?.data?.message ||
          "Failed to send verification code",
      });
    } finally {
      setIsRequestingCode(false);
    }
  };

  // Function to handle resending verification code
  const handleResendVerificationCode = async () => {
    try {
      const values = await emailChangeForm.validateFields([
        "newEmail",
        "currentPassword",
      ]);

      await requestEmailChangeCode({
        userId: userInfo?.id || "",
        currentEmail: userInfo?.email || "",
        newEmail: values.newEmail,
        password: values.currentPassword,
        token: token!,
      });

      setNotificationMessage({
        type: "success",
        message: "Verification Code Resent",
        description: `A new verification code has been sent to ${values.newEmail}`,
      });
    } catch (error) {
      const axiosError = error as AxiosError<ExtendApiError>;
      setNotificationMessage({
        type: "error",
        message: "Error",
        description:
          axiosError.response?.data?.message ||
          "Failed to resend verification code",
      });
    }
  };

  const handleVerifyAndChangeEmail = async () => {
    try {
      if (!verificationCode || verificationCode.length !== 6) {
        setNotificationMessage({
          type: "error",
          message: "Invalid Code",
          description: "Please enter the 6-digit verification code",
        });
        return;
      }

      setIsVerifying(true);
      setVerificationError(false);

      const values = await emailChangeForm.validateFields();

      // Call API to verify code and change email
      await verifyEmailChange({
        userId: userInfo?.id || "",
        newEmail: values.newEmail,
        verificationCode,
        token: token!,
      });
      if (userInfo && userInfo.id) {
        // Create updated user info with new email (ensuring all required User properties)
        const updatedUserInfo: User = {
          ...userInfo,
          email: values.newEmail,
        };

        // Directly update the user info in Redux store
        dispatch(setUserInfo(updatedUserInfo));

        // Also update in the allUsers array if needed
        if (allUsers.length > 0) {
          const updatedAllUsers = allUsers.map((user) => {
            if (user.id === userInfo.id) {
              return {
                ...user,
                email: values.newEmail,
              };
            }
            return user;
          });

          dispatch(setAllUsers(updatedAllUsers));
        }
      }

      // Mark for refetch on next navigation (optional if direct update works)
      dispatch(invalidateUserInfo());

      setNotificationMessage({
        type: "success",
        message: "Email Updated",
        description: "Your email has been successfully updated.",
      });

      setIsEmailChangeModalVisible(false);
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (error) {
      const axiosError = error as AxiosError<ExtendApiError>;
      setVerificationError(true);
      setNotificationMessage({
        type: "error",
        message: "Verification Failed",
        description:
          axiosError.response?.data?.message || "Failed to verify code",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const errors = validateInput({
        username: values.username,
        password: values.password,
        firstname: values.firstname,
        lastname: values.lastname,
        dob: values.dob,
        // Skip email validation as it's handled separately
      });

      if (Object.keys(errors).length > 0) {
        form.setFields(
          Object.keys(errors).map((key) => ({
            name: key,
            errors: [errors[key]],
          }))
        );
        return;
      }

      if (userInfo) {
        // Create a copy of values without email
        const updateValues = { ...values };

        if (!token) {
          throw new Error("Token is invalid");
        }
        const response = await updateMyInfo(userInfo.id, updateValues, token);
        dispatch(invalidateUserInfo());
        if (response && response.result) {
          const updatedUser = response.result;
          dispatch(
            setAllUsers(
              allUsers.map((user) =>
                user.id === updatedUser.id ? updatedUser : user
              )
            )
          );
        }

        setNotificationMessage({
          type: "success",
          message: "Success",
          description: "User information updated successfully.",
        });
        if (onUpdateSuccess) onUpdateSuccess();
      }
      setIsModalVisible(false);
    } catch (error) {
      const axiosError = error as AxiosError<ExtendApiError>;
      console.error("Error updating user:", axiosError.response?.data?.message);
      setNotificationMessage({
        type: "error",
        message: "Error",
        description:
          axiosError.response?.data?.message ||
          "An error occurred while updating the user.",
      });
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleEmailChangeCancel = () => {
    setIsEmailChangeModalVisible(false);
  };

  const getAvailableRoles = () => {
    if (!userInfo) return [];
    const userRoles = userInfo.roles.map((role) => role.name);
    if (userRoles.includes("ADMIN")) {
      return ["ADMIN", "MANAGER", "USER"];
    } else if (userRoles.includes("MANAGER")) {
      return ["MANAGER", "USER"];
    } else if (userRoles.includes("USER")) {
      return ["USER"];
    }
    return ["USER"];
  };

  return (
    <MyInfoStyle>
      {contextHolder}
      {userInfo ? (
        <Descriptions
          className="custom-descriptions mt-0"
          title={
            <div className="descriptions-title-container">
              <h2 className="section-title">User Information</h2>
              <EditOutlined onClick={showModalUpdate} className="edit-icon" />
            </div>
          }
          bordered
        >
          <Descriptions.Item label="First Name">
            {userInfo.firstname}
          </Descriptions.Item>
          <Descriptions.Item label="Last Name">
            {userInfo.lastname}
          </Descriptions.Item>
          <Descriptions.Item label="Role">
            {userInfo.roles && userInfo.roles.length > 0
              ? userInfo.roles.map((role) => (
                  <Tag key={role.name} color={role.color}>
                    {role.name}
                  </Tag>
                ))
              : "No role assigned"}
          </Descriptions.Item>
          <Descriptions.Item label="Username">
            {userInfo.username}
          </Descriptions.Item>
          <Descriptions.Item label="Date of Birth">
            {userInfo.dob}
          </Descriptions.Item>
          <Descriptions.Item label="Permissions">
            {userInfo.roles && userInfo.roles.length > 0
              ? [
                  ...new Set(
                    userInfo.roles.flatMap((role) =>
                      role.permissions?.map((perm) => perm.name)
                    )
                  ),
                ].map((permName) => {
                  const perm = userInfo.roles
                    .flatMap((role) => role.permissions)
                    .find((p) => p && p.name === permName);
                  return perm ? (
                    <Tag key={perm.name} color={perm.color}>
                      {perm.name}
                    </Tag>
                  ) : null;
                })
              : "No permissions"}
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <p>Loading user information...</p>
      )}

      {/* Main profile edit modal */}
      <Modal
        title="Edit My Information"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical" name="userForm">
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: "Please input the username!" }]}
          >
            <Input disabled />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please input the password!" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: "Please input the email!" }]}
          >
            <Input
              disabled
              suffix={
                !loginSocial && (
                  <Button
                    type="link"
                    icon={<MailOutlined />}
                    onClick={() => {
                      setIsModalVisible(false);
                      showEmailChangeModal();
                    }}
                    style={{ padding: "0" }}
                  >
                    Change
                  </Button>
                )
              }
            />
          </Form.Item>
          <Form.Item
            name="firstname"
            label="First Name"
            rules={[
              { required: true, message: "Please input the first name!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="lastname"
            label="Last Name"
            rules={[{ required: true, message: "Please input the last name!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="dob"
            label="Date of Birth (YYYY-MM-DD)"
            rules={[
              { required: true, message: "Please input the date of birth!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="roles"
            label="Role"
            rules={[{ required: true, message: "Please select the role!" }]}
          >
            <Select mode="multiple" placeholder="Select roles" disabled>
              {roles
                .filter((role) => getAvailableRoles().includes(role.name))
                .map((role) => (
                  <Option key={role.name} value={role.name}>
                    {role.name}
                  </Option>
                ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Email change modal */}
      <Modal
        title="Change Email Address"
        open={isEmailChangeModalVisible}
        onCancel={handleEmailChangeCancel}
        footer={null}
      >
        <Form form={emailChangeForm} layout="vertical">
          <Form.Item
            name="newEmail"
            label="New Email Address"
            rules={[
              {
                required: true,
                message: "Please enter your new email address",
              },
              { type: "email", message: "Please enter a valid email address" },
            ]}
          >
            <Input
              placeholder="Enter your new email address"
              disabled={codeSent}
              prefix={<MailOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="currentPassword"
            label="Current Password"
            rules={[
              { required: true, message: "Please enter your current password" },
            ]}
          >
            <Input.Password
              placeholder="Enter your current password"
              disabled={codeSent}
              prefix={<KeyOutlined />}
            />
          </Form.Item>

          {!codeSent ? (
            <Form.Item>
              <Button
                type="primary"
                onClick={handleRequestVerificationCode}
                loading={isRequestingCode}
                block
              >
                Request Verification Code
              </Button>
            </Form.Item>
          ) : (
            <>
              <Divider />

              {/* Replace the old verification code input with our new component */}
              <VerificationCodeInput
                value={verificationCode}
                onChange={setVerificationCode}
                onResendCode={handleResendVerificationCode}
                isSubmitting={isVerifying}
                isError={verificationError}
                autoFocus={true}
                resendCooldown={60}
              />

              <Form.Item>
                <Space
                  style={{ width: "100%", justifyContent: "space-between" }}
                >
                  <Button
                    onClick={() => {
                      setCodeSent(false);
                      setVerificationCode("");
                      setVerificationError(false);
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleVerifyAndChangeEmail}
                    disabled={verificationCode.length !== 6 || isVerifying}
                    loading={isVerifying}
                  >
                    Verify & Change Email
                  </Button>
                </Space>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </MyInfoStyle>
  );
};

export default MyInfo;

