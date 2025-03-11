// TotpManagementComponent.tsx
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
  RightOutlined,
  DownOutlined,
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
import styled from "styled-components";

const { Text, Paragraph, Title } = Typography;
const { confirm } = Modal;

const StyledCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
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
}

const TotpManagementComponent: React.FC<TotpManagementComponentProps> = ({
  onUpdate,
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);
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
      const statusResponse = await getTotpStatus(token);
      setIsTotpEnabled(statusResponse.result);

      if (statusResponse.result) {
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
      title: "Remove Device?",
      content: "This will disable 2FA for this device. Re-setup required.",
      icon: <DeleteOutlined style={{ color: "red" }} />,
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        if (!token) return;

        setDeletingDevice(deviceId);

        try {
          await deactivateTotpDevice(deviceId, token);
          notification.success({
            message: "Device Removed",
            description: "2FA device removed successfully.",
          });
          fetchTotpData();
          if (onUpdate) onUpdate();
        } catch (error) {
          handleServiceError(error);
          notification.error({
            message: "Error",
            description: "Failed to remove device.",
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
      content: "This invalidates existing codes. Save new ones securely.",
      icon: <ReloadOutlined style={{ color: "#faad14" }} />,
      okText: "Yes",
      cancelText: "No",
      onOk: async () => {
        if (!token) return;

        setRegeneratingCodes(true);

        try {
          const response = await regenerateBackupCodes(token);
          setBackupCodes(response.result);
          setShowBackupCodes(true);
          notification.success({
            message: "Codes Regenerated",
            description: "New backup codes generated. Save them securely.",
          });
        } catch (error) {
          handleServiceError(error);
          notification.error({
            message: "Error",
            description: "Failed to regenerate codes.",
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
        </Button>,
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
          Save these codes securely. They won’t be shown again.
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
                Enhance security with a second verification step.
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
                >
                  Add Device
                </Button>
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
                        </Button>,
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
