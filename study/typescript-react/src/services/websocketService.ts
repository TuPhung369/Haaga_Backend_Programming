import { Client, IMessage, StompHeaders } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import store from "../store/store";
import { addMessage, updateMessagesReadStatus } from "../store/chatSlice";
import { Message } from "./chatService";

// Use the same API_URL as in baseService.ts
const API_BASE_URI =
  import.meta.env.VITE_API_BASE_URI || "http://localhost:9095/identify_service";

// Get JWT token from Redux store
const getAuthToken = () => {
  const state = store.getState();
  return state.auth.token;
};

let stompClient: Client | null = null;

export const connectWebSocket = (userId: string) => {
  console.log("[WebSocket] Connecting WebSocket for user:", userId);

  if (stompClient) {
    console.log("[WebSocket] Existing client found, disconnecting first");
    disconnectWebSocket();
  }

  try {
    // Get the JWT token
    const token = getAuthToken();
    console.log(
      "[WebSocket] Auth token retrieved:",
      token ? "Token exists" : "No token"
    );

    // Create STOMP headers with authentication
    const connectHeaders: StompHeaders = {};
    if (token) {
      connectHeaders["Authorization"] = `Bearer ${token}`;
      connectHeaders["X-Auth-Token"] = token;
      console.log("[WebSocket] Added auth headers to connection");
    } else {
      console.warn("[WebSocket] No token available for authentication");
    }

    // Create SockJS instance with proper URL
    const wsUrl = `${API_BASE_URI}/ws-messaging`;
    console.log("[WebSocket] Creating SockJS socket for URL:", wsUrl);
    const socket = new SockJS(wsUrl);

    console.log("[WebSocket] SockJS socket created successfully");

    stompClient = new Client({
      webSocketFactory: () => socket,
      connectHeaders,
      debug: (str) => {
        console.debug("[STOMP Debug]", str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    console.log("[WebSocket] STOMP client created with configuration");
  } catch (error) {
    console.error("[WebSocket] Error creating WebSocket connection:", error);
    return false;
  }

  stompClient.onConnect = () => {
    console.log("[WebSocket] Connection established successfully");

    // Add a small delay to ensure the connection is fully established
    setTimeout(() => {
      try {
        // Subscribe to personal messages
        console.log(
          `[WebSocket] Subscribing to messages at: /user/${userId}/queue/messages`
        );
        const messageSubscription = stompClient?.subscribe(
          `/user/${userId}/queue/messages`,
          (message: IMessage) => {
            console.log("[WebSocket] Raw message received:", message);
            try {
              console.log("[WebSocket] Parsing message body:", message.body);
              const receivedMessage = JSON.parse(message.body) as Message;
              console.log("[WebSocket] Parsed message:", receivedMessage);

              // Check if this is a message from the current user (a confirmation)
              const currentUserId = store.getState().user.userInfo?.id;
              const isFromCurrentUser = receivedMessage.sender.id === currentUserId;
              
              console.log("[WebSocket] Message from current user?", isFromCurrentUser);
              console.log("[WebSocket] Current user ID:", currentUserId);
              console.log("[WebSocket] Message sender ID:", receivedMessage.sender.id);
              
              // Check if we already have a temporary message for this in the store
              const messages = store.getState().chat.messages;
              const hasTempMessage = messages.some(msg => 
                msg.id.toString().startsWith('temp-') && 
                msg.content === receivedMessage.content &&
                msg.sender.id === receivedMessage.sender.id &&
                msg.receiver.id === receivedMessage.receiver.id
              );
              
              console.log("[WebSocket] Has matching temp message?", hasTempMessage);
              
              // Dispatch the message to Redux store
              console.log("[WebSocket] Dispatching message to Redux store");
              store.dispatch(addMessage(receivedMessage));
              console.log("[WebSocket] Message dispatched successfully");
            } catch (error) {
              console.error(
                "[WebSocket] Error processing WebSocket message:",
                error
              );
              console.error("[WebSocket] Problem message body:", message.body);
            }
          }
        );
        console.log(
          "[WebSocket] Message subscription created:",
          messageSubscription ? "Success" : "Failed"
        );

        // Also subscribe to the general topic for messages
        console.log(
          `[WebSocket] Subscribing to general topic: /topic/messages`
        );
        const generalMessageSubscription = stompClient?.subscribe(
          `/topic/messages`,
          (message: IMessage) => {
            console.log("[WebSocket] Raw general message received:", message);
            try {
              console.log(
                "[WebSocket] Parsing general message body:",
                message.body
              );
              const receivedMessage = JSON.parse(message.body) as Message;
              console.log(
                "[WebSocket] Parsed general message:",
                receivedMessage
              );

              // Dispatch the message to Redux store
              console.log(
                "[WebSocket] Dispatching general message to Redux store"
              );
              store.dispatch(addMessage(receivedMessage));
              console.log(
                "[WebSocket] General message dispatched successfully"
              );
            } catch (error) {
              console.error(
                "[WebSocket] Error processing general WebSocket message:",
                error
              );
              console.error(
                "[WebSocket] Problem general message body:",
                message.body
              );
            }
          }
        );
        console.log(
          "[WebSocket] General message subscription created:",
          generalMessageSubscription ? "Success" : "Failed"
        );

        // Subscribe to typing notifications
        console.log(
          `[WebSocket] Subscribing to typing notifications at: /user/${userId}/queue/typing`
        );
        const typingSubscription = stompClient?.subscribe(
          `/user/${userId}/queue/typing`,
          (message: IMessage) => {
            console.log(
              "[WebSocket] Raw typing notification received:",
              message
            );
            try {
              const typingNotification = JSON.parse(message.body);
              console.log(
                "[WebSocket] Typing notification parsed:",
                typingNotification
              );
              // Handle typing notification (could dispatch to Redux if needed)
            } catch (error) {
              console.error(
                "[WebSocket] Error processing typing notification:",
                error
              );
            }
          }
        );
        console.log(
          "[WebSocket] Typing subscription created:",
          typingSubscription ? "Success" : "Failed"
        );

        // Subscribe to read receipts
        console.log(
          `[WebSocket] Subscribing to read receipts at: /user/${userId}/queue/read-receipts`
        );
        const readReceiptSubscription = stompClient?.subscribe(
          `/user/${userId}/queue/read-receipts`,
          (message: IMessage) => {
            console.log("[WebSocket] Raw read receipt received:", message);
            try {
              const readReceipt = JSON.parse(message.body);
              console.log("[WebSocket] Read receipt parsed:", readReceipt);

              // Update the UI to show messages as read by dispatching an action to Redux
              console.log(
                "[WebSocket] Messages marked as read for contact:",
                readReceipt.contactId
              );

              // Dispatch the action to update the UI
              store.dispatch(
                updateMessagesReadStatus({ contactId: readReceipt.contactId })
              );
            } catch (error) {
              console.error(
                "[WebSocket] Error processing read receipt:",
                error
              );
            }
          }
        );
        console.log(
          "[WebSocket] Read receipt subscription created:",
          readReceiptSubscription ? "Success" : "Failed"
        );
        
        // Subscribe to contact requests
        console.log(
          `[WebSocket] Subscribing to contact requests at: /user/${userId}/queue/contact-requests`
        );
        const contactRequestSubscription = stompClient?.subscribe(
          `/user/${userId}/queue/contact-requests`,
          (message: IMessage) => {
            console.log("[WebSocket] Raw contact request received:", message);
            try {
              const contactRequest = JSON.parse(message.body);
              console.log("[WebSocket] Contact request parsed:", contactRequest);
              
              // Dispatch an action to update the UI and show a notification
              // We'll import the action from chatSlice
              import("../store/chatSlice").then(({ fetchPendingRequests }) => {
                store.dispatch(fetchPendingRequests());
                
                // Show a browser notification if supported
                if ("Notification" in window) {
                  if (Notification.permission === "granted") {
                    new Notification("New Contact Request", {
                      body: `${contactRequest.senderName} wants to connect with you`,
                      icon: "/favicon.ico"
                    });
                  } else if (Notification.permission !== "denied") {
                    Notification.requestPermission().then(permission => {
                      if (permission === "granted") {
                        new Notification("New Contact Request", {
                          body: `${contactRequest.senderName} wants to connect with you`,
                          icon: "/favicon.ico"
                        });
                      }
                    });
                  }
                }
              });
            } catch (error) {
              console.error(
                "[WebSocket] Error processing contact request:",
                error
              );
            }
          }
        );
        console.log(
          "[WebSocket] Contact request subscription created:",
          contactRequestSubscription ? "Success" : "Failed"
        );
        
        // Subscribe to contact request responses
        console.log(
          `[WebSocket] Subscribing to contact responses at: /user/${userId}/queue/contact-responses`
        );
        const contactResponseSubscription = stompClient?.subscribe(
          `/user/${userId}/queue/contact-responses`,
          (message: IMessage) => {
            console.log("[WebSocket] Raw contact response received:", message);
            try {
              const contactResponse = JSON.parse(message.body);
              console.log("[WebSocket] Contact response parsed:", contactResponse);
              
              // Dispatch an action to update the UI and show a notification
              // We'll import the action from chatSlice
              import("../store/chatSlice").then(({ fetchContacts }) => {
                // Refresh the contacts list to get the updated status
                store.dispatch(fetchContacts());
                
                // Show a browser notification if supported
                if ("Notification" in window) {
                  if (Notification.permission === "granted") {
                    new Notification(
                      contactResponse.accepted ? "Contact Request Accepted" : "Contact Request Rejected", 
                      {
                        body: contactResponse.accepted 
                          ? `${contactResponse.responderName} accepted your contact request` 
                          : `${contactResponse.responderName} rejected your contact request`,
                        icon: "/favicon.ico"
                      }
                    );
                  } else if (Notification.permission !== "denied") {
                    Notification.requestPermission().then(permission => {
                      if (permission === "granted") {
                        new Notification(
                          contactResponse.accepted ? "Contact Request Accepted" : "Contact Request Rejected", 
                          {
                            body: contactResponse.accepted 
                              ? `${contactResponse.responderName} accepted your contact request` 
                              : `${contactResponse.responderName} rejected your contact request`,
                            icon: "/favicon.ico"
                          }
                        );
                      }
                    });
                  }
                }
              });
            } catch (error) {
              console.error(
                "[WebSocket] Error processing contact response:",
                error
              );
            }
          }
        );
        console.log(
          "[WebSocket] Contact response subscription created:",
          contactResponseSubscription ? "Success" : "Failed"
        );
      } catch (error) {
        console.error("[WebSocket] Error setting up subscriptions:", error);
      }
    }, 100); // 100ms delay should be enough
  };

  stompClient.onStompError = (frame) => {
    console.error("[WebSocket] STOMP protocol error:", frame);
    console.error(
      "[WebSocket] STOMP error details - Command:",
      frame.command,
      "Headers:",
      frame.headers,
      "Body:",
      frame.body
    );
  };

  stompClient.onWebSocketError = (event) => {
    console.error("[WebSocket] WebSocket connection error:", event);
  };

  stompClient.onWebSocketClose = (event) => {
    console.warn("[WebSocket] WebSocket connection closed:", event);
    console.warn(
      "[WebSocket] Close details - Code:",
      event.code,
      "Reason:",
      event.reason,
      "Clean:",
      event.wasClean
    );
  };

  try {
    console.log("[WebSocket] Activating STOMP client");

    // Add receipt callback - using receiptHeaders instead
    // Note: onReceipt is not available in the Client type
    console.log("[WebSocket] Setting up receipt handling via debug logs");

    // Add debug callback for all frames
    const originalDebug = stompClient.debug;
    stompClient.debug = (msg) => {
      console.log("[WebSocket] STOMP Frame:", msg);
      
      // Check for RECEIPT frames to handle message confirmations
      if (typeof msg === 'string' && msg.includes('RECEIPT')) {
        console.log("[WebSocket] Receipt frame detected:", msg);
        // Extract receipt-id if present
        const match = msg.match(/receipt-id:([^\n]+)/);
        if (match && match[1]) {
          const receiptId = match[1].trim();
          console.log("[WebSocket] Message receipt confirmed with ID:", receiptId);
          
          // Clear the fallback timeout for this receipt ID
          if ((window as any).receiptTimeouts && (window as any).receiptTimeouts[receiptId]) {
            console.log("[WebSocket] Clearing fallback timeout for receipt:", receiptId);
            clearTimeout((window as any).receiptTimeouts[receiptId]);
            delete (window as any).receiptTimeouts[receiptId];
          }
        }
      }
      
      if (originalDebug) {
        originalDebug(msg);
      }
    };

    stompClient.activate();
    console.log("[WebSocket] STOMP client activation initiated");

    // Add a timeout to check connection status
    setTimeout(() => {
      if (stompClient && !stompClient.connected) {
        console.warn("[WebSocket] Connection not established after 5 seconds");
        // Try to reconnect
        try {
          console.log("[WebSocket] Attempting to reconnect...");
          stompClient.deactivate();
          setTimeout(() => {
            if (stompClient) {
              stompClient.activate();
            }
          }, 1000);
        } catch (reconnectError) {
          console.error(
            "[WebSocket] Error during reconnection attempt:",
            reconnectError
          );
        }
      } else {
        console.log("[WebSocket] Connection verified after 5 seconds");
      }
    }, 5000);
  } catch (error) {
    console.error("[WebSocket] Error activating STOMP client:", error);
    return false;
  }

  return true;
};

export const disconnectWebSocket = () => {
  console.log("[WebSocket] Disconnect requested");

  if (stompClient) {
    console.log(
      "[WebSocket] STOMP client exists, connection state:",
      stompClient.connected ? "Connected" : "Disconnected"
    );

    if (stompClient.connected) {
      console.log("[WebSocket] Deactivating connected client");
      stompClient.deactivate();
      console.log("[WebSocket] Deactivation initiated");
    } else {
      console.log(
        "[WebSocket] Client exists but not connected, no need to disconnect"
      );
    }
  } else {
    console.log("[WebSocket] No STOMP client to disconnect");
  }
};

export const sendMessageViaWebSocket = (
  content: string,
  receiverId: string,
  persistent: boolean = true
) => {
  console.log("[WebSocket] Attempting to send message:", {
    content,
    receiverId,
    persistent,
  });

  if (stompClient && stompClient.connected) {
    console.log("[WebSocket] Client is connected, publishing message");

    try {
      const messageBody = JSON.stringify({
        content,
        receiverId,
        persistent,
      });

      console.log("[WebSocket] Message body prepared:", messageBody);

      // Generate a unique receipt ID for this message
      const receiptId = `msg-${Date.now()}`;
      
      // Add a receipt header to get confirmation of delivery
      const headers: StompHeaders = {
        "receipt": receiptId,
      };

      console.log("[WebSocket] Publishing message with headers:", headers);

      // Set up a fallback in case we don't receive a receipt
      const fallbackTimeout = setTimeout(() => {
        console.warn(`[WebSocket] No receipt received for message ${receiptId} after 5 seconds`);
        console.warn("[WebSocket] Falling back to HTTP method");
        
        // Import the sendMessage function from chatService and dispatch the sendMessageThunk
        import("./chatService").then(({ sendMessage }) => {
          console.log("[WebSocket] Sending message via HTTP fallback");
          sendMessage(content, receiverId, persistent)
            .then(response => {
              console.log("[WebSocket] HTTP fallback successful:", response);
              
              // Import and dispatch the addMessage action to update the UI
              import("../store/chatSlice").then(({ addMessage }) => {
                import("../store/store").then(({ default: store }) => {
                  store.dispatch(addMessage(response));
                });
              });
            })
            .catch(error => {
              console.error("[WebSocket] HTTP fallback failed:", error);
            });
        });
      }, 5000);
      
      // Store the fallback timeout in a map keyed by receipt ID
      // This would be defined at the module level
      (window as any).receiptTimeouts = (window as any).receiptTimeouts || {};
      (window as any).receiptTimeouts[receiptId] = fallbackTimeout;
      
      // Publish the message
      stompClient.publish({
        destination: "/app/chat.sendMessage",
        body: messageBody,
        headers: headers,
      });

      console.log("[WebSocket] Message published successfully");

      return true;
    } catch (error) {
      console.error("[WebSocket] Error publishing message:", error);
      return false;
    }
  } else {
    console.warn("[WebSocket] Client not connected, cannot send message");
    if (stompClient) {
      console.warn(
        "[WebSocket] Client exists but connection state:",
        stompClient.connected
      );
    } else {
      console.warn("[WebSocket] StompClient is null");
    }
    return false;
  }
};

export const sendTypingNotification = (
  receiverId: string,
  isTyping: boolean
) => {
  if (stompClient && stompClient.connected) {
    stompClient.publish({
      destination: "/app/chat.typing",
      body: JSON.stringify({
        receiverId,
        typing: isTyping,
      }),
    });
  }
};

// Mark messages as read via WebSocket
export const markMessagesAsReadViaWebSocket = (contactId: string) => {
  console.log("[WebSocket] Marking messages as read for contact:", contactId);

  if (stompClient && stompClient.connected) {
    console.log("[WebSocket] Client is connected, sending read status update");

    try {
      // Add a receipt header to get confirmation of delivery
      const headers: StompHeaders = {
        "receipt": `read-${Date.now()}`,
      };

      console.log("[WebSocket] Publishing read status with headers:", headers);

      stompClient.publish({
        destination: "/app/chat.markAsRead",
        body: JSON.stringify({
          contactId,
        }),
        headers: headers,
      });

      console.log("[WebSocket] Read status published successfully");
      return true;
    } catch (error) {
      console.error("[WebSocket] Error publishing read status:", error);
      return false;
    }
  } else {
    console.warn("[WebSocket] Client not connected, cannot send read status");
    return false;
  }
};

