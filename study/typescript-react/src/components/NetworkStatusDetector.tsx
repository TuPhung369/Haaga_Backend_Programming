// src/components/NetworkStatusDetector.tsx
import React, { useState, useEffect } from "react";
import { Alert, notification } from "antd";
import { WifiOutlined, DisconnectOutlined } from "@ant-design/icons";

interface NetworkStatusDetectorProps {
  children: React.ReactNode;
}

/**
 * NetworkStatusDetector component that monitors network connectivity
 * Displays appropriate alerts and notifications when connectivity changes
 */
const NetworkStatusDetector: React.FC<NetworkStatusDetectorProps> = ({
  children,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState<boolean>(
    !navigator.onLine
  );

  useEffect(() => {
    // Handler for online status
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
      notification.success({
        message: "Connection Restored",
        description: "Your internet connection has been restored.",
        icon: <WifiOutlined style={{ color: "#52c41a" }} />,
        duration: 3,
      });
    };

    // Handler for offline status
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
      notification.error({
        message: "Connection Lost",
        description:
          "You are currently offline. Some features may not work properly.",
        icon: <DisconnectOutlined style={{ color: "#ff4d4f" }} />,
        duration: 0, // Show until dismissed
      });
    };

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Handler to dismiss the offline alert
  const handleAlertClose = () => {
    setShowOfflineAlert(false);
  };

  return (
    <>
      {showOfflineAlert && (
        <Alert
          message="You are offline"
          description="Your internet connection is unavailable. Some features may not work properly until your connection is restored."
          type="warning"
          closable
          onClose={handleAlertClose}
          banner
          icon={<DisconnectOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}
      {children}
    </>
  );
};

export default NetworkStatusDetector;

