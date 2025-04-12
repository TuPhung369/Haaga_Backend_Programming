import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Steps,
  Button,
  Input,
  Typography,
  Form,
  Row,
  Col,
  Alert,
  Divider,
  List,
  notification,
  Space,
  QRCode,
  Modal,
} from "antd";
import {
  QrcodeOutlined,
  KeyOutlined,
  SafetyOutlined,
  CopyOutlined,
  CheckOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import {
  setupTotp,
  verifyTotp,
  requestDeviceChange,
  TotpSetupResponse,
  getTotpStatus,
} from "../services/totpService";
import { useSelector } from "react-redux";
import { RootState } from "../types/RootStateTypes";
import VerificationCodeInput from "./VerificationCodeInput";
import { handleServiceError } from "../services/baseService";
import LoadingState from "./LoadingState";

const { Title, Text, Paragraph } = Typography;

// Define types for component props
interface TotpSetupComponentProps {
  onSetupComplete?: () => void;
  onCancel?: () => void;
}

const TotpSetupComponent: React.FC<TotpSetupComponentProps> = ({
  onSetupComplete,
  onCancel,
}) => {
  // State
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [deviceName, setDeviceName] = useState<string>("");
  const [setupData, setSetupData] = useState<TotpSetupResponse | null>(null);
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isCopied, setIsCopied] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const [isBackupCodesCopied, setIsBackupCodesCopied] =
    useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isSettingUp, setIsSettingUp] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<boolean>(false);

  // New states for handling device change
  const [hasTotpEnabled, setHasTotpEnabled] = useState<boolean>(false);
  const [showDeviceChangeModal, setShowDeviceChangeModal] =
    useState<boolean>(false);
  const [deviceChangeCode, setDeviceChangeCode] = useState<string>("");
  const [isChangingDevice, setIsChangingDevice] = useState<boolean>(false);
  const [deviceChangeError, setDeviceChangeError] = useState<boolean>(false);

  // Add refs for the input fields
  const deviceNameInputRef = useRef<typeof Input>(null);

  // Add state to control auto focus behavior
  const [shouldFocusVerificationInput, setShouldFocusVerificationInput] =
    useState<boolean>(false);
  const [shouldFocusDeviceChangeInput, setShouldFocusDeviceChangeInput] =
    useState<boolean>(false);

  // Get token from Redux store
  const { token } = useSelector((state: RootState) => state.auth);

  // Check if user already has TOTP enabled
  useEffect(() => {
    const checkTotpStatus = async () => {
      if (!token) return;

      try {
        const response = await getTotpStatus(token);
        setHasTotpEnabled(response.result);

        if (response.result) {
          // Show device change modal automatically if user already has TOTP enabled
          setShowDeviceChangeModal(true);
          // Focus on device name input when modal opens
          setTimeout(() => {
            if (deviceNameInputRef.current) {
              deviceNameInputRef.current.focus();
            }
          }, 300);
        }
      } catch (error) {
        console.error("Error checking TOTP status:", error);
      }
    };

    checkTotpStatus();
  }, [token]);

  // Handle focus for verification input after step changes
  useEffect(() => {
    if (currentStep === 1) {
      // When moving to verification step, enable the focus
      setShouldFocusVerificationInput(true);
    } else {
      setShouldFocusVerificationInput(false);
    }
  }, [currentStep]);

  // Initialize the setup process
  const handleSetup = async () => {
    setError(null);

    if (!deviceName.trim()) {
      setError("Please enter a device name");
      return;
    }

    setIsSettingUp(true);

    try {
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      const response = await setupTotp(deviceName, token);
      setSetupData(response.result);
      setCurrentStep(1);
    } catch (error) {
      handleServiceError(error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to set up TOTP";
      setError(errorMessage);
      notification.error({
        message: "Setup Failed",
        description: errorMessage,
      });
    } finally {
      setIsSettingUp(false);
    }
  };

  // Verify the TOTP code
  const handleVerify = async () => {
    setError(null);
    setVerificationError(false);

    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit verification code");
      return;
    }

    if (!setupData?.secretId) {
      setError("Setup data is missing");
      return;
    }

    setIsVerifying(true);

    try {
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      const response = await verifyTotp(
        setupData.secretId,
        verificationCode,
        token
      );

      if (response.result.success) {
        setBackupCodes(response.result.backupCodes);
        setCurrentStep(2);
        notification.success({
          message: "Verification Successful",
          description:
            "Two-factor authentication has been enabled for your account.",
        });
      } else {
        setVerificationError(true);
        setError("Invalid verification code. Please try again.");
        // Re-enable focus on error to help user correct input
        setShouldFocusVerificationInput(true);
      }
    } catch (error) {
      handleServiceError(error);
      setVerificationError(true);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to verify TOTP code";
      setError(errorMessage);
      // Re-enable focus on error to help user correct input
      setShouldFocusVerificationInput(true);
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle device change verification
  const handleDeviceChange = async () => {
    setDeviceChangeError(false);

    if (!deviceChangeCode || deviceChangeCode.length !== 6) {
      setDeviceChangeError(true);
      // Enable focus to help user correct input
      setShouldFocusDeviceChangeInput(true);
      return;
    }

    setIsChangingDevice(true);

    try {
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      const response = await requestDeviceChange(
        deviceChangeCode,
        deviceName,
        token
      );
      setSetupData(response.result);
      setShowDeviceChangeModal(false);
      setCurrentStep(1);

      notification.success({
        message: "Device Change Initiated",
        description: "Please verify your new device by scanning the QR code.",
      });
    } catch (error) {
      handleServiceError(error);
      setDeviceChangeError(true);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to change device";
      notification.error({
        message: "Verification Failed",
        description: errorMessage,
      });
      // Re-enable focus to help user correct input
      setShouldFocusDeviceChangeInput(true);
    } finally {
      setIsChangingDevice(false);
    }
  };

  // Copy text to clipboard
  const copyToClipboard = (text: string, key: string) => {
    // Temporarily disable verification input focus
    setShouldFocusVerificationInput(false);

    navigator.clipboard.writeText(text).then(
      () => {
        setIsCopied({ ...isCopied, [key]: true });
        setTimeout(() => {
          setIsCopied({ ...isCopied, [key]: false });
        }, 2000);
      },
      (err) => {
        console.error("Could not copy text: ", err);
      }
    );
  };

  // Copy all backup codes to clipboard
  const copyBackupCodes = () => {
    const text = backupCodes.join("\n");
    navigator.clipboard.writeText(text).then(
      () => {
        setIsBackupCodesCopied(true);
        notification.success({
          message: "Backup Codes Copied",
          description: "All backup codes have been copied to your clipboard.",
        });
      },
      (err) => {
        console.error("Could not copy backup codes: ", err);
        notification.error({
          message: "Copy Failed",
          description: "Failed to copy backup codes. Please try again.",
        });
      }
    );
  };

  // Handle finish
  const handleFinish = () => {
    if (onSetupComplete) {
      onSetupComplete();
    }
  };

  // Device change verification modal
  const renderDeviceChangeModal = () => (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <KeyOutlined style={{ marginRight: 8, color: "#faad14" }} />
          Verify Current Device
        </div>
      }
      open={showDeviceChangeModal}
      onCancel={() => {
        setShowDeviceChangeModal(false);
        if (onCancel) onCancel();
      }}
      footer={[
        <Button
          key="cancel"
          onClick={() => {
            setShowDeviceChangeModal(false);
            if (onCancel) onCancel();
          }}
        >
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleDeviceChange}
          loading={isChangingDevice}
          disabled={deviceChangeCode.length !== 6 || isChangingDevice}
        >
          Verify & Continue
        </Button>,
      ]}
      width={400}
      afterOpenChange={(visible) => {
        if (visible) {
          // Enable focus when the modal opens
          setTimeout(() => {
            setShouldFocusDeviceChangeInput(true);
          }, 300);
        }
      }}
    >
      <Alert
        message="You Already Have 2FA Enabled"
        description="To set up a new device, you must first verify your identity with your current authenticator device or a backup code."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form layout="vertical">
        <Form.Item
          label="New Device Name"
          help="Give a name to this device (e.g., 'My iPhone', 'Work Phone')"
          validateStatus={!deviceName.trim() ? "error" : ""}
        >
          <Input
            ref={deviceNameInputRef}
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            placeholder="Enter device name"
            maxLength={50}
          />
        </Form.Item>
      </Form>

      <Divider />

      <Paragraph>
        <Text strong>Enter Verification Code</Text>
      </Paragraph>

      <VerificationCodeInput
        value={deviceChangeCode}
        onChange={setDeviceChangeCode}
        isError={deviceChangeError}
        isSubmitting={isChangingDevice}
        autoFocus={shouldFocusDeviceChangeInput}
        onResendCode={undefined}
        onFocus={() => {
          // Disable auto focus after initial focus
          setShouldFocusDeviceChangeInput(false);
        }}
      />

      <Paragraph style={{ marginTop: 16 }}>
        <Text type="secondary">
          Enter the 6-digit code from your current authenticator app or use one
          of your backup codes.
        </Text>
      </Paragraph>
    </Modal>
  );

  // Steps content
  const steps = [
    {
      title: "Setup",
      icon: <SafetyOutlined />,
      content: (
        <div>
          <Alert
            message="Only One Device Allowed"
            description="You can only have one active authenticator device at a time. Setting up a new device will replace any existing one."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Paragraph>
            Two-factor authentication adds an extra layer of security to your
            account by requiring a verification code along with your password.
          </Paragraph>

          <Form layout="vertical">
            <Form.Item
              label="Device Name"
              help="Give a name to this device (e.g., 'My iPhone', 'Work Phone')"
              validateStatus={error && !deviceName.trim() ? "error" : ""}
            >
              <Input
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="Enter device name"
                maxLength={50}
                disabled={isSettingUp}
                autoFocus
              />
            </Form.Item>

            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
                closable
                onClose={() => setError(null)}
              />
            )}

            <Space style={{ marginTop: 16 }}>
              {onCancel && <Button onClick={onCancel}>Cancel</Button>}
              <Button
                type="primary"
                onClick={handleSetup}
                loading={isSettingUp}
                disabled={isSettingUp || !deviceName.trim()}
              >
                Set Up
              </Button>
            </Space>
          </Form>
        </div>
      ),
    },
    {
      title: "Verify",
      icon: <QrcodeOutlined />,
      content: setupData && (
        <div>
          <Paragraph>
            Scan this QR code with your authenticator app (such as Google
            Authenticator, Authy, or Microsoft Authenticator).
          </Paragraph>

          <Row gutter={[24, 24]} justify="center">
            <Col span={24} style={{ textAlign: "center" }}>
              <Card
                style={{
                  display: "inline-block",
                  margin: "0 auto",
                  padding: "16px",
                  background: "#f8f8f8",
                  minHeight: "220px",
                  minWidth: "220px",
                }}
              >
                {setupData.qrCodeUri ? (
                  <QRCode
                    value={setupData.qrCodeUri}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                ) : (
                  <Text type="danger">
                    QR code data is unavailable. Please use the secret key
                    below.
                  </Text>
                )}
                <div style={{ marginTop: "10px", fontWeight: "bold" }}>
                  Scan with authenticator app
                </div>
              </Card>
            </Col>
          </Row>

          <Divider />

          <Paragraph>
            If you can't scan the QR code, you can manually enter this secret
            key into your authenticator app:
          </Paragraph>

          <Row gutter={[16, 16]} align="middle">
            <Col span={18}>
              <Input.Password
                value={setupData.secretKey}
                readOnly
                addonBefore={<KeyOutlined />}
                onFocus={() => {
                  // Disable verification input focus when user interacts with this field
                  setShouldFocusVerificationInput(false);
                }}
              />
            </Col>
            <Col span={6}>
              <Button
                icon={
                  isCopied["secretKey"] ? <CheckOutlined /> : <CopyOutlined />
                }
                onClick={() =>
                  copyToClipboard(setupData.secretKey, "secretKey")
                }
                onFocus={() => {
                  // Disable verification input focus when user interacts with this button
                  setShouldFocusVerificationInput(false);
                }}
              >
                {isCopied["secretKey"] ? "Copied" : "Copy"}
              </Button>
            </Col>
          </Row>

          <Divider />

          <Paragraph>
            Enter the verification code from your authenticator app to complete
            the setup:
          </Paragraph>

          <VerificationCodeInput
            value={verificationCode}
            onChange={setVerificationCode}
            isError={verificationError}
            isSubmitting={isVerifying}
            autoFocus={shouldFocusVerificationInput}
            onFocus={() => {
              // Disable auto focus after initial focus
              setShouldFocusVerificationInput(false);
            }}
          />

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ marginBottom: 16, marginTop: 16 }}
              closable
              onClose={() => setError(null)}
            />
          )}

          <Space style={{ marginTop: 16 }}>
            <Button
              onClick={() => {
                setCurrentStep(0);
                setSetupData(null);
                setVerificationCode("");
                setError(null);
              }}
              disabled={isVerifying}
              onFocus={() => {
                // Disable verification input focus when user interacts with this button
                setShouldFocusVerificationInput(false);
              }}
            >
              Back
            </Button>
            <Button
              type="primary"
              onClick={handleVerify}
              loading={isVerifying}
              disabled={isVerifying || verificationCode.length !== 6}
              onFocus={() => {
                // Disable verification input focus when user interacts with this button
                setShouldFocusVerificationInput(false);
              }}
            >
              Verify
            </Button>
          </Space>
        </div>
      ),
    },
    {
      title: "Backup Codes",
      icon: <KeyOutlined />,
      content: (
        <div>
          <Alert
            message="Important: Save Your Backup Codes"
            description="If you lose access to your authenticator app, you can use one of these backup codes to sign in. Each code can only be used once."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Card
            title="Your Backup Codes"
            extra={
              <Button
                icon={
                  isBackupCodesCopied ? <CheckOutlined /> : <CopyOutlined />
                }
                onClick={copyBackupCodes}
              >
                {isBackupCodesCopied ? "Copied All" : "Copy All"}
              </Button>
            }
          >
            <List
              grid={{ gutter: 16, column: 2 }}
              dataSource={backupCodes}
              renderItem={(code) => (
                <List.Item>
                  <Card size="small">
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Text copyable>{code}</Text>
                      </Col>
                    </Row>
                  </Card>
                </List.Item>
              )}
            />
          </Card>

          <Alert
            message="One-time codes"
            description="Each backup code can only be used once. After using a backup code, it will be invalidated."
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginTop: 16, marginBottom: 16 }}
          />

          <Paragraph style={{ marginTop: 16 }}>
            <Text strong type="danger">
              These codes will NOT be shown again. Please save them in a secure
              place.
            </Text>
          </Paragraph>

          <Button
            type="primary"
            onClick={handleFinish}
            style={{ marginTop: 16 }}
          >
            Finish
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="totp-setup-container">
      {renderDeviceChangeModal()}
      {hasTotpEnabled && <Alert message="You already have 2FA enabled" />}
      {(isSettingUp || isVerifying) && (
        <LoadingState
          tip={
            isSettingUp
              ? "Setting up two-factor authentication..."
              : "Verifying code..."
          }
          fullscreen={false}
        />
      )}

      <Card title={<Title level={4}>Set Up Two-Factor Authentication</Title>}>
        <Steps
          current={currentStep}
          items={steps.map((item) => ({
            title: item.title,
            icon: item.icon,
          }))}
          style={{ marginBottom: 32 }}
        />

        <div className="steps-content">{steps[currentStep].content}</div>
      </Card>
    </div>
  );
};

export default TotpSetupComponent;

