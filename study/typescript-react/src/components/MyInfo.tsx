// src/components/MyInfo.tsx
import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Tag,
  Modal,
  Form,
  Input,
  Select,
  notification,
  Button,
  Space,
  Divider,
  Typography,
  Result,
  Skeleton,
  Tooltip,
  DatePicker,
} from "antd";
import dayjs from "dayjs";
import {
  EditOutlined,
  MailOutlined,
  KeyOutlined,
  ReloadOutlined,
  VerifiedOutlined,
  UserOutlined,
  DownOutlined,
  RightOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import {
  invalidateUserInfo,
  setAllUsers,
  setUserInfo,
  setRoles,
} from "../store/userSlice";
import { getAllRoles } from "../services/roleService";
import { getMyInfo, updateMyInfo } from "../services/userService";
import { handleServiceError } from "../services/baseService";
import {
  verifyEmailChange,
  requestEmailChangeCode,
  verifyPasswordChange,
} from "../services/authService";
import validateInput from "../utils/validateInput";
import { AxiosError } from "axios";
import { RootState } from "../types/RootStateTypes";
import { ExtendApiError } from "../types/ApiTypes";
import { User, Role } from "../types/UserTypes";
import VerificationCodeInput from "./VerificationCodeInput";
import styled from "styled-components";
import { COLORS } from "../utils/constant";
import LoadingState from "./LoadingState";
import TotpDeviceComponent from "./TotpDeviceComponent";

const { Option } = Select;
const { Text, Title } = Typography;

// Add this new function to calculate password strength
const calculatePasswordStrength = (
  password: string
): { strength: number; text: string; color: string } => {
  if (!password) return { strength: 0, text: "No password", color: "#ff4d4f" };

  let strength = 0;

  // Length check
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;

  // Character type checks
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/\d/.test(password)) strength += 1;
  if (/[!@#$%^&*()\-_=+{};:,<.>]/.test(password)) strength += 1;

  let text = "Weak";
  let color = "#ff4d4f"; // Red - danger

  if (strength >= 4) {
    text = "Moderate";
    color = "#faad14"; // Warning
  }

  if (strength >= 6) {
    text = "Strong";
    color = "#52c41a"; // Success
  }

  return { strength, text, color };
};

// Styled components
const MyInfoStyle = styled.div`
  background-color: transparent; /* White background */
  padding: 24px 0;
  min-height: 100vh;

  .page-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 16px;
  }

  .section-card {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.3),
      rgba(58, 123, 213, 0.5)
    );
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    margin-bottom: 24px;
    padding: 24px;
    position: relative;
    transition: all 0.3s ease;
  }

  .section-card:hover {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1),
      rgba(0, 105, 148, 0.6)
    );
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    border-bottom: 1px solid ${COLORS[11]};
    padding-bottom: 16px;
  }

  .section-title {
    font-size: 22px;
    font-weight: 600;
    margin: 0;
    color: ${COLORS[13]}; /* Black */
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .section-title .anticon {
    color: ${COLORS[12]};
  }

  .edit-button {
    color: ${COLORS[12]};
  }

  .info-item {
    padding: 16px 0;
    border-bottom: 1px solid ${COLORS[11]};
  }

  .info-item:last-child {
    border-bottom: none;
  }

  .info-label {
    font-size: 15px;
    font-weight: 500;
    color: ${COLORS[12]};
    margin-bottom: 8px;
  }

  .info-value {
    font-size: 16px;
    font-weight: 500;
    color: ${COLORS[13]}; /* Black */
  }

  /* Tags styling */
  .ant-tag {
    margin-right: 8px;
    margin-bottom: 8px;
    padding: 4px 10px;
    font-size: 14px;
    border-radius: 4px;
  }

  /* Section dividers */
  .section-divider {
    margin: 32px 0 24px;
    font-size: 18px;
    color: ${COLORS[9]}; /* Purple */
    font-weight: 500;
  }

  /* For permissions and tags containers */
  .tags-container {
    margin-top: 12px;
  }

  /* Modal adjustments */
  .ant-modal-body .ant-form-item {
    margin-bottom: 16px;
  }

  /* Email change link */
  .email-change-link {
    margin-left: 8px;
    color: ${COLORS[14]}; /* Blue */
  }

  /* Error state */
  .error-container {
    padding: 16px;
  }

  /* Skeleton styles */
  .skeleton-item {
    margin-bottom: 16px;
  }
`;

// Format date array to string
const formatDateDisplay = (
  date: string | number[] | null | undefined
): string => {
  if (Array.isArray(date)) {
    if (date.length < 3) return "Invalid date";
    return `${date[0]}-${String(date[1]).padStart(2, "0")}-${String(
      date[2]
    ).padStart(2, "0")}`;
  }
  return date || "Not specified";
};

// Sub-components
const PersonalInfoCard = ({ userInfo, onEdit }) => {
  const [expanded, setExpanded] = useState(true); // Start expanded by default

  if (!userInfo) return null;

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="section-card">
      <div
        className="section-header"
        style={{ cursor: "pointer" }}
        onClick={toggleExpand}
      >
        <Title level={4} className="section-title">
          <UserOutlined /> Personal Details{" "}
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="edit-button"
            size="large"
          />
        </Title>
        <Space>{expanded ? <DownOutlined /> : <RightOutlined />}</Space>
      </div>

      {expanded && (
        <div className="personal-info-content">
          <div className="info-item">
            <div className="info-label">First Name</div>
            <div className="info-value">
              {userInfo.firstname || "Not specified"}
            </div>
          </div>

          <div className="info-item">
            <div className="info-label">Last Name</div>
            <div className="info-value">
              {userInfo.lastname || "Not specified"}
            </div>
          </div>

          <div className="info-item">
            <div className="info-label">Username</div>
            <div className="info-value">{userInfo.username}</div>
          </div>

          <div className="info-item">
            <div className="info-label">Date of Birth</div>
            <div className="info-value">{formatDateDisplay(userInfo.dob)}</div>
          </div>

          <div className="info-item">
            <div className="info-label">Email</div>
            <div className="info-value">
              {userInfo.email || "Not specified"}
            </div>
          </div>

          <div className="info-item">
            <div className="info-label">Roles</div>
            <div className="tags-container">
              {userInfo.roles && userInfo.roles.length > 0 ? (
                <Space size={[0, 8]} wrap>
                  {userInfo.roles.map((role) => (
                    <Tag key={role.name} color={role.color}>
                      {role.name}
                    </Tag>
                  ))}
                </Space>
              ) : (
                <Text type="secondary">No roles assigned</Text>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PermissionsCard = ({ userInfo }) => {
  const uniquePermissions = useMemo(() => {
    if (!userInfo || !userInfo.roles || userInfo.roles.length === 0) return [];

    return [
      ...new Set(
        userInfo.roles.flatMap(
          (role) => role.permissions?.map((perm) => perm.name) || []
        )
      ),
    ]
      .map((permName) => {
        const perm = userInfo.roles
          .flatMap((role) => role.permissions || [])
          .find((p) => p && p.name === permName);
        return perm;
      })
      .filter(Boolean);
  }, [userInfo]);

  if (!userInfo) return null;

  return (
    <div className="section-card">
      <div className="section-header">
        <Title level={4} className="section-title">
          <VerifiedOutlined /> Permissions
        </Title>
      </div>

      <div className="tags-container">
        {uniquePermissions.length > 0 ? (
          <Space size={[8, 16]} wrap>
            {uniquePermissions.map((perm) => (
              <Tag key={perm.name} color={perm.color}>
                {perm.name}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">No permissions</Text>
        )}
      </div>
    </div>
  );
};

const LoadingCard = () => (
  <div className="section-card">
    <Skeleton active avatar paragraph={{ rows: 6 }} />
  </div>
);

const ErrorCard = ({ message, onRetry }) => (
  <div className="section-card error-container">
    <Result
      status="warning"
      title="Could not load your information"
      subTitle={
        message ||
        "Please try again or contact support if the problem persists."
      }
      extra={
        <Button type="primary" icon={<ReloadOutlined />} onClick={onRetry}>
          Try Again
        </Button>
      }
    />
  </div>
);

// Main component
interface MyInfoProps {
  onUpdateSuccess?: () => void;
}

const MyInfo: React.FC<MyInfoProps> = () => {
  // State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEmailChangeModalVisible, setIsEmailChangeModalVisible] =
    useState(false);
  const [isPasswordChangeModalVisible, setIsPasswordChangeModalVisible] =
    useState(false);
  const [form] = Form.useForm();
  const [emailChangeForm] = Form.useForm();
  const [passwordChangeForm] = Form.useForm();
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
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTotpVerification, setIsTotpVerification] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [dobValue, setDobValue] = useState<any>(null);

  // Redux
  const { token, loginSocial, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const {
    userInfo,
    roles,
    allUsers,
    isUserInfoInvalidated,
    isRolesInvalidated,
  } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();

  const fetchRoles = useCallback(async () => {
    if (!isRolesInvalidated && roles.length > 0) return;
    try {
      if (!token) {
        throw new Error("Token is null");
      }
      const response = await getAllRoles(token);
      if (response && Array.isArray(response.result)) {
        const allRolesData = response.result.map((role: Role) => ({
          name: role.name,
          description: role.description,
          color: role.color,
          permissions: role.permissions?.map((permission) => ({
            name: permission.name,
            description: permission.description,
            color: permission.color,
          })),
        }));
        dispatch(setRoles(allRolesData));
      } else {
        console.error("Response is not an array");
        dispatch(setRoles([]));
      }
    } catch (error) {
      handleServiceError(error);
      const axiosError = error as AxiosError<ExtendApiError>;
      console.error(
        "Error fetching all roles:",
        axiosError.response?.data?.message
      );
      dispatch(setRoles([]));
      setNotificationMessage({
        type: "error",
        message: "Fetch Failed",
        description: "Error fetching all roles. Please try again later.",
      });
    }
  }, [token, dispatch, isRolesInvalidated, roles]);
  // Effects and callbacks
  const openNotification = useCallback(
    (type: "success" | "error", message: string, description: string) => {
      api[type]({
        message,
        description,
      });
    },
    [api]
  );

  useEffect(() => {
    if (userInfo) {
      setIsLoadingUserInfo(false);
      setError(null);
    }
  }, [userInfo]);

  useEffect(() => {
    // Prevent infinite loading state
    const timer = setTimeout(() => {
      if (isLoadingUserInfo) {
        console.warn(
          "User info taking too long to load, resetting loading state"
        );
        setIsLoadingUserInfo(false);
        setError("User information took too long to load");
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [isLoadingUserInfo]);

  useEffect(() => {
    if (notificationMessage) {
      openNotification(
        notificationMessage.type,
        notificationMessage.message,
        notificationMessage.description
      );
      setNotificationMessage(null);
    }
  }, [notificationMessage, openNotification]);

  const fetchMyInfo = useCallback(async () => {
    if (!token || !isAuthenticated) return;

    // Only fetch if we don't have userInfo or if data is invalidated
    if (userInfo && !isUserInfoInvalidated) return;

    setIsLoadingUserInfo(true);
    setError(null);

    try {
      if (!token) throw new Error("Token is null");
      const response = await getMyInfo(token);
      if (response && response.result) {
        dispatch(setUserInfo(response.result));
      }
    } catch (error) {
      handleServiceError(error);
      const axiosError = error as AxiosError<ExtendApiError>;
      console.error(
        "Error fetching user info:",
        axiosError.response?.data?.message
      );
      setError(
        axiosError.response?.data?.message || "Error fetching user information"
      );
      setIsLoadingUserInfo(false);
    }
  }, [token, dispatch, isUserInfoInvalidated, isAuthenticated, userInfo]);

  useEffect(() => {
    if (token && isAuthenticated) {
      fetchMyInfo();
      fetchRoles();
    }
  }, [token, isAuthenticated, fetchMyInfo, fetchRoles]);
  const onUpdateSuccess = useCallback(() => {
    // Invalidate user info to trigger a refresh
    dispatch(invalidateUserInfo());
    // Fetch user info again to get updated TOTP status
    fetchMyInfo();
  }, [dispatch, fetchMyInfo]);

  // Event handlers
  const showModalUpdate = () => {
    if (userInfo) {
      setIsModalVisible(true);

      // Convert date string or array to dayjs object for DatePicker
      let dateValue = null;
      if (userInfo.dob) {
        if (Array.isArray(userInfo.dob)) {
          // If dob is an array [year, month, day]
          if (userInfo.dob.length >= 3) {
            // Create date string in YYYY-MM-DD format
            const dateStr = `${userInfo.dob[0]}-${String(
              userInfo.dob[1]
            ).padStart(2, "0")}-${String(userInfo.dob[2]).padStart(2, "0")}`;
            dateValue = dayjs(dateStr);
          }
        } else {
          // If dob is already a string
          dateValue = dayjs(userInfo.dob);
        }
      }

      // Set the state for the DatePicker
      setDobValue(dateValue);

      form.setFieldsValue({
        username: userInfo.username || "",
        password: "",
        firstname: userInfo.firstname || "",
        lastname: userInfo.lastname || "",
        dob: dobValue,
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
    setIsTotpVerification(userInfo?.totpSecurity?.enabled || false);
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

      // If TOTP is enabled, we skip sending email verification code
      if (userInfo?.totpSecurity?.enabled) {
        setIsTotpVerification(true);
        setCodeSent(true);
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

  const handleResendVerificationCode = async () => {
    try {
      const values = await emailChangeForm.validateFields([
        "newEmail",
        "currentPassword",
      ]);

      setIsRequestingCode(true);
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
    } finally {
      setIsRequestingCode(false);
    }
  };

  const handleVerifyAndChangeEmail = async () => {
    try {
      // Handle TOTP verification
      if (userInfo?.totpSecurity?.enabled && isTotpVerification) {
        if (!totpCode || totpCode.length !== 6) {
          setNotificationMessage({
            type: "error",
            message: "Invalid Code",
            description: "Please enter the 6-digit TOTP code",
          });
          return;
        }

        setIsVerifying(true);
        setVerificationError(false);

        // Add TOTP verification here
        // For now, we'll just simulate success
        const values = await emailChangeForm.validateFields();

        // Proceed with email change after TOTP verified
        try {
          // Call API to change email after TOTP verification
          await verifyEmailChange({
            userId: userInfo?.id || "",
            newEmail: values.newEmail,
            verificationCode: totpCode,
            token: token!,
            useTotp: userInfo?.totpSecurity?.enabled || false,
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
            // We keep isVerifying true for the LoadingState to show minimum time
            setTimeout(() => {
              setIsVerifying(false);
            }, 1000);
          }

          // Mark for refetch on next navigation (optional if direct update works)
          dispatch(invalidateUserInfo());

          setNotificationMessage({
            type: "success",
            message: "Email Updated",
            description: "Your email has been successfully updated.",
          });

          // Delay closing the modal to show success state
          setTimeout(() => {
            setIsEmailChangeModalVisible(false);
            if (onUpdateSuccess) onUpdateSuccess();
          }, 1000);
        } catch (error) {
          const axiosError = error as AxiosError<ExtendApiError>;
          setVerificationError(true);

          // Check for token invalidation errors
          if (
            axiosError.response?.status === 401 &&
            axiosError.response?.data?.message?.includes("Token")
          ) {
            setNotificationMessage({
              type: "error",
              message: "Verification Code Expired",
              description:
                "Your verification code has expired or been invalidated. Please request a new code.",
            });
            // Reset the verification state to allow requesting a new code
            setTimeout(() => {
              setCodeSent(false);
              setVerificationCode("");
              setTotpCode("");
            }, 2000);
          } else {
            setNotificationMessage({
              type: "error",
              message: "Verification Failed",
              description:
                axiosError.response?.data?.message || "Failed to verify code",
            });
          }
          setIsVerifying(false);
        }
      } else {
        // Original email code verification
        console.log("Using verification code:", verificationCode);

        const values = await emailChangeForm.validateFields();
        // Call API to verify code and change email
        await verifyEmailChange({
          userId: userInfo?.id || "",
          newEmail: values.newEmail,
          verificationCode,
          token: token!,
          useTotp: userInfo?.totpSecurity?.enabled || false,
        });

        console.log("Email successfully updated to:", values.newEmail);
      }
    } catch (error) {
      const axiosError = error as AxiosError<ExtendApiError>;
      setVerificationError(true);

      // Log the error response for debugging
      console.error("Error verifying email change:", axiosError.response?.data);
      setNotificationMessage({
        type: "error",
        message: "Verification Failed",
        description:
          axiosError.response?.data?.message || "Failed to verify code",
      });
    }
  };

  const showPasswordChangeModal = () => {
    setIsPasswordChangeModalVisible(true);
    passwordChangeForm.resetFields();
    setCodeSent(false);
    setVerificationCode("");
    setVerificationError(false);
    setIsTotpVerification(userInfo?.totpSecurity?.enabled || false);
  };

  const handleRequestPasswordVerificationCode = async () => {
    try {
      if (!token) {
        setNotificationMessage({
          type: "error",
          message: "Authentication Error",
          description: "You are not authenticated. Please log in again.",
        });
        return;
      }

      // If TOTP is enabled, we skip sending email verification code
      if (userInfo?.totpSecurity?.enabled) {
        setIsTotpVerification(true);
        setCodeSent(true);
        return;
      }

      const values = await passwordChangeForm.validateFields([
        "currentPassword",
        "newPassword",
        "confirmPassword",
      ]);

      if (values.newPassword !== values.confirmPassword) {
        passwordChangeForm.setFields([
          {
            name: "confirmPassword",
            errors: ["Passwords do not match"],
          },
        ]);
        return;
      }

      setIsRequestingCode(true);
      setVerificationError(false);

      // Call API to request verification code - this would need to be implemented in your backend
      // For now, we're simulating this with the email change code API
      await requestEmailChangeCode({
        userId: userInfo?.id || "",
        currentEmail: userInfo?.email || "",
        newEmail: userInfo?.email || "", // Using the same email, just for password change
        password: values.currentPassword,
        token,
      });

      setCodeSent(true);
      setNotificationMessage({
        type: "success",
        message: "Verification Code Sent",
        description: `A verification code has been sent to ${userInfo?.email}`,
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

  const handleResendPasswordVerificationCode = async () => {
    try {
      const values = await passwordChangeForm.validateFields([
        "currentPassword",
        "newPassword",
      ]);

      setIsRequestingCode(true);
      await requestEmailChangeCode({
        userId: userInfo?.id || "",
        currentEmail: userInfo?.email || "",
        newEmail: userInfo?.email || "", // Using the same email for password change
        password: values.currentPassword,
        token: token!,
      });

      setNotificationMessage({
        type: "success",
        message: "Verification Code Resent",
        description: `A new verification code has been sent to ${userInfo?.email}`,
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
    } finally {
      setIsRequestingCode(false);
    }
  };

  const handleVerifyAndChangePassword = async () => {
    try {
      // Handle TOTP verification
      if (userInfo?.totpSecurity?.enabled && isTotpVerification) {
        if (!totpCode || totpCode.length !== 6) {
          setNotificationMessage({
            type: "error",
            message: "Invalid Code",
            description: "Please enter the 6-digit TOTP code",
          });
          return;
        }

        setIsVerifying(true);
        setVerificationError(false);

        // Get form values for password change
        const values = await passwordChangeForm.validateFields();

        try {
          // Make actual API call to change password with TOTP verification
          await verifyPasswordChange({
            userId: userInfo?.id || "",
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
            verificationCode: totpCode,
            token: token!,
            useTotp: userInfo?.totpSecurity?.enabled || false,
          });

          setNotificationMessage({
            type: "success",
            message: "Password Updated",
            description: "Your password has been successfully updated.",
          });

          // Close modal and update info
          setTimeout(() => {
            setIsPasswordChangeModalVisible(false);
            if (onUpdateSuccess) onUpdateSuccess();
          }, 1000);
        } catch (error) {
          const axiosError = error as AxiosError<ExtendApiError>;
          setVerificationError(true);

          // Check for token invalidation errors
          if (
            axiosError.response?.status === 401 &&
            axiosError.response?.data?.message?.includes("Token")
          ) {
            setNotificationMessage({
              type: "error",
              message: "Verification Code Expired",
              description:
                "Your verification code has expired or been invalidated. Please request a new code.",
            });
            // Reset the verification state to allow requesting a new code
            setTimeout(() => {
              setCodeSent(false);
              setTotpCode("");
            }, 2000);
          } else {
            setNotificationMessage({
              type: "error",
              message: "Verification Failed",
              description:
                axiosError.response?.data?.message || "Failed to verify code",
            });
          }
          setIsVerifying(false);
        }
      } else {
        // Original email code verification
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

        // Get form values for password change
        const values = await passwordChangeForm.validateFields();

        try {
          // Make actual API call to verify code and change password
          await verifyPasswordChange({
            userId: userInfo?.id || "",
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
            verificationCode,
            token: token!,
            useTotp: userInfo?.totpSecurity?.enabled || false,
          });

          setNotificationMessage({
            type: "success",
            message: "Password Updated",
            description: "Your password has been successfully updated.",
          });

          // Close modal and update info
          setTimeout(() => {
            setIsPasswordChangeModalVisible(false);
            if (onUpdateSuccess) onUpdateSuccess();
          }, 1000);
        } catch (error) {
          const axiosError = error as AxiosError<ExtendApiError>;
          setVerificationError(true);

          // Check for token invalidation errors
          if (
            axiosError.response?.status === 401 &&
            axiosError.response?.data?.message?.includes("Token")
          ) {
            setNotificationMessage({
              type: "error",
              message: "Verification Code Expired",
              description:
                "Your verification code has expired or been invalidated. Please request a new code.",
            });
            // Reset the verification state to allow requesting a new code
            setTimeout(() => {
              setCodeSent(false);
              setVerificationCode("");
            }, 2000);
          } else {
            setNotificationMessage({
              type: "error",
              message: "Verification Failed",
              description:
                axiosError.response?.data?.message || "Failed to verify code",
            });
          }
        }
      }
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
      setTimeout(() => {
        setIsVerifying(false);
      }, 1000);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      // Check for current password
      if (!values.currentPassword) {
        setNotificationMessage({
          type: "error",
          message: "Password Required",
          description: "Current password is required to update profile.",
        });
        return;
      }

      setIsUpdatingInfo(true);

      // Format date of birth from DatePicker
      let formattedDob = null;
      if (dobValue && dayjs.isDayjs(dobValue)) {
        // Format as YYYY-MM-DD string or array based on API requirements
        // Using array format [year, month, day] to match the existing data structure
        const year = dobValue.year();
        const month = dobValue.month() + 1; // dayjs months are 0-indexed
        const day = dobValue.date();

        formattedDob = [year, month, day];
      }

      // Prepare data for update
      const updateValues = {
        ...values,
        // Don't send empty password
        password: values.password || undefined,
        // Use formatted date of birth
        dob: formattedDob,
      };

      if (!token) {
        throw new Error("Token is invalid");
      }

      const response = await updateMyInfo(
        userInfo?.id || "",
        updateValues,
        token
      );
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

      // Delay closing the modal to show success state
      setTimeout(() => {
        setIsModalVisible(false);
        // reset form after update
        form.resetFields();
        if (onUpdateSuccess) onUpdateSuccess();
        setIsUpdatingInfo(false);
      }, 1000);
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
      setIsUpdatingInfo(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setDobValue(null);
  };

  const handleEmailChangeCancel = () => {
    setIsEmailChangeModalVisible(false);
  };

  const handlePasswordChangeCancel = () => {
    setIsPasswordChangeModalVisible(false);
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

  // Render component
  const renderContent = () => {
    if (isLoadingUserInfo) {
      return (
        <>
          <LoadingCard />
        </>
      );
    }

    if (error) {
      return <ErrorCard message={error} onRetry={fetchMyInfo} />;
    }

    if (!userInfo) {
      return (
        <ErrorCard
          message="User information not available"
          onRetry={fetchMyInfo}
        />
      );
    }

    return (
      <>
        <PersonalInfoCard userInfo={userInfo} onEdit={showModalUpdate} />
        <PermissionsCard userInfo={userInfo} />
        <TotpDeviceComponent onUpdate={onUpdateSuccess} />
      </>
    );
  };

  return (
    <MyInfoStyle>
      {contextHolder}

      {/* Loading states */}
      {isUpdatingInfo && (
        <LoadingState tip="Updating your information..." fullscreen={true} />
      )}

      {isRequestingCode && (
        <LoadingState tip="Sending verification code..." fullscreen={true} />
      )}

      {isVerifying && (
        <LoadingState tip="Verifying and updating email..." fullscreen={true} />
      )}

      <div className="page-container">{renderContent()}</div>

      {/* Main profile edit modal */}
      <Modal
        title="Edit My Information"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okButtonProps={{ loading: isUpdatingInfo, disabled: isUpdatingInfo }}
        cancelButtonProps={{ disabled: isUpdatingInfo }}
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
            name="currentPassword"
            label="Current Password"
            rules={[
              {
                required: true,
                message: "Please input your current password!",
              },
            ]}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <Input.Password
                placeholder="Enter your current password"
                style={{ flex: 1 }}
              />
              {!loginSocial && (
                <Button
                  type="link"
                  icon={<KeyOutlined />}
                  onClick={() => {
                    setIsModalVisible(false);
                    showPasswordChangeModal();
                  }}
                  style={{ marginLeft: "8px" }}
                >
                  Change
                </Button>
              )}
            </div>
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: "Please input the email!" }]}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <Input
                disabled
                value={userInfo?.email || ""}
                style={{ flex: 1 }}
              />
              {!loginSocial && (
                <Button
                  type="link"
                  icon={<MailOutlined />}
                  onClick={() => {
                    setIsModalVisible(false);
                    showEmailChangeModal();
                  }}
                  style={{ marginLeft: "8px" }}
                >
                  Change
                </Button>
              )}
            </div>
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
            label="Date of Birth"
            rules={[
              { required: true, message: "Please select your date of birth!" },
            ]}
          >
            <DatePicker
              style={{ width: "100%" }}
              placeholder="Select date of birth"
              format="YYYY-MM-DD"
              value={dobValue}
              onChange={(date) => {
                setDobValue(date);
                form.setFieldsValue({ dob: date });
              }}
            />
          </Form.Item>
          <Form.Item
            name="roles"
            label="Role"
            rules={[{ required: true, message: "Please select the role!" }]}
          >
            <Select
              mode="multiple"
              placeholder="Select roles"
              disabled={
                userInfo
                  ? userInfo.roles.some((role) => role.name === "USER") &&
                    !userInfo.roles.some((role) =>
                      ["ADMIN", "MANAGER"].includes(role.name)
                    )
                  : true
              }
            >
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
        maskClosable={!isRequestingCode && !isVerifying}
        closable={!isRequestingCode && !isVerifying}
      >
        <Form form={emailChangeForm} layout="vertical" name="emailChangeForm">
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
              disabled={codeSent || isRequestingCode || isVerifying}
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
              disabled={codeSent || isRequestingCode || isVerifying}
              prefix={<KeyOutlined />}
            />
          </Form.Item>

          {!codeSent ? (
            <Form.Item>
              <Button
                type="primary"
                onClick={handleRequestVerificationCode}
                loading={isRequestingCode}
                disabled={isRequestingCode}
                block
              >
                {userInfo?.totpSecurity?.enabled
                  ? "Continue with TOTP Verification"
                  : "Request Verification Code"}
              </Button>
            </Form.Item>
          ) : (
            <>
              <Divider />

              {isTotpVerification ? (
                // TOTP verification UI
                <>
                  <div style={{ marginBottom: "16px" }}>
                    <Typography.Title level={5}>
                      TOTP Verification
                    </Typography.Title>
                    <Typography.Text>
                      Enter the 6-digit code from your authenticator app
                    </Typography.Text>
                  </div>

                  <Form.Item
                    name="totpCode"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your TOTP code",
                      },
                      { len: 6, message: "TOTP code must be 6 digits" },
                    ]}
                  >
                    <Input
                      placeholder="Enter 6-digit TOTP code"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      disabled={isVerifying}
                      style={{ width: "100%", marginBottom: "16px" }}
                      autoFocus
                    />
                  </Form.Item>
                </>
              ) : (
                // Email OTP verification UI
                <VerificationCodeInput
                  value={verificationCode}
                  onChange={setVerificationCode}
                  onResendCode={handleResendVerificationCode}
                  isSubmitting={isVerifying}
                  isError={verificationError}
                  autoFocus={true}
                  resendCooldown={60}
                />
              )}

              <Form.Item>
                <Space
                  style={{ width: "100%", justifyContent: "space-between" }}
                >
                  <Button
                    onClick={() => {
                      setCodeSent(false);
                      setVerificationCode("");
                      setTotpCode("");
                      setVerificationError(false);
                    }}
                    disabled={isVerifying || isRequestingCode}
                  >
                    Back
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleVerifyAndChangeEmail}
                    disabled={
                      (isTotpVerification
                        ? totpCode.length !== 6
                        : verificationCode.length !== 6) ||
                      isVerifying ||
                      isRequestingCode
                    }
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

      {/* Password change modal */}
      <Modal
        title="Change Password"
        open={isPasswordChangeModalVisible}
        onCancel={handlePasswordChangeCancel}
        footer={null}
        maskClosable={!isRequestingCode && !isVerifying}
        closable={!isRequestingCode && !isVerifying}
      >
        <Form
          form={passwordChangeForm}
          layout="vertical"
          name="passwordChangeForm"
        >
          <Form.Item
            name="currentPassword"
            label="Current Password"
            rules={[
              { required: true, message: "Please enter your current password" },
            ]}
          >
            <Input.Password
              placeholder="Enter your current password"
              disabled={codeSent || isRequestingCode || isVerifying}
              prefix={<KeyOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label={
              <span>
                New Password
                <Tooltip
                  title={
                    <div>
                      <p>Password must contain:</p>
                      <ul style={{ paddingLeft: "20px", margin: "5px 0" }}>
                        <li>At least 8 characters</li>
                        <li>At least one uppercase letter (A-Z)</li>
                        <li>At least one lowercase letter (a-z)</li>
                        <li>At least one number (0-9)</li>
                        <li>At least one special character</li>
                      </ul>
                    </div>
                  }
                >
                  <span style={{ marginLeft: "4px" }}>
                    <QuestionCircleOutlined />
                  </span>
                </Tooltip>
              </span>
            }
            rules={[
              { required: true, message: "Please enter your new password" },
              { min: 8, message: "Password must be at least 8 characters" },
              {
                pattern:
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>])[A-Za-z\d!@#$%^&*()\-_=+{};:,<.>]{8,}$/,
                message:
                  "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
              },
            ]}
            hasFeedback
          >
            <div className="password-input-container">
              <Input.Password
                placeholder="Enter your new password"
                disabled={codeSent || isRequestingCode || isVerifying}
                prefix={<KeyOutlined />}
                onChange={() => {
                  passwordChangeForm.validateFields(["newPassword"]);

                  // Also update confirmPassword validation if it has a value
                  if (passwordChangeForm.getFieldValue("confirmPassword")) {
                    passwordChangeForm.validateFields(["confirmPassword"]);
                  }
                }}
              />
              {isPasswordChangeModalVisible &&
                passwordChangeForm.getFieldValue("newPassword") && (
                  <div
                    className="strength-bar"
                    style={{ display: "flex", marginBottom: "4px" }}
                  >
                    {[1, 2, 3, 4, 5, 6].map((i) => {
                      const { strength, color } = calculatePasswordStrength(
                        passwordChangeForm.getFieldValue("newPassword")
                      );
                      return (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            height: "4px",
                            backgroundColor: i <= strength ? color : "#f0f0f0",
                            marginRight: i < 6 ? "2px" : 0,
                            borderRadius: "2px",
                          }}
                        />
                      );
                    })}
                  </div>
                )}
            </div>
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            dependencies={["newPassword"]}
            hasFeedback
            rules={[
              { required: true, message: "Please confirm your new password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("The two passwords do not match")
                  );
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="Confirm your new password"
              disabled={codeSent || isRequestingCode || isVerifying}
              prefix={<KeyOutlined />}
            />
          </Form.Item>

          {!codeSent ? (
            <Form.Item>
              <Button
                type="primary"
                onClick={handleRequestPasswordVerificationCode}
                loading={isRequestingCode}
                disabled={isRequestingCode}
                block
              >
                {userInfo?.totpSecurity?.enabled
                  ? "Continue with TOTP Verification"
                  : "Request Verification Code"}
              </Button>
            </Form.Item>
          ) : (
            <>
              <Divider />

              {isTotpVerification ? (
                // TOTP verification UI
                <>
                  <div style={{ marginBottom: "16px" }}>
                    <Typography.Title level={5}>
                      TOTP Verification
                    </Typography.Title>
                    <Typography.Text>
                      Enter the 6-digit code from your authenticator app
                    </Typography.Text>
                  </div>

                  <Form.Item
                    name="totpCode"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your TOTP code",
                      },
                      { len: 6, message: "TOTP code must be 6 digits" },
                    ]}
                  >
                    <Input
                      placeholder="Enter 6-digit TOTP code"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      disabled={isVerifying}
                      style={{ width: "100%", marginBottom: "16px" }}
                      autoFocus
                    />
                  </Form.Item>
                </>
              ) : (
                // Email OTP verification UI
                <VerificationCodeInput
                  value={verificationCode}
                  onChange={setVerificationCode}
                  onResendCode={handleResendPasswordVerificationCode}
                  isSubmitting={isVerifying}
                  isError={verificationError}
                  autoFocus={true}
                  resendCooldown={60}
                />
              )}

              <Form.Item>
                <Space
                  style={{ width: "100%", justifyContent: "space-between" }}
                >
                  <Button
                    onClick={() => {
                      setCodeSent(false);
                      setVerificationCode("");
                      setTotpCode("");
                      setVerificationError(false);
                    }}
                    disabled={isVerifying || isRequestingCode}
                  >
                    Back
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleVerifyAndChangePassword}
                    disabled={
                      (isTotpVerification
                        ? totpCode.length !== 6
                        : verificationCode.length !== 6) ||
                      isVerifying ||
                      isRequestingCode
                    }
                    loading={isVerifying}
                  >
                    Verify & Change Password
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

