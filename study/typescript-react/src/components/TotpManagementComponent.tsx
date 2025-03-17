// TotpManagementComponent.tsx
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
import LoadingState from "./LoadingState";
import styled from "styled-components";
import VerificationCodeInput from "./VerificationCodeInput";

const { Text, Paragraph, Title } = Typography;

const StyledCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%);
  transition: all 0.3s ease;

  &:hover {
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
  }

  .section-title {
    display: flex;
    align-items: center;
    font-size: 20px;
    font-weight: 600;
    color: #1a365d;

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

    .ant-btn {
      margin-right: 12px;
      border-radius: 4px;
      font-weight: 500;
    }

    .ant-btn-primary {
      background: #1890ff;
      border-color: #1890ff;
    }
  }

  .device-list .ant-list-item {
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
    transition: background 0.3s;

    &:hover {
      background: #fafafa;
    }

    .ant-list-item-meta-title {
      font-size: 16px;
      font-weight: 500;
      color: #2d3748;
    }

    .ant-list-item-meta-description {
      font-size: 14px;
      color: #718096;
    }

    .ant-btn-danger {
      background: #ff4d4f;
      border-color: #ff4d4f;
      color: #fff;
    }
  }

  .empty-state {
    padding: 32px 0;
    text-align: center;
    color: #718096;
  }
