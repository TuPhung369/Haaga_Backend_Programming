import React, { useEffect, useState } from "react";
import { API_URL } from "../services/LanguageService";
import "./ServiceStatusNotification.css";

interface ServiceStatusProps {
  onStatusChange?: (isAvailable: boolean) => void;
}

const ServiceStatusNotification: React.FC<ServiceStatusProps> = ({
  onStatusChange
}) => {
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const serviceUrl = API_URL; // Using the same API_URL from LanguageService

  const checkServiceStatus = async () => {
    setIsChecking(true);
    try {
      const response = await fetch(`${serviceUrl}/api/speech/health`, {
        method: "GET",
        headers: {
          Accept: "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        const isHealthy = data.status === "healthy";
        setIsAvailable(isHealthy);
        if (onStatusChange) {
          onStatusChange(isHealthy);
        }
      } else {
        setIsAvailable(false);
        if (onStatusChange) {
          onStatusChange(false);
        }
      }
    } catch (error) {
      console.error("Error checking service status:", error);
      setIsAvailable(false);
      if (onStatusChange) {
        onStatusChange(false);
      }
    } finally {
      setIsChecking(false);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    checkServiceStatus();

    // Set up an interval to check the status every 30 seconds
    const intervalId = setInterval(checkServiceStatus, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  if (isChecking && lastChecked === null) {
    return null; // Don't show anything during initial check
  }

  if (isAvailable) {
    return null; // Don't show anything when service is available
  }

  return (
    <div className="service-status-notification">
      <div className="service-status-content">
        <span className="service-status-icon">⚠️</span>
        <span className="service-status-message">
          The language service is currently unavailable. Some features may be
          limited.
        </span>
        <button
          className="service-status-refresh"
          onClick={checkServiceStatus}
          disabled={isChecking}
        >
          {isChecking ? "Checking..." : "Retry"}
        </button>
      </div>
    </div>
  );
};

export default ServiceStatusNotification;
