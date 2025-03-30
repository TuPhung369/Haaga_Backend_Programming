// TotpDeviceComponent.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  Button,
  Typography,
  List,
  Space,
  Modal,
  Tag,
  Empty,
  Divider,
  Alert,
  notification,
  Input,
  Form
} from "antd";
import {
  SecurityScanOutlined,
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  MobileOutlined,
  ClockCircleOutlined,
  RightOutlined,
  DownOutlined,
  QuestionCircleOutlined,
  KeyOutlined,
  MailOutlined
} from "@ant-design/icons";
import {
  getTotpDevices,
  deactivateTotpDevice,
  regenerateBackupCodes,
  requestAdminReset,
  TotpDeviceResponse
} from "../services/totpService";
import { useSelector } from "react-redux";
import { RootState } from "../type/types";
import { handleServiceError } from "../services/baseService";
import TotpSetupComponent from "./TotpSetupComponent";
import moment from "moment";
import { COLORS } from "../utils/constant";
import LoadingState from "./LoadingState";
import styled from "styled-components";
import VerificationCodeInput from "./VerificationCodeInput";

const { Text, Paragraph, Title } = Typography;

const StyledCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.3),
    rgba(58, 123, 213, 0.5)
  );
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1),
      rgba(0, 105, 148, 0.6)
    );
    box-shadow: 0 6px 6px rgba(0, 0, 0, 0.15);
  }

  .ant-card-body {
    padding: 24px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #e8e8e8;
    margin-bottom: 16px;
    cursor: pointer; /* Add cursor pointer for collapsible header */
  }

  .section-title {
    display: flex;
    align-items: center;
    font-size: 20px;
    font-weight: 600;
    color: ${COLORS[13]};

    .anticon {
      margin-right: 8px;
    }

    .ant-tag {
      margin-left: 8px;
      font-size: 12px;
      padding: 2px 8px;
    }
  }

  .action-buttons {
    margin-bottom: 24px;
    display: flex; /* Use flexbox for better alignment */
    flex-wrap: wrap; /* Allow buttons to wrap on smaller screens */
    gap: 12px; /* Add gap between buttons */

    .ant-btn {
      /* margin-right: 12px; Remove fixed margin, use gap */
      border-radius: 4px;
      font-weight: 500;
    }

    .ant-btn-primary {
      background: ${COLORS[3]};
      border-color: ${COLORS[3]};
      color: ${COLORS[13]}; /* Ensure text is visible */
    }
  }

  .device-list .ant-list-item {
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
    transition: background 0.3s;

    &:hover {
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.1),
        rgba(0, 105, 148, 0.6)
      );
    }

    .ant-list-item-meta-title {
      font-size: 16px;
      font-weight: 500;
      color: ${COLORS[13]};
    }

    .ant-list-item-meta-description {
      font-size: 14px;
      color: ${COLORS[12]};
    }

    .ant-btn-danger {
      background: ${COLORS[3]};
      border-color: ${COLORS[13]};
      color: ${COLORS[12]};
    }
  }

  .empty-state {
    padding: 32px 0;
    text-align: center;
    color: ${COLORS[12]};
  }
`;
const DeviceCard = styled.div`
  background: linear-gradient(
    135deg,
    rgba(0, 30, 60, 0.9),
    rgba(0, 60, 90, 0.7)
  );
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2), 0 0 8px rgba(0, 123, 255, 0.3);
  padding: 24px;
  margin: 16px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3), 0 0 12px rgba(0, 123, 255, 0.5);
  }

  .device-icon {
    font-size: 48px;
    color: #e0e0e0;
    margin-right: 24px;
    filter: drop-shadow(0 0 4px rgba(0, 123, 255, 0.5));
  }

  .device-info {
    flex: 1;
    color: #ffffff;
  }

  .device-title {
    font-size: 24px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 8px;
    font-family: "Arial", sans-serif;
  }

  .device-details {
    font-size: 14px;
    color: #b0b0b0;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .action-button {
    background: #ff4444;
    border: none;
    color: #ffffff;
    border-radius: 8px;
    padding: 8px 16px;
    font-weight: 500;
    transition: background 0.3s ease, transform 0.3s ease;

    &:hover {
      background: #ff6666;
      transform: scale(1.05);
      color: #073a60 !important;
      font-weight: 600;
    }

    &:active {
      transform: scale(0.95);
    }
  }
