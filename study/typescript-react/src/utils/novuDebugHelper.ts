/**
 * Utility functions to help debug Novu notifications
 */

// Function to send a test notification
export const sendTestNotification = async (userId: string, message: string = "Test notification") => {
  try {
    console.log("Sending test notification to user:", userId);
    
    // Try both with and without the identify_service prefix
    const baseUrl = import.meta.env.VITE_API_BASE_URI || "http://localhost:9095/identify_service";
    
    try {
      // First try with the identify_service prefix
      const response = await fetch(`${baseUrl}/api/mock-novu/test/notify/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notificationType: "test-notification",
          payload: {
            message,
            timestamp: new Date().toISOString()
          }
        })
      });
      
      const data = await response.json();
      console.log("Test notification sent with identify_service prefix:", data);
      return data;
    } catch (prefixError) {
      console.warn("Failed to send test notification with identify_service prefix:", prefixError);
      
      // Try without the identify_service prefix as fallback
      const rootUrl = baseUrl.replace('/identify_service', '');
      const fallbackResponse = await fetch(`${rootUrl}/api/mock-novu/test/notify/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notificationType: "test-notification",
          payload: {
            message,
            timestamp: new Date().toISOString()
          }
        })
      });
      
      const fallbackData = await fallbackResponse.json();
      console.log("Test notification sent without identify_service prefix:", fallbackData);
      return fallbackData;
    }
  } catch (error) {
    console.error("Failed to send test notification:", error);
    return null;
  }
};

// Function to check WebSocket session info
export const checkWebSocketSessions = async () => {
  try {
    console.log("Checking WebSocket sessions");
    
    // Try both with and without the identify_service prefix
    const baseUrl = import.meta.env.VITE_API_BASE_URI || "http://localhost:9095/identify_service";
    
    try {
      // First try with the identify_service prefix
      const response = await fetch(`${baseUrl}/api/mock-novu/test/sessions`);
      const data = await response.json();
      console.log("WebSocket sessions with identify_service prefix:", data);
      return data;
    } catch (prefixError) {
      console.warn("Failed to check WebSocket sessions with identify_service prefix:", prefixError);
      
      // Try without the identify_service prefix as fallback
      const rootUrl = baseUrl.replace('/identify_service', '');
      const fallbackResponse = await fetch(`${rootUrl}/api/mock-novu/test/sessions`);
      const fallbackData = await fallbackResponse.json();
      console.log("WebSocket sessions without identify_service prefix:", fallbackData);
      return fallbackData;
    }
  } catch (error) {
    console.error("Failed to check WebSocket sessions:", error);
    return null;
  }
};

// Function to create a mock WebSocket session
export const createMockWebSocketSession = async (userId: string) => {
  try {
    console.log("Creating mock WebSocket session for user:", userId);
    
    // Try both with and without the identify_service prefix
    const baseUrl = import.meta.env.VITE_API_BASE_URI || "http://localhost:9095/identify_service";
    
    try {
      // First try with the identify_service prefix
      const response = await fetch(`${baseUrl}/api/mock-novu/debug/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId
        })
      });
      
      const data = await response.json();
      console.log("Mock WebSocket session created with identify_service prefix:", data);
      return data;
    } catch (prefixError) {
      console.warn("Failed to create mock WebSocket session with identify_service prefix:", prefixError);
      
      // Try without the identify_service prefix as fallback
      const rootUrl = baseUrl.replace('/identify_service', '');
      const fallbackResponse = await fetch(`${rootUrl}/api/mock-novu/debug/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId
        })
      });
      
      const fallbackData = await fallbackResponse.json();
      console.log("Mock WebSocket session created without identify_service prefix:", fallbackData);
      return fallbackData;
    }
  } catch (error) {
    console.error("Failed to create mock WebSocket session:", error);
    return null;
  }
};

// Function to associate a user with all active WebSocket sessions
export const associateUserWithSessions = async (userId: string) => {
  try {
    console.log("Associating user with all active WebSocket sessions:", userId);
    
    // Try both with and without the identify_service prefix
    const baseUrl = import.meta.env.VITE_API_BASE_URI || "http://localhost:9095/identify_service";
    
    try {
      // First try with the identify_service prefix
      const response = await fetch(`${baseUrl}/api/mock-novu/debug/associate-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId
        })
      });
      
      const data = await response.json();
      console.log("User associated with sessions with identify_service prefix:", data);
      return data;
    } catch (prefixError) {
      console.warn("Failed to associate user with sessions with identify_service prefix:", prefixError);
      
      // Try without the identify_service prefix as fallback
      const rootUrl = baseUrl.replace('/identify_service', '');
      const fallbackResponse = await fetch(`${rootUrl}/api/mock-novu/debug/associate-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId
        })
      });
      
      const fallbackData = await fallbackResponse.json();
      console.log("User associated with sessions without identify_service prefix:", fallbackData);
      return fallbackData;
    }
  } catch (error) {
    console.error("Failed to associate user with sessions:", error);
    return null;
  }
};

// Add these functions to the window object for debugging
if (typeof window !== 'undefined') {
  (window as any).novuDebug = {
    sendTestNotification,
    checkWebSocketSessions,
    createMockWebSocketSession,
    associateUserWithSessions
  };
  
  console.log("Novu debug helpers added to window.novuDebug");
}