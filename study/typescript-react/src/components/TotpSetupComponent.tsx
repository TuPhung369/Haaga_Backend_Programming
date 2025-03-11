// src/components/TotpSetupComponent.tsx
import React, { useState } from "react";
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
  Image,
} from "antd";
import {
  QrcodeOutlined,
  KeyOutlined,
  SafetyOutlined,
  CopyOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import {
  setupTotp,
  verifyTotp,
  TotpSetupResponse,
} from "../services/totpService";
import { useSelector } from "react-redux";
import { RootState } from "../type/types";
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

  // Get token from Redux store
  const { token } = useSelector((state: RootState) => state.auth);

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
      }
    } catch (error) {
      handleServiceError(error);
      setVerificationError(true);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to verify TOTP code";
      setError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  // Copy text to clipboard
  const copyToClipboard = (text: string, key: string) => {
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

  // Steps content
  const steps = [
    {
      title: "Setup",
      icon: <SafetyOutlined />,
      content: (
        <div>
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
              <Card style={{ display: "inline-block", margin: "0 auto" }}>
                <Image
                  width={200}
                  src={setupData.qrCodeUri}
                  alt="QR Code for TOTP Setup"
                  preview={false}
                />
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
            autoFocus={true}
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
            >
              Back
            </Button>
            <Button
              type="primary"
              onClick={handleVerify}
              loading={isVerifying}
              disabled={isVerifying || verificationCode.length !== 6}
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

          <Paragraph style={{ marginTop: 16 }}>
            <Text strong>
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