`;
interface TotpDeviceComponentProps {
  onUpdate?: () => void;
  totpSecurity?: {
    enabled: boolean;
    deviceName?: string;
    enabledDate?: string;
  };
}

const TotpDeviceComponent: React.FC<TotpDeviceComponentProps> = ({
  onUpdate
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [devices, setDevices] = useState<TotpDeviceResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState<boolean>(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState<boolean>(false);
  const [regeneratingCodes, setRegeneratingCodes] = useState<boolean>(false);
  const [deletingDevice, setDeletingDevice] = useState<string | null>(null);

  const [showDeleteVerification, setShowDeleteVerification] =
    useState<boolean>(false);
  const [showRegenerateVerification, setShowRegenerateVerification] =
    useState<boolean>(false);
  const [showAdminResetModal, setShowAdminResetModal] =
    useState<boolean>(false);
  const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [verificationError, setVerificationError] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [adminResetEmail, setAdminResetEmail] = useState<string>("");
  const [isRequestingReset, setIsRequestingReset] = useState<boolean>(false);
  const verificationInputRef = useRef<HTMLInputElement>(null);
  // const dispatch = useDispatch();

  const { token } = useSelector((state: RootState) => state.auth);
  const { userInfo, isUserInfoInvalidated } = useSelector(
    (state: RootState) => state.user
  );

  const prevTotpEnabledRef = useRef<boolean | undefined>();
  const [isTotpEnabled, setIsTotpEnabled] = useState<boolean>(
    userInfo?.totpSecurity?.enabled || false
  );

  // --- Fetch Function ---
  const fetchDevices = useCallback(async () => {
    if (!token) return false;
    setLoading(true);
    setError(null);
    let success = false;
    try {
      console.log("TOTPDeviceComponent: Executing fetchDevices API call...");
      const devicesResponse = await getTotpDevices(token);
      setDevices(devicesResponse.result || []);
      success = true;
    } catch (error) {
      handleServiceError(error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch TOTP devices";
      setError(errorMessage);
      console.error("Fetch devices error:", error);
      success = false;
    } finally {
      setLoading(false);
    }
    return success;
  }, [token]);

  // --- Effect to Sync Local State with Redux ---
  useEffect(() => {
    const currentIsEnabled = userInfo?.totpSecurity?.enabled || false;
    if (currentIsEnabled !== isTotpEnabled) {
      setIsTotpEnabled(currentIsEnabled);
    }
  }, [userInfo?.totpSecurity?.enabled, isTotpEnabled]);

  // --- Effect for Fetching Logic ---
  useEffect(() => {
    const previousIsEnabled = prevTotpEnabledRef.current;
    const justInvalidated = isUserInfoInvalidated;

    if (!isTotpEnabled) {
      // Clear state only if necessary when disabled
      if (devices.length > 0 || loading || error) {
        setDevices([]);
        setLoading(false);
        setError(null);
      }
      prevTotpEnabledRef.current = false;
      return;
    }

    // Determine if a fetch is needed: ONLY if state changed from false->true OR explicitly invalidated.
    const needsFetch =
      (previousIsEnabled === false && isTotpEnabled === true) ||
      justInvalidated;

    if (needsFetch) {
      fetchDevices();
    } else {
      if (loading) {
        setLoading(false);
      } // Ensure loading indicator is off
    }

    // Update ref for the next render cycle
    prevTotpEnabledRef.current = isTotpEnabled;
  }, [
    isTotpEnabled,
    isUserInfoInvalidated,
    fetchDevices,
    devices.length,
    loading,
    error
  ]);

  // --- Handlers --- (Keep the implementations from the previous version)
  const handleAddDevice = () => setShowSetup(true);

  const focusVerificationInput = useCallback(() => {
    // Try focusing after a short delay to allow modal rendering
    setTimeout(() => {
      // Method 1: Use the ref
      if (verificationInputRef.current) {
        verificationInputRef.current.focus();
        return;
      }
      // Method 2: Query selector for the first input in the specific container
      const firstInput = document.querySelector(
        ".verification-code-container .code-input" // Target input within the VerificationCodeInput component
      );
      if (firstInput instanceof HTMLInputElement) {
        firstInput.focus();
        return;
      }
      // Method 3: Try to find any visible input within the active modal as a fallback
      const modalInput = document.querySelector(
        '.ant-modal-wrap:not(.ant-modal-hidden) input:not([type="hidden"])' // More specific selector for visible input in active modal
      );
      if (modalInput instanceof HTMLInputElement) {
        modalInput.focus();
      }
    }, 150); // Delay allows modal transition to complete before focusing
  }, []);

  const handleDeleteDevice = (deviceId: string) => {
    setDeviceToDelete(deviceId);
    setVerificationCode("");
    setVerificationError(false);
    setShowDeleteVerification(true);
  };

  const handleVerifyAndDeleteDevice = async () => {
    if (!token || !deviceToDelete) return;
    setIsVerifying(true);
    setVerificationError(false);
    setDeletingDevice(deviceToDelete);
    try {
      await deactivateTotpDevice(deviceToDelete, verificationCode, token);
      setDevices(devices.filter((device) => device.id !== deviceToDelete)); // Update local state on success
      notification.success({
        message: "Device Removed",
        description: "2FA device removed successfully."
      });
      setShowDeleteVerification(false);
      if (onUpdate) onUpdate(); // Signal parent
    } catch (error) {
      handleServiceError(error);
      setVerificationError(true);
      notification.error({
        message: "Verification Failed",
        description: "Invalid verification code or an error occurred."
      });
    } finally {
      setIsVerifying(false);
      setDeletingDevice(null);
      setDeviceToDelete(null);
    }
  };
  const handleRegenerateBackupCodes = () => {
    /* ... set state, show modal ... */
    setVerificationCode("");
    setVerificationError(false);
    setShowRegenerateVerification(true);
  };
  const handleOpenAdminResetModal = () => {
    /* ... set state, show modal ... */
    setAdminResetEmail("");
    setShowAdminResetModal(true);
    focusVerificationInput();
  };
  const handleVerifyAndRegenerateCodes = async () => {
    /* ... same verification and API call logic ... */
    if (!token) return;
    setIsVerifying(true);
    setVerificationError(false);
    setRegeneratingCodes(true);
    try {
      const response = await regenerateBackupCodes(verificationCode, token);
      setBackupCodes(response.result);
      setShowRegenerateVerification(false);
      setShowBackupCodes(true);
      notification.success({
        message: "Codes Regenerated",
        description: "New backup codes generated. Save them securely."
      });
    } catch (error) {
      handleServiceError(error);
      setVerificationError(true);
      notification.error({
        message: "Verification Failed",
        description: "Invalid verification code or an error occurred."
      });
    } finally {
      setIsVerifying(false);
      setRegeneratingCodes(false);
    }
  };
  const handleRequestAdminReset = async () => {
    /* ... same verification and API call logic ... */
    if (!userInfo?.username || !adminResetEmail) return;
    setIsRequestingReset(true);
    try {
      if (!token) {
        notification.error({
          message: "Error",
          description: "Authentication token not found."
        });
        setIsRequestingReset(false);
        return;
      }
      await requestAdminReset(userInfo.username, adminResetEmail, token);
      setShowAdminResetModal(false);
      notification.success({
        message: "Reset Request Submitted",
        description:
          "An administrator will review your request and contact you via email."
      });
    } catch (error) {
      handleServiceError(error);
      notification.error({
        message: "Request Failed",
        description: "Failed to submit reset request. Please try again."
      });
    } finally {
      setIsRequestingReset(false);
    }
  };
  const handleSetupComplete = () => {
    setShowSetup(false);
    if (onUpdate) onUpdate();
  };
  const toggleExpand = () => setExpanded(!expanded);
  const formatDate = (
    dateInput: string | number[] | undefined | null
  ): string => {
    /* ... same safe formatting logic ... */
    if (Array.isArray(dateInput)) {
      if (dateInput.length < 3) return "Invalid Date";
      const [year, month, day, hour = 0, minute = 0, second = 0, ms = 0] =
        dateInput;
      try {
        const numericMs = Number(String(ms).slice(0, 3));
        const date = new Date(
          Date.UTC(
            year,
            month - 1,
            day,
            hour,
            minute,
            second,
            isNaN(numericMs) ? 0 : numericMs
          )
        );
        if (isNaN(date.getTime())) return "Invalid Date";
        return moment(date).format("MMM DD, YYYY");
      } catch (e) {
        console.error("Error parsing date array:", e);
        return "Invalid Date";
      }
    } else if (dateInput) {
      const date = moment(dateInput);
      return date.isValid() ? date.format("MMM DD, YYYY") : "Invalid Date";
    }
    return "N/A";
  };

  // --- Render Functions (Modals - RESTORED) ---
  const renderBackupCodesModal = () => (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <SafetyCertificateOutlined
            style={{ marginRight: 8, color: "#52c41a" }}
          />
          Backup Codes
        </div>
      }
      open={showBackupCodes} // Use state variable
      onCancel={() => setShowBackupCodes(false)}
      footer={[
        <Button key="close" onClick={() => setShowBackupCodes(false)}>
          Close
        </Button>
      ]}
      width={400}
      destroyOnClose
    >
      <Alert
        message="Secure Your Codes"
        description="Use these one-time codes if you lose access to your authenticator."
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <div style={{ maxHeight: "250px", overflow: "auto", marginBottom: 16 }}>
        <List // Use List component
          grid={{ gutter: 12, column: 2 }}
          dataSource={backupCodes} // Use state variable
          renderItem={(code) => (
            <List.Item>
              <Card size="small" style={{ borderRadius: 4 }}>
                <Text // Use Text component
                  copyable={{ tooltips: ["Copy", "Copied!"] }}
                  style={{ fontSize: 14 }}
                >
                  {code}
                </Text>
              </Card>
            </List.Item>
          )}
        />
      </div>
      <Paragraph>
        <Text strong type="danger">
          Save these codes securely. They won't be shown again.
        </Text>
      </Paragraph>
    </Modal>
  );

  const renderDeleteVerificationModal = () => (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <KeyOutlined style={{ marginRight: 8, color: "#faad14" }} />
          Verify Identity
        </div>
      }
      open={showDeleteVerification} // Use state variable
      onCancel={() => setShowDeleteVerification(false)}
      footer={[
        <Button
          key="cancel"
          onClick={() => setShowDeleteVerification(false)}
          disabled={isVerifying}
        >
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          danger
          onClick={handleVerifyAndDeleteDevice}
          loading={isVerifying}
          disabled={verificationCode.length !== 6 || isVerifying}
        >
          Verify & Remove Device
        </Button>
      ]}
      width={400}
      destroyOnClose
      afterOpenChange={(visible) => {
        if (visible) focusVerificationInput();
      }}
    >
      <Alert
        message="Verification Required"
        description="Enter your current 2FA code (or a backup code) to remove this device."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <VerificationCodeInput // Use VerificationCodeInput
        value={verificationCode}
        onChange={setVerificationCode}
        isError={verificationError}
        isSubmitting={isVerifying}
        autoFocus={true}
        onResendCode={undefined}
        inputRef={verificationInputRef}
      />
      <Divider />
      <Paragraph style={{ textAlign: "center" }}>
        <Button
          type="link"
          icon={<QuestionCircleOutlined />}
          onClick={() => {
            setShowDeleteVerification(false);
            handleOpenAdminResetModal();
          }}
          disabled={isVerifying}
        >
          Lost access to authenticator and backup codes?
        </Button>
      </Paragraph>
    </Modal>
  );

  const renderRegenerateVerificationModal = () => (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <KeyOutlined style={{ marginRight: 8, color: "#faad14" }} />
          Verify Identity
        </div>
      }
      open={showRegenerateVerification} // Use state variable
      onCancel={() => setShowRegenerateVerification(false)}
      footer={[
        <Button
          key="cancel"
          onClick={() => setShowRegenerateVerification(false)}
          disabled={isVerifying}
        >
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleVerifyAndRegenerateCodes}
          loading={isVerifying}
          disabled={verificationCode.length !== 6 || isVerifying}
        >
          Verify & Regenerate Codes
        </Button>
      ]}
      width={400}
      destroyOnClose
      afterOpenChange={(visible) => {
        if (visible) {
          setVerificationCode("");
          setVerificationError(false);
          focusVerificationInput();
        }
      }}
    >
      <Alert
        message="Verification Required"
        description="Enter your current 2FA code (or a backup code) to generate new backup codes."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <VerificationCodeInput
        value={verificationCode}
        onChange={setVerificationCode}
        isError={verificationError}
        isSubmitting={isVerifying}
        autoFocus={true}
        onResendCode={undefined}
        inputRef={verificationInputRef}
      />
      <Divider />
      <Paragraph style={{ textAlign: "center" }}>
        <Button
          type="link"
          icon={<QuestionCircleOutlined />}
          onClick={() => {
            setShowRegenerateVerification(false);
            handleOpenAdminResetModal();
          }}
          disabled={isVerifying}
        >
          Lost access to authenticator and backup codes?
        </Button>
      </Paragraph>
    </Modal>
  );

  const renderAdminResetModal = () => (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <MailOutlined style={{ marginRight: 8, color: "#1890ff" }} />
          Request Admin Assistance
        </div>
      }
      open={showAdminResetModal} // Use state variable
      onCancel={() => setShowAdminResetModal(false)}
      footer={[
        <Button
          key="cancel"
          onClick={() => setShowAdminResetModal(false)}
          disabled={isRequestingReset}
        >
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleRequestAdminReset}
          loading={isRequestingReset}
          disabled={!adminResetEmail || isRequestingReset}
        >
          Submit Request
        </Button>
      ]}
      width={400}
      destroyOnClose
      afterOpenChange={(visible) => {
        if (visible) {
          setAdminResetEmail("");
          setTimeout(() => {
            const emailInput = document.querySelector(
              '.ant-modal-wrap:not(.ant-modal-hidden) input[type="email"]'
            );
            if (emailInput instanceof HTMLInputElement) emailInput.focus();
          }, 150);
        }
      }}
    >
      <Alert
        message="Admin Assistance Required"
        description="If you've lost access to both your authenticator app and backup codes, an administrator can help reset your 2FA."
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Form // Use Form
        layout="vertical"
        onFinish={handleRequestAdminReset}
      >
        <Form.Item // Use Form.Item
          label="Confirm Email Address"
          name="adminResetEmail"
          required
          rules={[
            { required: true, message: "Please enter your email address" },
            { type: "email", message: "Please enter a valid email address" }
          ]}
          help="Provide your account's email for verification."
        >
          <Input // Use Input
            value={adminResetEmail}
            onChange={(e) => setAdminResetEmail(e.target.value)}
            placeholder="Enter your account email"
            type="email"
          />
        </Form.Item>
      </Form>
      <Paragraph style={{ marginTop: 16 }}>
        <Text type="secondary">
          Note: An administrator will verify your identity before resetting your
          2FA. This may take some time.
        </Text>
      </Paragraph>
    </Modal>
  );

  // --- Main Return ---
  const currentDevice = devices[0] || userInfo?.totpSecurity;

  if (showSetup) {
    return (
      <TotpSetupComponent
        onSetupComplete={handleSetupComplete}
        onCancel={() => setShowSetup(false)}
      />
    );
  }

  return (
    <StyledCard>
      {/* Render modals */}
      {renderBackupCodesModal()}
      {renderDeleteVerificationModal()}
      {renderRegenerateVerificationModal()}
      {renderAdminResetModal()}

      <div className="section-header" onClick={toggleExpand}>
        <Title level={4} className="section-title" style={{ margin: 0 }}>
          <SecurityScanOutlined /> Two-Factor Authentication (2FA)
          {isTotpEnabled && <Tag color="success">Enabled</Tag>}
        </Title>
        {expanded ? <DownOutlined /> : <RightOutlined />}
      </div>

      {expanded && (
        <>
          {/* Show loading indicator only when actively fetching */}
          {loading ? (
            <LoadingState tip="Loading 2FA settings..." fullscreen={false} />
          ) : (
            <>
              {error /* Display fetch error if any */ && (
                <Alert
                  message="Error Loading 2FA Details"
                  description={error}
                  type="error"
                  showIcon
                  style={{ marginBottom: 16 }}
                  closable
                  onClose={() => setError(null)}
                />
              )}

              <Paragraph
                style={{ fontSize: 14, color: COLORS[12], marginBottom: 24 }}
              >
                Increase security with a second verification step using an
                authenticator app. Only one device can be active at a time.
              </Paragraph>

              <Space className="action-buttons">
                {isTotpEnabled && (
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRegenerateBackupCodes}
                    loading={regeneratingCodes}
                  >
                    Regenerate Backup Codes
                  </Button>
                )}
                {!isTotpEnabled && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddDevice}
                  >
                    Activate 2FA / Add Device
                  </Button>
                )}
                {isTotpEnabled && (
                  <Button
                    type="dashed"
                    icon={<QuestionCircleOutlined />}
                    onClick={handleOpenAdminResetModal}
                  >
                    Lost Access Help
                  </Button>
                )}
              </Space>

              <Divider />

              {/* Display logic based on isTotpEnabled and if device data exists */}
              {isTotpEnabled && currentDevice ? (
                <DeviceCard>
                  <MobileOutlined className="device-icon" />
                  <div className="device-info">
                    <div className="device-title">
                      {currentDevice.deviceName || "Registered Device"}
                    </div>
                    <div className="device-details">
                      <Space size="middle">
                        <span>
                          <ClockCircleOutlined /> Activated:{" "}
                          {formatDate(currentDevice.createdAt)}
                        </span>
                        <Tag
                          color={currentDevice.enabled ? "success" : "error"}
                        >
                          {currentDevice.enabled ? "Active" : "Inactive"}
                        </Tag>
                      </Space>
                    </div>
                  </div>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteDevice(currentDevice.id)}
                    loading={deletingDevice === currentDevice.id}
                    className="action-button"
                    size="small"
                  >
                    Remove
                  </Button>
                </DeviceCard>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  className="empty-state"
                  description={
                    <span style={{ color: COLORS[12] }}>
                      2FA is not currently active.{" "}
                      <Button
                        type="link"
                        onClick={handleAddDevice}
                        style={{ padding: 0, color: COLORS[2] }}
                      >
                        Activate Now
                      </Button>
                    </span>
                  }
                />
              )}
            </>
          )}
        </>
      )}
    </StyledCard>
  );
};

export default TotpDeviceComponent;
