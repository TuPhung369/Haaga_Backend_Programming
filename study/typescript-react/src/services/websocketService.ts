import { Client, IMessage, StompHeaders } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import store from "../store/store";
import { addMessage, updateMessagesReadStatus } from "../store/chatSlice";
import { Message, markMessagesAsRead } from "./chatService";

// Define interfaces for window extensions
interface ReceiptTimeouts {
  [key: string]: number;
}

interface MessageTimeouts {
  [key: string]: number;
}

interface ExtendedWindow extends Window {
  receiptTimeouts?: ReceiptTimeouts;
  messageTimeouts?: MessageTimeouts;
}

// Use the same API_URL as in baseService.ts
const API_BASE_URI =
  import.meta.env.VITE_API_BASE_URI || "http://localhost:9095/identify_service";

let stompClient: Client | null = null;

// Store the connection callback for use in disconnectWebSocket
let connectionStatusCallback: ((isConnected: boolean) => void) | null = null;

// Forward declaration of disconnectWebSocket
export const disconnectWebSocket = () => {
  if (stompClient) {
    console.log("[WebSocket] Disconnecting WebSocket");
    try {
      stompClient.deactivate();
      console.log("[WebSocket] Deactivation initiated");

      // Notify about disconnection
      if (connectionStatusCallback) {
        connectionStatusCallback(false);
      }
    } catch (error) {
      console.error("[WebSocket] Error during deactivation:", error);
    }
    stompClient = null;
  } else {
    console.log("[WebSocket] No active connection to disconnect");
  }
};

