// src/components/TotpManagementComponent.tsx
import React, { useState, useEffect, useCallback } from "react";
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
} from "antd";
import {
  SecurityScanOutlined,
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  MobileOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  getTotpStatus,
  getTotpDevices,
  deactivateTotpDevice,
  regenerateBackupCodes,
  TotpDeviceResponse,
} from "../services/totpService";
import { useSelector } from "react-redux";
import { RootState } from "../type/types";
import { handleServiceError } from "../services/baseService";
import TotpSetupComponent from "./TotpSetupComponent";
import moment from "moment";
import LoadingState from "./LoadingState";

const { Text, Paragraph } = Typography;
const { confirm } = Modal;

interface TotpManagementComponentProps {
  onUpdate?: () => void;
}

const TotpManagementComponent: React.FC<TotpManagementComponentProps> = ({
  onUpdate,
}) => {
  const [isTotpEnabled, setIsTotpEnabled] = useState<boolean>(false);
  const [devices, setDevices] = useState<TotpDeviceResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState<boolean>(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState<boolean>(false);
  const [regeneratingCodes, setRegeneratingCodes] = useState<boolean>(false);
  const [deletingDevice, setDeletingDevice] = useState<string | null>(null);

  const { token } = useSelector((state: RootState) => state.auth);

  const fetchTotpData = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      // Get TOTP status
      const statusResponse = await getTotpStatus(token);
      setIsTotpEnabled(statusResponse.result);

      if (statusResponse.result) {
        // Get TOTP devices if enabled
        const devicesResponse = await getTotpDevices(token);
        setDevices(devicesResponse.result || []);
      } else {
        setDevices([]);
      }
    } catch (error) {
      handleServiceError(error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch TOTP data";
      setError(errorMessage);
      notification.error({
        message: "Error",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTotpData();
  }, [fetchTotpData]);

  const handleAddDevice = () => {
    setShowSetup(true);
  };

  const handleDeleteDevice = (deviceId: string) => {
    confirm({
      title: "Are you sure you want to remove this device?",
      content:
        "This will disable two-factor authentication for this device. You'll need to set it up again if you want to use it in the future.",
      icon: <DeleteOutlined style={{ color: "red" }} />,
      okText: "Yes, Remove",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        if (!token) return;

        setDeletingDevice(deviceId);

        try {
          await deactivateTotpDevice(deviceId, token);
          notification.success({
            message: "Device Removed",
            description:
              "Two-factor authentication device has been successfully removed.",
          });
          fetchTotpData();
          if (onUpdate) onUpdate();
        } catch (error) {
          handleServiceError(error);
          const errorMessage =
            error instanceof Error ? error.message : "Failed to remove device";
          notification.error({
            message: "Error",
            description: errorMessage,
          });
        } finally {
          setDeletingDevice(null);
        }
      },
    });
  };

  const handleRegenerateBackupCodes = () => {
    confirm({
      title: "Regenerate Backup Codes?",
      content:
        "This will invalidate all your current backup codes. You'll need to save the new ones in a secure place.",
      icon: <ReloadOutlined style={{ color: "#faad14" }} />,
      okText: "Yes, Regenerate",
      cancelText: "Cancel",
      onOk: async () => {
        if (!token) return;

        setRegeneratingCodes(true);

        try {
          const response = await regenerateBackupCodes(token);
          setBackupCodes(response.result);
          setShowBackupCodes(true);
          notification.success({
            message: "Backup Codes Regenerated",
            description:
              "Your new backup codes have been generated. Make sure to save them in a secure place.",
          });
        } catch (error) {
          handleServiceError(error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to regenerate backup codes";
          notification.error({
            message: "Error",
            description: errorMessage,
          });
        } finally {
          setRegeneratingCodes(false);
        }
      },
    });
  };

  const handleSetupComplete = () => {
    setShowSetup(false);
    fetchTotpData();
    if (onUpdate) onUpdate();
  };

  // Render the backup codes modal
  const renderBackupCodesModal = () => (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <SafetyCertificateOutlined
            style={{ marginRight: 8, color: "#52c41a" }}
          />
          <span>Backup Codes</span>
        </div>
      }
      open={showBackupCodes}
      onCancel={() => setShowBackupCodes(false)}
      footer={[
        <Button key="close" onClick={() => setShowBackupCodes(false)}>
          Close
        </Button>,
      ]}
      width={500}
    >
      <Alert
        message="Keep these codes safe"
        description="If you lose access to your authenticator app, you can use one of these codes to sign in. Each code can only be used once."
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <div style={{ maxHeight: "300px", overflow: "auto", marginBottom: 16 }}>
        <List
          grid={{ gutter: 16, column: 2 }}
          dataSource={backupCodes}
          renderItem={(code) => (
            <List.Item>
              <Card size="small">
                <Text copyable>{code}</Text>
              </Card>
            </List.Item>
          )}
        />
      </div>

      <Paragraph>
        <Text strong type="danger">
          These codes will NOT be shown again. Please save them in a secure
          place.
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

  // Show loading state
  if (loading) {
    return (
      <LoadingState
        tip="Loading two-factor authentication settings..."
        fullscreen={false}
      />
    );
  }

  return (
    <div className="totp-management-container">
      {renderBackupCodesModal()}

      <Card
        title={
          <Space>
            <SecurityScanOutlined />
            <span>Two-Factor Authentication</span>
            {isTotpEnabled && <Tag color="success">Enabled</Tag>}
          </Space>
        }
        extra={
          <Space>
            {isTotpEnabled && (
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRegenerateBackupCodes}
                loading={regeneratingCodes}
              >
                Regenerate Backup Codes
              </Button>
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddDevice}
            >
              Add New Device
            </Button>
          </Space>
        }
      >
        {error && (
          <Alert
            message="Error loading two-factor authentication data"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setError(null)}
          />
        )}

        <Paragraph>
          Two-factor authentication adds an extra layer of security to your
          account by requiring a verification code along with your password.
        </Paragraph>

        <Divider orientation="left">Your Authenticator Devices</Divider>

        {devices.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                You haven't set up any authenticator devices yet.{" "}
                <Button
                  type="link"
                  onClick={handleAddDevice}
                  style={{ padding: 0 }}
                >
                  Set up now
                </Button>
              </span>
            }
          />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={devices}
            renderItem={(device) => (
              <List.Item
                actions={[
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteDevice(device.id)}
                    loading={deletingDevice === device.id}
                  >
                    Remove
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <MobileOutlined
                      style={{ fontSize: 24, color: "#1890ff" }}
                    />
                  }
                  title={device.deviceName}
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">
                        <ClockCircleOutlined /> Added on{" "}
                        {moment(device.createdAt).format("MMM D, YYYY")}
                      </Text>
                      {device.active ? (
                        <Tag color="success">Active</Tag>
                      ) : (
                        <Tag color="error">Inactive</Tag>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default TotpManagementComponent;