`;

interface TotpManagementComponentProps {
  onUpdate?: () => void;
  totpSecurity?: {
    enabled: boolean;
    deviceName?: string;
    enabledDate?: string;
  };
}

const TotpManagementComponent: React.FC<TotpManagementComponentProps> = ({
  onUpdate,
  totpSecurity
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [devices, setDevices] = useState<TotpDeviceResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState<boolean>(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState<boolean>(false);
  const [regeneratingCodes, setRegeneratingCodes] = useState<boolean>(false);
  const [deletingDevice, setDeletingDevice] = useState<string | null>(null);
  const [isTotpEnabled, setIsTotpEnabled] = useState<boolean>(
    totpSecurity?.enabled || false
  );

  // New state for verification modals
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

  const { token } = useSelector((state: RootState) => state.auth);
  const { userInfo } = useSelector((state: RootState) => state.user);
  // Add a ref to track initial load
  const initialLoadRef = useRef<boolean>(true);

  // Define a fetchDevices function to be used by multiple methods
  const fetchDevices = useCallback(
    async (forceRefresh = false) => {
      if (!token) return;

      setLoading(true);
      setError(null);

      // Get TOTP status directly from props
      const isEnabled = totpSecurity?.enabled || false;
      setIsTotpEnabled(isEnabled);

      // Only fetch devices if TOTP is enabled
      if (isEnabled) {
        try {
          // If forceRefresh is true, we'll bypass session storage checks
          if (forceRefresh) {
            sessionStorage.removeItem("totpDevicesFetched");
          }

          const devicesResponse = await getTotpDevices(token);
          setDevices(devicesResponse.result || []);

          // Mark as fetched in session storage
          sessionStorage.setItem("totpDevicesFetched", "true");
        } catch (error) {
          handleServiceError(error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to fetch TOTP devices";
          setError(errorMessage);
          notification.error({
            message: "Error",
            description: errorMessage
          });
        }
      } else {
        setDevices([]);
      }
      setLoading(false);
    },
    [token, totpSecurity, setIsTotpEnabled, setDevices, setLoading, setError]
  );

  // Update state when props change and fetch devices if needed
  useEffect(() => {
    // Set TOTP status from props (Redux store)
    const isEnabled = totpSecurity?.enabled || false;
    setIsTotpEnabled(isEnabled);

    // Check if TOTP status has changed
    const previousTotpStatus = sessionStorage.getItem("totpEnabled");
    if (
      previousTotpStatus !== null &&
      previousTotpStatus !== String(isEnabled)
    ) {
      // If TOTP status changed, clear the fetched flag to force a refresh
      sessionStorage.removeItem("totpDevicesFetched");
    }
    // Store current TOTP status for future comparison
    sessionStorage.setItem("totpEnabled", String(isEnabled));

    // Only fetch devices on specific conditions:
    // 1. When it's the initial load
    // 2. When TOTP is enabled and we haven't fetched yet
    const hasFetchedThisSession =
      sessionStorage.getItem("totpDevicesFetched") === "true";

    if (initialLoadRef.current && isEnabled && !hasFetchedThisSession) {
      fetchDevices();
      initialLoadRef.current = false;
    } else {
      // If TOTP is disabled, ensure the devices list is empty
      if (!isEnabled) {
        setDevices([]);
      }
      setLoading(false);
    }
  }, [totpSecurity, fetchDevices]);

  const handleAddDevice = () => {
    setShowSetup(true);
  };

  // Updated to show verification modal instead of direct deletion
  const handleDeleteDevice = (deviceId: string) => {
    setDeviceToDelete(deviceId);
    setVerificationCode("");
    setVerificationError(false);
    setShowDeleteVerification(true);
    focusVerificationInput();
    // Focus after a small delay to ensure the modal is rendered
    setTimeout(() => {
      const firstInput = document.querySelector(
        ".verification-code-container .code-input"
      );
      if (firstInput instanceof HTMLInputElement) {
        firstInput.focus();
      }
    }, 300);
  };
  const focusVerificationInput = useCallback(() => {
    // Try immediately
    tryFocus();

    // Try after modal animation should be complete
    setTimeout(tryFocus, 500);
  }, []);

  // Effect that runs when the verification modal visibility changes
  useEffect(() => {
    if (showDeleteVerification) {
      focusVerificationInput();
    }
  }, [showDeleteVerification, focusVerificationInput]);
  // Function to try various focus methods
  const tryFocus = () => {
    // Method 1: Use the ref
    if (verificationInputRef.current) {
      verificationInputRef.current.focus();
      return;
    }

    // Method 2: Query selector for the first input
    const firstInput = document.querySelector(
      ".verification-code-container .code-input"
    );
    if (firstInput instanceof HTMLInputElement) {
      firstInput.focus();
      return;
    }

    // Method 3: Try to find any input within the modal
    const modalInput = document.querySelector(
      ".ant-modal-wrap:not(.ant-modal-hidden) input"
    );
    if (modalInput instanceof HTMLInputElement) {
      modalInput.focus();
    }
  };

  // New function to handle the actual deletion after verification
  const handleVerifyAndDeleteDevice = async () => {
    if (!token || !deviceToDelete) return;
    setIsVerifying(true);
    setVerificationError(false);
    setDeletingDevice(deviceToDelete);
    try {
      await deactivateTotpDevice(deviceToDelete, verificationCode, token);
      notification.success({
        message: "Device Removed",
        description: "2FA device removed successfully."
      });
      setShowDeleteVerification(false);
      // Use fetchDevices with forceRefresh=true to ensure we get fresh data
      await fetchDevices(true);
      if (onUpdate) onUpdate();
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
    }
  };

  // Updated to show verification modal first
  const handleRegenerateBackupCodes = () => {
    setVerificationCode("");
    setVerificationError(false);
    setShowRegenerateVerification(true);

    // Focus after a small delay to ensure the modal is rendered
    setTimeout(() => {
      const firstInput = document.querySelector(
        ".verification-code-container .code-input"
      );
      if (firstInput instanceof HTMLInputElement) {
        firstInput.focus();
      }
    }, 300);
  };

  // Function to handle opening the admin reset modal with focus
  const handleOpenAdminResetModal = () => {
    setAdminResetEmail(""); // Reset the email input
    setShowAdminResetModal(true);

    // Focus on the email input after a slight delay
    setTimeout(() => {
      const emailInput = document.querySelector('input[type="email"]');
      if (emailInput instanceof HTMLInputElement) {
        emailInput.focus();
      }
    }, 300);
  };

  // New function to handle the actual regeneration after verification
  const handleVerifyAndRegenerateCodes = async () => {
    if (!token) return;
    setIsVerifying(true);
    setVerificationError(false);
    setRegeneratingCodes(true);

    try {
      const response = await regenerateBackupCodes(verificationCode, token);
      setBackupCodes(response.result);
      setShowRegenerateVerification(false);
      setShowBackupCodes(true);
      // Refresh the devices data with forceRefresh=true
      await fetchDevices(true);
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

  // New function to request admin reset
  const handleRequestAdminReset = async () => {
    if (!userInfo?.username || !adminResetEmail) return;
    setIsRequestingReset(true);

    try {
      if (!token) return;
      await requestAdminReset(userInfo.username, adminResetEmail, token);
      setShowAdminResetModal(false);
      // Refresh devices data with forceRefresh=true
      await fetchDevices(true);
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
    // Use fetchDevices with forceRefresh=true
    fetchDevices(true);
    if (onUpdate) onUpdate();
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

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
      open={showBackupCodes}
      onCancel={() => setShowBackupCodes(false)}
      footer={[
        <Button key="close" onClick={() => setShowBackupCodes(false)}>
          Close
        </Button>
      ]}
      width={400}
    >
      <Alert
        message="Secure Your Codes"
        description="Use these one-time codes if you lose access to your authenticator."
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <div style={{ maxHeight: "250px", overflow: "auto", marginBottom: 16 }}>
        <List
          grid={{ gutter: 12, column: 2 }}
          dataSource={backupCodes}
          renderItem={(code) => (
            <List.Item>
              <Card size="small" style={{ borderRadius: 4 }}>
                <Text copyable style={{ fontSize: 14 }}>
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

  // New modal for device deletion verification
  const renderDeleteVerificationModal = () => (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <KeyOutlined style={{ marginRight: 8, color: "#faad14" }} />
          Verify Identity
        </div>
      }
      open={showDeleteVerification}
      onCancel={() => setShowDeleteVerification(false)}
      footer={[
        <Button key="cancel" onClick={() => setShowDeleteVerification(false)}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleVerifyAndDeleteDevice}
          loading={isVerifying}
          disabled={verificationCode.length !== 6 || isVerifying}
        >
          Verify & Remove
        </Button>
      ]}
      width={400}
      afterOpenChange={(visible) => {
        if (visible) {
          focusVerificationInput();
        }
      }}
    >
      <Alert
        message="Verification Required"
        description="Please enter your current 2FA code to confirm your identity."
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

      <Paragraph>
        <Text>
          Lost access to your authenticator app? You can also use one of your
          backup codes.
        </Text>
      </Paragraph>

      <Space style={{ marginTop: 16 }}>
        <Button
          type="link"
          icon={<QuestionCircleOutlined />}
          onClick={() => {
            setShowDeleteVerification(false);
            handleOpenAdminResetModal();
          }}
        >
          Lost access to authenticator and backup codes?
        </Button>
      </Space>
    </Modal>
  );

  // New modal for backup code regeneration verification
  const renderRegenerateVerificationModal = () => (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <KeyOutlined style={{ marginRight: 8, color: "#faad14" }} />
          Verify Identity
        </div>
      }
      open={showRegenerateVerification}
      onCancel={() => setShowRegenerateVerification(false)}
      footer={[
        <Button
          key="cancel"
          onClick={() => setShowRegenerateVerification(false)}
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
          Verify & Regenerate
        </Button>
      ]}
      width={400}
      afterOpenChange={(visible) => {
        if (visible) {
          // Reset verification state when modal opens
          setVerificationCode("");
          setVerificationError(false);

          // Short delay for focus to work reliably
          setTimeout(() => {
            // Find the first input field in the modal and focus it
            const firstInput = document.querySelector(
              ".verification-code-container .code-input"
            );
            if (firstInput instanceof HTMLInputElement) {
              firstInput.focus();
            }
          }, 100);
        }
      }}
    >
      <Alert
        message="Verification Required"
        description="Please enter your current 2FA code to confirm your identity."
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
      />

      <Divider />

      <Paragraph>
        <Text>
          Lost access to your authenticator app? You can also use one of your
          backup codes.
        </Text>
      </Paragraph>

      <Space style={{ marginTop: 16 }}>
        <Button
          type="link"
          icon={<QuestionCircleOutlined />}
          onClick={() => {
            setShowRegenerateVerification(false);
            setShowAdminResetModal(true);
          }}
        >
          Lost access to authenticator and backup codes?
        </Button>
      </Space>
    </Modal>
  );

  // New modal for admin reset request
  const renderAdminResetModal = () => (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <MailOutlined style={{ marginRight: 8, color: "#1890ff" }} />
          Request Admin Assistance
        </div>
      }
      open={showAdminResetModal}
      onCancel={() => setShowAdminResetModal(false)}
      footer={[
        <Button key="cancel" onClick={() => setShowAdminResetModal(false)}>
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
      afterOpenChange={(visible) => {
        if (visible) {
          // Reset email state when modal opens
          setAdminResetEmail("");

          // Short delay for focus to work reliably
          setTimeout(() => {
            // Find the email input in this modal and focus it
            const emailInput = document.querySelector('input[type="email"]');
            if (emailInput instanceof HTMLInputElement) {
              emailInput.focus();
            }
          }, 100);
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

      <Form layout="vertical">
        <Form.Item
          label="Confirm Email Address"
          required
          help="Please provide your email address for verification and communication."
        >
          <Input
            value={adminResetEmail}
            onChange={(e) => setAdminResetEmail(e.target.value)}
            placeholder="Enter your email address"
            type="email"
          />
        </Form.Item>
      </Form>

      <Paragraph>
        <Text type="secondary">
          Note: An administrator will verify your identity before resetting your
          2FA. This may take some time.
        </Text>
      </Paragraph>
    </Modal>
  );

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
      {renderBackupCodesModal()}
      {renderDeleteVerificationModal()}
      {renderRegenerateVerificationModal()}
      {renderAdminResetModal()}

      <div className="section-header" onClick={toggleExpand}>
        <Title level={4} className="section-title">
          <SecurityScanOutlined /> Two-Factor Authentication
          {isTotpEnabled && <Tag color="success">Enabled</Tag>}
        </Title>
        {expanded ? <DownOutlined /> : <RightOutlined />}
      </div>

      {expanded && (
        <>
          {loading ? (
            <LoadingState tip="Loading 2FA settings..." fullscreen={false} />
          ) : (
            <>
              {error && (
                <Alert
                  message="Error"
                  description={error}
                  type="error"
                  showIcon
                  style={{ marginBottom: 16 }}
                  closable
                  onClose={() => setError(null)}
                />
              )}

              <Paragraph style={{ fontSize: 14, color: "#666" }}>
                Enhance security with a second verification step. Only one
                device can be registered at a time.
              </Paragraph>

              <Space className="action-buttons">
                {isTotpEnabled && (
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRegenerateBackupCodes}
                    loading={regeneratingCodes}
                  >
                    Regenerate Codes
                  </Button>
                )}
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddDevice}
                  disabled={isTotpEnabled}
                >
                  {isTotpEnabled ? "Device Already Active" : "Add Device"}
                </Button>
                {isTotpEnabled && (
                  <Button
                    type="dashed"
                    icon={<QuestionCircleOutlined />}
                    onClick={handleOpenAdminResetModal}
                  >
                    Lost Access?
                  </Button>
                )}
              </Space>

              <Divider orientation="left" style={{ margin: "16px 0" }}>
                Authenticator Devices
              </Divider>

              {devices.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  className="empty-state"
                  description={
                    <span>
                      No devices setup.{" "}
                      <Button
                        type="link"
                        onClick={handleAddDevice}
                        style={{ padding: 0 }}
                      >
                        Add now
                      </Button>
                    </span>
                  }
                />
              ) : (
                <List
                  className="device-list"
                  dataSource={devices}
                  renderItem={(device) => (
                    <List.Item
                      actions={[
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteDevice(device.id)}
                          loading={deletingDevice === device.id}
                          size="small"
                        >
                          Remove
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <MobileOutlined
                            style={{ fontSize: 20, color: "#1890ff" }}
                          />
                        }
                        title={device.deviceName}
                        description={
                          <Space direction="vertical" size={2}>
                            <Text type="secondary">
                              <ClockCircleOutlined />{" "}
                              {moment(device.createdAt).format("MMM D, YYYY")}
                            </Text>
                            <Tag color={device.active ? "success" : "error"}>
                              {device.active ? "Active" : "Inactive"}
                            </Tag>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </>
          )}
        </>
      )}
    </StyledCard>
  );
};

export default TotpManagementComponent;