export const connectWebSocket = (
  userId: string,
  connectionCallback?: (isConnected: boolean) => void
): boolean => {
  // Store the callback for later use
  if (connectionCallback) {
    connectionStatusCallback = connectionCallback;
  }

  if (stompClient) {
    console.log("[WebSocket] Existing client found, disconnecting first");
    disconnectWebSocket();
  }

  try {
    // Create STOMP headers with authentication
    const connectHeaders: StompHeaders = {};

    // Create SockJS instance with proper URL
    const wsUrl = `${API_BASE_URI}/ws-messaging`;
    const socket = new SockJS(wsUrl);

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

    // Set up a receipt handler using onUnhandledReceipt
    if (stompClient) {
      stompClient.onUnhandledReceipt = (frame) => {
        const receiptId = frame.headers.receipt;

        // Get the receipt timeouts from the window object
        const extendedWindow = window as ExtendedWindow;

        if (
          receiptId &&
          extendedWindow.receiptTimeouts &&
          extendedWindow.receiptTimeouts[receiptId]
        ) {
          clearTimeout(extendedWindow.receiptTimeouts[receiptId]);
          delete extendedWindow.receiptTimeouts[receiptId];
        }
      };
    }
  } catch (error) {
    console.error("[WebSocket] Error creating WebSocket connection:", error);
    if (connectionCallback) {
      connectionCallback(false);
    }
    return false;
  }

  // Capture userId in a closure for use in the onConnect callback
  const capturedUserId = userId;

  // Check if stompClient is null before accessing its properties
  if (stompClient) {
    // Handle disconnection events
    stompClient.onDisconnect = () => {
      console.log("[WebSocket] Connection closed");
      if (connectionCallback) {
        connectionCallback(false);
      }
    };

    // Handle connection errors
    stompClient.onStompError = (frame) => {
      console.error("[WebSocket] Connection error:", frame);
      if (connectionCallback) {
        connectionCallback(false);
      }
    };

    // Handle connection events
    stompClient.onConnect = () => {
      console.log("[WebSocket] Connection established successfully");
      if (connectionCallback) {
        connectionCallback(true);
      }

      // Add a small delay to ensure the connection is fully established
      setTimeout(() => {
        try {
          // Subscribe to personal messages
          if (stompClient) {
            const messageSubscription = stompClient.subscribe(
              `/user/${capturedUserId}/queue/messages`,
              (message: IMessage) => {
                try {
                  console.log(
                    "[WebSocket] Parsing message body:",
                    message.body
                  );
                  const receivedMessage = JSON.parse(message.body) as Message;

                  // Check if this is a message from the current user (a confirmation)
                  const currentUserId = store.getState().user.userInfo?.id;
                  const isFromCurrentUser =
                    receivedMessage.sender.id === currentUserId;

                  console.log(
                    "[WebSocket] Message from current user?",
                    isFromCurrentUser
                  );
                  console.log("[WebSocket] Current user ID:", currentUserId);
                  console.log(
                    "[WebSocket] Message sender ID:",
                    receivedMessage.sender.id
                  );

                  // Check if we already have a temporary message for this in the store
                  const messages = store.getState().chat.messages;
                  const hasTempMessage = messages.some(
                    (msg) =>
                      msg.id.toString().startsWith("temp-") &&
                      msg.content === receivedMessage.content &&
                      msg.sender.id === receivedMessage.sender.id &&
                      msg.receiver.id === receivedMessage.receiver.id
                  );

                  console.log(
                    "[WebSocket] Has matching temp message?",
                    hasTempMessage
                  );

                  // Dispatch the message to Redux store
                  console.log("[WebSocket] Dispatching message to Redux store");
                  store.dispatch(addMessage(receivedMessage));
                  console.log("[WebSocket] Message dispatched successfully");
                } catch (error) {
                  console.error(
                    "[WebSocket] Error processing WebSocket message:",
                    error
                  );
                  console.error(
                    "[WebSocket] Problem message body:",
                    message.body
                  );
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
            const generalMessageSubscription = stompClient.subscribe(
              `/topic/messages`,
              (message: IMessage) => {
                console.log(
                  "[WebSocket] Raw general message received:",
                  message
                );
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
              `[WebSocket] Subscribing to typing notifications at: /user/${capturedUserId}/queue/typing`
            );
            const typingSubscription = stompClient.subscribe(
              `/user/${capturedUserId}/queue/typing`,
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

            // Subscribe to user status updates
            console.log(
              `[WebSocket] Subscribing to user status updates at: /topic/user-status`
            );
            const statusSubscription = stompClient.subscribe(
              `/topic/user-status`,
              (message: IMessage) => {
                console.log("[WebSocket] Raw status update received:", message);
                try {
                  const statusUpdate = JSON.parse(message.body);
                  console.log(
                    "[WebSocket] Status update parsed:",
                    statusUpdate
                  );

                  // Update the Redux store with the new status
                  if (statusUpdate.userId && statusUpdate.status) {
                    // Import the necessary actions to update contact status
                    import("../store/chatSlice").then(
                      ({ updateContactStatus }) => {
                        // Only update if we have the updateContactStatus action
                        if (updateContactStatus) {
                          store.dispatch(
                            updateContactStatus({
                              contactId: statusUpdate.userId,
                              status: statusUpdate.status,
                            })
                          );
                          console.log(
                            "[WebSocket] Contact status updated in Redux store"
                          );
                        } else {
                          console.warn(
                            "[WebSocket] updateContactStatus action not found"
                          );
                        }
                      }
                    );
                  }
                } catch (error) {
                  console.error(
                    "[WebSocket] Error processing status update:",
                    error
                  );
                }
              }
            );
            console.log(
              "[WebSocket] Status subscription created:",
              statusSubscription ? "Success" : "Failed"
            );

            // Subscribe to read receipts
            console.log(
              `[WebSocket] Subscribing to read receipts at: /user/${capturedUserId}/queue/read-receipts`
            );
            const readReceiptSubscription = stompClient.subscribe(
              `/user/${capturedUserId}/queue/read-receipts`,
              (message: IMessage) => {
                console.log("[WebSocket] Raw read receipt received:", message);
                try {
                  const readReceipt = JSON.parse(message.body);
                  console.log("[WebSocket] Read receipt parsed:", readReceipt);
                  console.log(
                    "[WebSocket] Read receipt type:",
                    readReceipt.type
                  );
                  console.log(
                    "[WebSocket] Read receipt contactId:",
                    readReceipt.contactId
                  );
                  console.log(
                    "[WebSocket] Read receipt readerId:",
                    readReceipt.readerId
                  );

                  // Get current user ID for logging
                  const currentUserId = store.getState().user.userInfo?.id;

                  // Update the UI to show messages as read by dispatching an action to Redux
                  console.log(
                    "[WebSocket] Messages marked as read for contact:",
                    readReceipt.contactId,
                    "Current user ID:",
                    currentUserId
                  );

                  // Log whether this is a confirmation of our read action or a notification that our messages were read
                  if (readReceipt.contactId === currentUserId) {
                    console.log(
                      "[WebSocket] *** IMPORTANT: This is a notification that our messages were read by the recipient ***"
                    );
                    console.log(
                      "[WebSocket] Messages sent to",
                      readReceipt.readerId,
                      "were read by them"
                    );

                    // When our messages are read by the recipient, we need to update the read status of messages we sent to them
                    // The contactId in this case is our own ID, but we need to update messages sent to the user who read them

                    // Extract the reader ID from the receipt
                    const readerId = readReceipt.readerId;

                    if (readerId) {
                      console.log(
                        "[WebSocket] Messages were read by user:",
                        readerId
                      );
                      console.log(
                        "[WebSocket] *** NOTIFICATION RECEIVED: Our messages to",
                        readerId,
                        "were read ***"
                      );

                      // Update read status for messages sent to this specific reader
                      console.log(
                        "[WebSocket] Updating read status for messages sent to:",
                        readerId
                      );

                      // Check if the chat with this contact is currently open
                      const selectedContact =
                        store.getState().chat.selectedContact;
                      const isContactSelected =
                        selectedContact && selectedContact.id === readerId;

                      if (isContactSelected) {
                        console.log(
                          "[WebSocket] Contact is currently selected, updating read status"
                        );
                        // Only update the UI if we're currently viewing the conversation with this contact
                        // Dispatch the action with both IDs to ensure proper updating
                        store.dispatch(
                          updateMessagesReadStatus({
                            contactId: readerId,
                            currentUserId: currentUserId,
                          })
                        );
                      } else {
                        console.log(
                          "[WebSocket] Contact is not currently selected, not updating UI"
                        );
                        // If we're not viewing this conversation, don't update the UI
                        // This prevents unnecessary re-renders
                      }
                    } else {
                      // Fallback to the old method if readerId is not provided
                      const messages = store.getState().chat.messages;
                      const selectedContact =
                        store.getState().chat.selectedContact;

                      const otherUserIds = [
                        ...new Set(
                          messages
                            .filter(
                              (msg) =>
                                msg.sender.id === currentUserId && !msg.read
                            )
                            .map((msg) => msg.receiver.id)
                        ),
                      ];

                      console.log(
                        "[WebSocket] Other user IDs with unread messages:",
                        otherUserIds
                      );

                      // Only update the UI if we're currently viewing the conversation with this contact
                      if (
                        selectedContact &&
                        otherUserIds.includes(selectedContact.id)
                      ) {
                        console.log(
                          "[WebSocket] Selected contact has unread messages, updating UI"
                        );
                        store.dispatch(
                          updateMessagesReadStatus({
                            contactId: selectedContact.id,
                            currentUserId: currentUserId,
                          })
                        );
                      }
                    }
                  } else {
                    console.log(
                      "[WebSocket] This is a notification about messages we received"
                    );
                  }
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

            // Subscribe to message updates (edits and deletions)
            console.log(
              `[WebSocket] Subscribing to message updates at: /user/${capturedUserId}/queue/message-updates`
            );
            const messageUpdatesSubscription = stompClient.subscribe(
              `/user/${capturedUserId}/queue/message-updates`,
              (message: IMessage) => {
                console.log(
                  "[WebSocket] Raw message update received:",
                  message
                );
                try {
                  const updateData = JSON.parse(message.body);
                  console.log("[WebSocket] Message update parsed:", updateData);

                  // Handle message updates based on type
                  if (updateData.type === "MESSAGE_DELETED") {
                    console.log(
                      "[WebSocket] Message deletion notification received for message:",
                      updateData.messageId
                    );

                    // Import the necessary actions to handle message deletion
                    import("../store/chatSlice").then(({ removeMessage }) => {
                      if (removeMessage) {
                        store.dispatch(removeMessage(updateData.messageId));
                        console.log(
                          "[WebSocket] Message removed from Redux store"
                        );
                      } else {
                        console.warn(
                          "[WebSocket] removeMessage action not found"
                        );
                      }
                    });
                  } else if (updateData.type === "MESSAGE_EDITED") {
                    console.log(
                      "[WebSocket] Message edit notification received for message:",
                      updateData.messageId
                    );

                    // Import the necessary actions to handle message editing
                    import("../store/chatSlice").then(
                      ({ updateMessageContent }) => {
                        if (updateMessageContent) {
                          store.dispatch(
                            updateMessageContent({
                              messageId: updateData.messageId,
                              content: updateData.content,
                            })
                          );
                          console.log(
                            "[WebSocket] Message content updated in Redux store"
                          );
                        } else {
                          console.warn(
                            "[WebSocket] updateMessageContent action not found"
                          );
                        }
                      }
                    );
                  } else {
                    // This is some other type of message update
                    console.log(
                      "[WebSocket] Unknown message update notification received:",
                      updateData.type
                    );

                    // Update the message in the Redux store if it has the right format
                    if (updateData.id) {
                      store.dispatch(addMessage(updateData));
                      console.log("[WebSocket] Message updated in Redux store");
                    }
                  }
                } catch (error) {
                  console.error(
                    "[WebSocket] Error processing message update:",
                    error
                  );
                  console.error(
                    "[WebSocket] Problem message update body:",
                    message.body
                  );
                }
              }
            );
            console.log(
              "[WebSocket] Message updates subscription created:",
              messageUpdatesSubscription ? "Success" : "Failed"
            );
          }
        } catch (error) {
          console.error("[WebSocket] Error setting up subscriptions:", error);
        }
      }, 500);
    };

    stompClient.onStompError = (frame) => {
      console.error("[WebSocket] STOMP Error:", frame);
    };

    stompClient.activate();
    console.log("[WebSocket] Connection activation initiated");
    return true;
  } else {
    console.error("[WebSocket] Failed to create STOMP client");
    return false;
  }
};

export const editMessageViaWebSocket = (
  messageId: string,
  content: string
): boolean => {
  console.log("[WebSocket] Editing message via WebSocket:", {
    messageId,
    content,
  });

  if (!stompClient || !stompClient.connected) {
    console.warn("[WebSocket] No active connection, cannot edit message");
    return false;
  }

  try {
    // Create a unique receipt ID for tracking
    const receiptId = `receipt-edit-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`;

    // Create message payload with proper Unicode encoding
    const messageBody = JSON.stringify({
      messageId,
      content: content, // Ensure content is passed as is, without additional encoding
    });

    // Send the edit message command to the server
    stompClient.publish({
      destination: "/app/chat.edit",
      body: messageBody,
      headers: { receipt: receiptId },
    });

    console.log("[WebSocket] Edit message sent successfully");
    return true;
  } catch (error) {
    console.error("[WebSocket] Error sending edit message:", error);
    return false;
  }
};

export const sendMessageViaWebSocket = (
  content: string,
  receiverId: string,
  persistent: boolean = true
): boolean => {
  console.log("[WebSocket] Sending message via WebSocket:", {
    content,
    receiverId,
    persistent,
  });

  if (!stompClient || !stompClient.connected) {
    console.warn("[WebSocket] No active connection, cannot send message");
    return false;
  }

  try {
    // Create a unique ID for this message for tracking
    const messageId = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const receiptId = `receipt-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`;

    // Create message payload with proper Unicode encoding
    const messageBody = JSON.stringify({
      content: content, // Ensure content is passed as is, without additional encoding
      receiverId,
      messageId,
      persistent,
    });

    // Set up a fallback timeout in case we don't get a receipt
    const fallbackTimeout = window.setTimeout(() => {
      console.warn(
        "[WebSocket] No receipt received for message, falling back to HTTP"
      );

      // If we don't get a receipt within 5 seconds, fall back to HTTP
      const extendedWindow = window as ExtendedWindow;
      if (
        extendedWindow.receiptTimeouts &&
        extendedWindow.receiptTimeouts[receiptId]
      ) {
        // Import the sendMessage function from chatService and use it
        import("./chatService").then(({ sendMessage }) => {
          console.log("[WebSocket] Falling back to HTTP method for message");
          sendMessage(content, receiverId, persistent)
            .then((response) => {
              console.log("[WebSocket] HTTP fallback successful:", response);

              // Import and dispatch the addMessage action to update the UI
              import("../store/chatSlice").then(({ addMessage }) => {
                import("../store/store").then(({ default: store }) => {
                  store.dispatch(addMessage(response));
                });
              });
            })
            .catch((error) => {
              console.error("[WebSocket] HTTP fallback failed:", error);
            });
        });
      }
    }, 5000);

    // Store the fallback timeout in a map keyed by receipt ID
    const extendedWindow = window as ExtendedWindow;
    extendedWindow.receiptTimeouts = extendedWindow.receiptTimeouts || {};
    extendedWindow.receiptTimeouts[receiptId] = fallbackTimeout;

    // Publish the message
    if (stompClient) {
      stompClient.publish({
        destination: "/app/chat.sendMessage",
        body: messageBody,
        headers: {
          "receipt": receiptId,
          "persistent": persistent.toString(),
        },
      });
    }

    return true;
  } catch (error) {
    console.error("[WebSocket] Error sending message via WebSocket:", error);
    return false;
  }
};

export const sendTypingNotification = (receiverId: string): boolean => {
  console.log("[WebSocket] Sending typing notification to:", receiverId);

  if (!stompClient || !stompClient.connected) {
    console.warn(
      "[WebSocket] No active connection, cannot send typing notification"
    );
    return false;
  }

  try {
    // Create notification payload
    const notificationBody = JSON.stringify({
      receiverId,
    });

    // Send the notification
    if (stompClient) {
      stompClient.publish({
        destination: "/app/chat.typing",
        body: notificationBody,
      });
      console.log("[WebSocket] Typing notification sent");
    }
    return true;
  } catch (error) {
    console.error("[WebSocket] Error sending typing notification:", error);
    return false;
  }
};

export const markMessagesAsReadViaWebSocket = (contactId: string): boolean => {
  console.log(
    "[WebSocket] *** STARTING PROCESS *** Marking messages as read for contact:",
    contactId
  );

  // Get current user ID from store for logging
  const currentUserId = store.getState().user.userInfo?.id;
  console.log("[WebSocket] Current user ID:", currentUserId);

  // IMPORTANT: Always update the database first via direct HTTP API call
  // This ensures the database is updated regardless of WebSocket status
  console.log(
    "[WebSocket] *** STEP 1: CALLING HTTP API DIRECTLY *** to update database for contact:",
    contactId
  );

  // Call the API directly to update the database
  markMessagesAsRead(contactId)
    .then((response) => {
      console.log(
        "[WebSocket] *** STEP 2: DATABASE UPDATED SUCCESSFULLY *** via direct HTTP API call for contact:",
        contactId,
        response
      );

      // Update UI after database is updated
      console.log(
        "[WebSocket] *** STEP 3: UPDATING UI *** after database update for contact:",
        contactId
      );
      store.dispatch(
        updateMessagesReadStatus({
          contactId,
          currentUserId,
        })
      );
      console.log(
        "[WebSocket] *** STEP 4: UI UPDATED SUCCESSFULLY *** for contact:",
        contactId
      );
    })
    .catch((error) => {
      console.error(
        "[WebSocket] *** ERROR: FAILED TO UPDATE DATABASE *** via direct HTTP API call for contact:",
        contactId,
        error
      );
    });

  // Check if WebSocket is connected for notification purposes
  if (!stompClient || !stompClient.connected) {
    console.warn(
      "[WebSocket] No active connection, cannot send read notification via WebSocket"
    );
    return false;
  }

  try {
    // Generate a unique receipt ID for this operation
    const receiptId = `read-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const messageId = `read-msg-${Date.now()}`;
    console.log(
      "[WebSocket] Generated receipt ID for read operation:",
      receiptId
    );

    // Create read receipt payload
    const readReceiptBody = JSON.stringify({
      contactId,
      messageId,
      readerId: currentUserId, // Add the reader's ID to the payload
    });

    // Send the read receipt notification via WebSocket
    // This is only for notification purposes, database is already updated via HTTP API
    if (stompClient) {
      // Send the read receipt
      stompClient.publish({
        destination: "/app/chat.markAsRead",
        body: readReceiptBody,
        headers: {
          "receipt": receiptId,
        },
      });
      console.log(
        "[WebSocket] Read receipt notification sent with receipt ID:",
        receiptId
      );
      console.log(
        "[WebSocket] Read receipt notification payload:",
        readReceiptBody
      );

      // Log that we're expecting a notification to be sent to the sender
      console.log(
        "[WebSocket] Server should now notify the sender (contactId) that their messages were read by:",
        currentUserId
      );
    }
    return true;
  } catch (error) {
    console.error(
      "[WebSocket] Error sending read notification via WebSocket:",
      error
    );
    // Even if WebSocket notification fails, database was already updated via HTTP API
    return false;
  }
};

/**
 * Send a status update via WebSocket
 * @param status The new status (online, away, busy, offline)
 * @returns true if the status was sent successfully, false otherwise
 */
export const sendStatusUpdateViaWebSocket = (
  status: "online" | "away" | "busy" | "offline",
  retryCount: number = 0
): boolean => {
  try {
    console.log("[WebSocket] Sending status update via WebSocket:", status);

    if (!stompClient || !stompClient.connected) {
      console.warn("[WebSocket] Not connected, cannot send status update");

      // If we have retries left and there's a stompClient instance, try to activate it
      if (retryCount < 3 && stompClient) {
        console.log(
          `[WebSocket] Attempting to reconnect (retry ${retryCount + 1}/3)...`
        );

        // Get current user ID from store for reconnection
        const currentUserId = store.getState().user.userInfo?.id;
        if (currentUserId) {
          // Try to reconnect
          stompClient.activate();

          // Schedule another attempt after a delay
          setTimeout(() => {
            sendStatusUpdateViaWebSocket(status, retryCount + 1);
          }, 1000 * (retryCount + 1)); // Increasing delay for each retry

          return true; // Return true as we're attempting to reconnect
        }
      }

      return false;
    }

    // Get current user ID from store
    const currentUserId = store.getState().user.userInfo?.id;
    if (!currentUserId) {
      console.warn(
        "[WebSocket] No user ID available, cannot send status update"
      );
      return false;
    }

    // Create a unique receipt ID
    const receiptId = `status-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`;

    // Create the status update payload
    const statusUpdatePayload = JSON.stringify({
      userId: currentUserId,
      status: status,
    });

    // Send the status update
    stompClient.publish({
      destination: "/app/user.status",
      body: statusUpdatePayload,
      headers: {
        "receipt": receiptId,
      },
    });

    console.log("[WebSocket] Status update sent with receipt ID:", receiptId);
    console.log("[WebSocket] Status update payload:", statusUpdatePayload);

    return true;
  } catch (error) {
    console.error(
      "[WebSocket] Error sending status update via WebSocket:",
      error
    );
    return false;
  }
};

