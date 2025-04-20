import React, { useEffect, useState, useRef } from "react";
import {
  NovuProvider,
  PopoverNotificationCenter,
  NotificationBell,
  IMessage,
} from "@novu/notification-center";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { notification } from "antd";
import { registerAsSubscriber, getSubscriberId } from "../api/notificationApi";
import "../styles/NotificationCenter.css";
import { 
  sendTestNotification, 
  createMockWebSocketSession, 
  associateUserWithSessions 
} from "../utils/novuDebugHelper";

// Define interface for Socket.io
interface SocketIOClient {
  connect: () => void;
  emit: (event: string, data: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
}

// Extend Window interface to include Socket.io
declare global {
  interface Window {
    io?: (url: string, options?: any) => SocketIOClient;
  }
}

interface NotificationCenterProps {
  onNotificationClick?: (notification: IMessage) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onNotificationClick,
}) => {
  console.log("STEP Notification 1: NotificationCenter component rendering");
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const userInfo = useSelector((state: RootState) => state.user.userInfo);
  const [subscriberId, setSubscriberId] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string>("");
  const [backendUrl, setBackendUrl] = useState<string>("");
  const [socketUrl, setSocketUrl] = useState<string>("");
  const novuInitialized = useRef(false);

  console.log("STEP Notification 2: Auth state:", { isAuthenticated, userInfo });

  useEffect(() => {
    console.log("STEP Notification 3: useEffect triggered");
    // Get the application ID and API key from environment variables
    const appId = import.meta.env.VITE_NOVU_APP_ID || "";
    const apiUrl = import.meta.env.VITE_NOVU_API_URL || "https://api.novu.co";
    const apiKey = import.meta.env.VITE_NOVU_API_KEY || "";
    
    // Set the socket URL to the correct WebSocket endpoint
    const baseUrl = import.meta.env.VITE_API_BASE_URI || "http://localhost:9095/identify_service";
    // The socket URL should be the root of the service without the path
    const wsUrl = "http://localhost:9095";
    
    console.log("STEP Notification 4: Environment variables:", { 
      appId, 
      apiUrl,
      apiKeyConfigured: !!apiKey,
      socketUrl: wsUrl
    });
    
    setApplicationId(appId);
    setBackendUrl(apiUrl);
    setSocketUrl(wsUrl);
    
    // Log that we have the API key (without showing the full key)
    if (apiKey) {
      console.log(`Novu API key is configured: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
    } else {
      console.warn("Novu API key is not configured");
    }

    if (isAuthenticated && userInfo?.id) {
      console.log("STEP Notification 5: User is authenticated, registering as subscriber");
      // Register the user as a subscriber
      registerUserAsSubscriber();
    } else {
      console.log("STEP Notification 6: User is not authenticated or missing userInfo", { 
        isAuthenticated, 
        userId: userInfo?.id 
      });
    }
  }, [isAuthenticated, userInfo]);

  const registerUserAsSubscriber = async () => {
    console.log("STEP Notification 7: Starting subscriber registration");
    try {
      // First, try to get the subscriber ID
      console.log("STEP Notification 8: Getting subscriber ID");
      const id = await getSubscriberId();
      console.log("STEP Notification 9: Received subscriber ID:", id);
      setSubscriberId(id);

      // Then register the user (this will handle if they're already registered)
      console.log("STEP Notification 10: Registering as subscriber");
      const response = await registerAsSubscriber();
      console.log("STEP Notification 11: Registration response:", response);
    } catch (error) {
      console.error("STEP Notification ERROR: Error registering user as subscriber:", error);
      notification.error({
        message: "Notification Setup Failed",
        description:
          "Could not set up notifications. Some features may be limited.",
      });
    }
  };

  const handleOnNotificationClick = (message: IMessage) => {
    console.log("STEP Notification 12: Notification clicked:", message);
    // Handle notification click
    if (onNotificationClick) {
      onNotificationClick(message);
    }
  };

  // Function to manually identify the user to the Novu WebSocket
  const identifyToNovuSocket = (subscriberId: string) => {
    if (!subscriberId) return;
    
    try {
      console.log("STEP Notification 16: Manually identifying to Novu socket");
      
      // Create a socket connection using our mock implementation
      if (window.io) {
        const socket = window.io(socketUrl || window.location.origin, {
          query: {
            userId: subscriberId,
            subscriberId: subscriberId
          }
        });
        
        // Set up event handlers
        socket.on('connect', () => {
          console.log("Socket connected successfully");
          
          // Send identification messages
          socket.emit('identify', { userId: subscriberId, subscriberId: subscriberId });
          console.log("STEP Notification 17: Identification message sent to socket");
          
          socket.emit('subscribe_to_user_updates', { userId: subscriberId });
          console.log("Subscription message sent to socket");
        });
        
        // Handle notifications
        socket.on('notification', (data) => {
          console.log("Received notification:", data);
        });
        
        // Handle unseen count changes
        socket.on('unseen_count_changed', (data) => {
          console.log("Unseen count changed:", data);
        });
        
        // Store the socket in a global variable for debugging
        (window as any).novuSocket = socket;
      } else {
        console.log("Socket.io not available, loading it");
        
        // Load Socket.io library
        const script = document.createElement('script');
        script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js';
        script.onload = () => {
          console.log("Socket.io loaded successfully");
          novuInitialized.current = true;
          // Try again after loading
          setTimeout(() => identifyToNovuSocket(subscriberId), 100);
        };
        document.head.appendChild(script);
      }
    } catch (error) {
      console.error("STEP Notification ERROR: Error identifying to Novu socket:", error);
    }
  };

  // Function to create a mock session for the user
  const createMockSession = async (userId: string) => {
    try {
      console.log("STEP Notification 18: Creating mock session for user:", userId);
      
      // First try to create a mock session
      const sessionResult = await createMockWebSocketSession(userId);
      console.log("STEP Notification 19: Mock session created:", sessionResult);
      
      // Also try to associate the user with any existing sessions as a fallback
      await associateUserWithSessions(userId);
      console.log("User associated with existing sessions");
      
      // Send a test notification to verify everything is working
      setTimeout(async () => {
        try {
          await sendTestNotification(userId, "Welcome to the notification center!");
          console.log("Test notification sent successfully");
        } catch (notificationError) {
          console.error("Error sending test notification:", notificationError);
        }
      }, 2000);
      
      return sessionResult;
    } catch (error) {
      console.error("STEP Notification ERROR: Failed to create mock session:", error);
      
      // Try to associate the user with any existing sessions as a fallback
      try {
        await associateUserWithSessions(userId);
        console.log("User associated with existing sessions as fallback");
      } catch (associateError) {
        console.error("Failed to associate user with existing sessions:", associateError);
      }
      
      return null;
    }
  };

  // Effect to identify to the socket when subscriberId is available
  useEffect(() => {
    if (subscriberId) {
      console.log("STEP Notification: subscriberId is available, setting up socket connection");
      
      // Create a mock session first (this is optional but helps with debugging)
      createMockSession(subscriberId).then(() => {
        console.log("Mock session created or user associated with existing sessions");
        
        // Set a short timeout to allow everything to initialize
        setTimeout(() => {
          novuInitialized.current = true;
          identifyToNovuSocket(subscriberId);
        }, 500);
      }).catch(error => {
        console.error("Error creating mock session:", error);
        
        // Even if the mock session creation fails, still try to identify to the socket
        setTimeout(() => {
          novuInitialized.current = true;
          identifyToNovuSocket(subscriberId);
        }, 500);
      });
      
      // Store the subscriber ID in localStorage for the mock implementation to use
      try {
        localStorage.setItem('userId', subscriberId);
        localStorage.setItem('subscriberId', subscriberId);
      } catch (e) {
        console.warn("Error storing subscriber ID in localStorage:", e);
      }
    }
  }, [subscriberId]);

  if (!isAuthenticated || !subscriberId || !applicationId) {
    console.log("STEP Notification 13: Not rendering notification center due to missing data:", {
      isAuthenticated,
      subscriberId,
      applicationId
    });
    return null;
  }

  console.log("STEP Notification 14: Rendering notification center with:", {
    subscriberId,
    applicationId,
    backendUrl,
    socketUrl
  });

  return (
    <div className="notification-center-wrapper">
      <NovuProvider
        subscriberId={subscriberId}
        applicationIdentifier={applicationId}
        backendUrl={backendUrl}
        socketUrl={socketUrl}
        onSocketConnected={() => {
          console.log("Novu socket connected callback triggered");
          // This is a good place to identify the user
          setTimeout(() => {
            identifyToNovuSocket(subscriberId);
          }, 100);
        }}
        i18n="en"
      >
        <PopoverNotificationCenter
          onNotificationClick={handleOnNotificationClick}
          colorScheme="light"
          onUnseenCountChanged={(count) => {
            console.log("Unseen count changed:", count);
          }}
          onActionClick={(templateIdentifier, type, buttonText) => {
            console.log("Action clicked:", { templateIdentifier, type, buttonText });
          }}
        >
          {({ unseenCount }) => {
            console.log("STEP Notification 15: Rendering bell with unseen count:", unseenCount);
            return <NotificationBell unseenCount={unseenCount} />;
          }}
        </PopoverNotificationCenter>
      </NovuProvider>
    </div>
  );
};

export default NotificationCenter;

