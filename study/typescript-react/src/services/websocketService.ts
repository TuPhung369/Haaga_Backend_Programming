import { Client, IMessage, StompHeaders } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import store from "../store/store";
import { addMessage, updateMessagesReadStatus } from "../store/chatSlice";
import { Message } from "./chatService";

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

// Get JWT token from Redux store
const getAuthToken = () => {
  const state = store.getState();
  return state.auth.token;
};

let stompClient: Client | null = null;

// Forward declaration of disconnectWebSocket
export const disconnectWebSocket = () => {
  if (stompClient) {
    console.log("[WebSocket] Disconnecting WebSocket");
    try {
      stompClient.deactivate();
      console.log("[WebSocket] Deactivation initiated");
    } catch (error) {
      console.error("[WebSocket] Error during deactivation:", error);
    }
    stompClient = null;
  } else {
    console.log("[WebSocket] No active connection to disconnect");
  }
};

export const connectWebSocket = (userId: string): boolean => {

  if (stompClient) {
    console.log("[WebSocket] Existing client found, disconnecting first");
    disconnectWebSocket();
  }

  try {
    // Get the JWT token
    const token = getAuthToken();

    // Create STOMP headers with authentication
    const connectHeaders: StompHeaders = {};
    if (token) {
      connectHeaders["Authorization"] = `Bearer ${token}`;
      connectHeaders["X-Auth-Token"] = token;
    } else {
      console.warn("[WebSocket] No token available for authentication");
    }

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
    return false;
  }

  // Capture userId in a closure for use in the onConnect callback
  const capturedUserId = userId;

  // Check if stompClient is null before accessing its properties
  if (stompClient) {
    stompClient.onConnect = () => {

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
                  console.log("[WebSocket] Status update parsed:", statusUpdate);
                  
                  // Update the Redux store with the new status
                  if (statusUpdate.userId && statusUpdate.status) {
                    // Import the necessary actions to update contact status
                    import("../store/chatSlice").then(({ updateContactStatus }) => {
                      // Only update if we have the updateContactStatus action
                      if (updateContactStatus) {
                        store.dispatch(updateContactStatus({
                          contactId: statusUpdate.userId,
                          status: statusUpdate.status
                        }));
                        console.log("[WebSocket] Contact status updated in Redux store");
                      } else {
                        console.warn("[WebSocket] updateContactStatus action not found");
                      }
                    });
                  }
                } catch (error) {
                  console.error("[WebSocket] Error processing status update:", error);
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
                        "[WebSocket] Found potential recipients who read our messages:",
                        otherUserIds
                      );

                      // Update read status only for the currently selected contact
                      if (otherUserIds.length > 0 && selectedContact) {
                        otherUserIds.forEach((recipientId) => {
                          if (recipientId === selectedContact.id) {
                            console.log(
                              "[WebSocket] Updating read status for currently selected contact:",
                              recipientId
                            );
                            store.dispatch(
                              updateMessagesReadStatus({
                                contactId: recipientId,
                                currentUserId: currentUserId,
                              })
                            );
                          } else {
                            console.log(
                              "[WebSocket] Skipping read status update for non-selected contact:",
                              recipientId
                            );
                          }
                        });
                      }
                    }
                  } else {
                    console.log(
                      "[WebSocket] This is a confirmation that we marked messages as read"
                    );

                    // This is the normal case - we marked messages from this contact as read
                    store.dispatch(
                      updateMessagesReadStatus({
                        contactId: readReceipt.contactId,
                        currentUserId: currentUserId,
                      })
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

            // Subscribe to contact requests
            console.log(
              `[WebSocket] Subscribing to contact requests at: /user/${capturedUserId}/queue/contact-requests`
            );
            const contactRequestSubscription = stompClient.subscribe(
              `/user/${capturedUserId}/queue/contact-requests`,
              (message: IMessage) => {
                console.log(
                  "[WebSocket] Raw contact request received:",
                  message
                );
                try {
                  const contactRequest = JSON.parse(message.body);
                  console.log(
                    "[WebSocket] Contact request parsed:",
                    contactRequest
                  );

                  // Dispatch an action to update the UI and show a notification
                  // We'll import the action from chatSlice
                  import("../store/chatSlice").then(
                    ({ fetchPendingRequests }) => {
                      store.dispatch(fetchPendingRequests());

                      // Show a browser notification if supported
                      if ("Notification" in window) {
                        if (Notification.permission === "granted") {
                          new Notification("New Contact Request", {
                            body: `${contactRequest.senderName} wants to connect with you`,
                            icon: "/favicon.ico",
                          });
                        } else if (Notification.permission !== "denied") {
                          Notification.requestPermission().then(
                            (permission) => {
                              if (permission === "granted") {
                                new Notification("New Contact Request", {
                                  body: `${contactRequest.senderName} wants to connect with you`,
                                  icon: "/favicon.ico",
                                });
                              }
                            }
                          );
                        }
                      }
                    }
                  );
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
              `[WebSocket] Subscribing to contact responses at: /user/${capturedUserId}/queue/contact-responses`
            );
            const contactResponseSubscription = stompClient.subscribe(
              `/user/${capturedUserId}/queue/contact-responses`,
              (message: IMessage) => {
                console.log(
                  "[WebSocket] Raw contact response received:",
                  message
                );
                try {
                  const contactResponse = JSON.parse(message.body);
                  console.log(
                    "[WebSocket] Contact response parsed:",
                    contactResponse
                  );

                  // Dispatch an action to update the UI and show a notification
                  // We'll import the action from chatSlice
                  import("../store/chatSlice").then(({ fetchContacts }) => {
                    // Refresh the contacts list to get the updated status
                    store.dispatch(fetchContacts());

                    // Show a browser notification if supported
                    if ("Notification" in window) {
                      if (Notification.permission === "granted") {
                        new Notification(
                          contactResponse.accepted
                            ? "Contact Request Accepted"
                            : "Contact Request Rejected",
                          {
                            body: contactResponse.accepted
                              ? `${contactResponse.responderName} accepted your contact request`
                              : `${contactResponse.responderName} rejected your contact request`,
                            icon: "/favicon.ico",
                          }
                        );
                      } else if (Notification.permission !== "denied") {
                        Notification.requestPermission().then((permission) => {
                          if (permission === "granted") {
                            new Notification(
                              contactResponse.accepted
                                ? "Contact Request Accepted"
                                : "Contact Request Rejected",
                              {
                                body: contactResponse.accepted
                                  ? `${contactResponse.responderName} accepted your contact request`
                                  : `${contactResponse.responderName} rejected your contact request`,
                                icon: "/favicon.ico",
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
          }
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

    // Activate the client
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
  }

  return true;
};

export const sendMessageViaWebSocket = (
  content: string,
  receiverId: string,
  persistent = true
): boolean => {
  console.log("[WebSocket] Attempting to send message via WebSocket");
  console.log("[WebSocket] Message persistence setting:", persistent);

  if (!stompClient || !stompClient.connected) {
    console.warn("[WebSocket] No active connection, cannot send message");
    return false;
  }

  try {
    // Generate a unique receipt ID for this message
    const receiptId = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    console.log("[WebSocket] Generated receipt ID:", receiptId);

    // Create message payload
    const messageBody = JSON.stringify({
      content,
      receiverId,
      persistent,
    });
    console.log("[WebSocket] Message payload:", messageBody);

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
        console.warn("[WebSocket] Falling back to HTTP method");

        // Import the sendMessage function from chatService and dispatch the sendMessageThunk
        import("./chatService").then(({ sendMessage }) => {
          console.log("[WebSocket] Sending message via HTTP fallback");
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
  console.log("[WebSocket] Marking messages as read for contact:", contactId);

  if (!stompClient || !stompClient.connected) {
    console.warn(
      "[WebSocket] No active connection, cannot mark messages as read"
    );
    return false;
  }

  try {
    // Get current user ID from store for logging
    const currentUserId = store.getState().user.userInfo?.id;
    console.log("[WebSocket] Current user ID:", currentUserId);

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

    // Set up a fallback timeout in case we don't get a receipt, but with a longer timeout
    // and only if the window has focus (to prevent unnecessary HTTP calls)
    const fallbackTimeout = window.setTimeout(() => {
      // Only proceed with fallback if the window has focus
      if (!document.hasFocus()) {
        console.log(
          "[WebSocket] Window doesn't have focus, skipping HTTP fallback for read operation"
        );
        return;
      }

      console.warn(
        "[WebSocket] No receipt received for read operation, falling back to HTTP"
      );

      // If we don't get a receipt within 10 seconds, fall back to HTTP
      const extendedWindow = window as ExtendedWindow;
      if (
        extendedWindow.receiptTimeouts &&
        extendedWindow.receiptTimeouts[receiptId]
      ) {
        // Check if the contact is still selected before proceeding with HTTP fallback
        const selectedContact = store.getState().chat.selectedContact;
        if (!selectedContact || selectedContact.id !== contactId) {
          console.log(
            "[WebSocket] Contact is no longer selected, skipping HTTP fallback"
          );
          return;
        }

        console.warn(
          "[WebSocket] Falling back to HTTP method for marking messages as read"
        );

        // Import the markAsRead function from chatSlice and dispatch it
        import("../store/chatSlice").then(
          ({ markAsRead, updateMessagesReadStatus }) => {
            import("../store/store").then(({ default: store }) => {
              console.log(
                "[WebSocket] Marking messages as read via HTTP fallback"
              );

              // First check if there are any unread messages before updating
              const messages = store.getState().chat.messages;
              const hasUnreadMessages = messages.some(
                (msg) =>
                  msg.sender.id === contactId &&
                  msg.receiver.id === currentUserId &&
                  !msg.read
              );

              if (!hasUnreadMessages) {
                console.log(
                  "[WebSocket] No unread messages found, skipping HTTP fallback"
                );
                return;
              }

              // First update the UI immediately to provide feedback
              store.dispatch(
                updateMessagesReadStatus({
                  contactId,
                  currentUserId,
                })
              );

              store
                .dispatch(markAsRead(contactId))
                .then(() => {
                  console.log(
                    "[WebSocket] HTTP fallback for marking messages as read successful"
                  );

                  // Update the UI to show messages as read, but only if needed
                  store.dispatch(
                    updateMessagesReadStatus({
                      contactId,
                      currentUserId,
                    })
                  );

                  // No longer forcing a second update to prevent unnecessary re-renders
                  console.log(
                    "[WebSocket] Skipping forced second UI update after HTTP fallback to prevent unnecessary re-renders"
                  );
                })
                .catch((error) => {
                  console.error(
                    "[WebSocket] HTTP fallback for marking messages as read failed:",
                    error
                  );
                });
            });
          }
        );
      }
    }, 10000); // Increased to 10 seconds to reduce unnecessary fallbacks

    // Store the fallback timeout in a map keyed by receipt ID
    const extendedWindow = window as ExtendedWindow;
    extendedWindow.receiptTimeouts = extendedWindow.receiptTimeouts || {};
    extendedWindow.receiptTimeouts[receiptId] = fallbackTimeout;

    // Also store by message ID in case we get a response but not a receipt
    extendedWindow.messageTimeouts = extendedWindow.messageTimeouts || {};
    extendedWindow.messageTimeouts[messageId] = fallbackTimeout;

    // Subscribe to the response from the server
    if (stompClient) {
      const subscription = stompClient.subscribe(
        `/user/queue/read-receipts-ack`,
        (message: IMessage) => {
          console.log(
            "[WebSocket] Received read receipt acknowledgement:",
            message
          );
          try {
            const response = JSON.parse(message.body);
            console.log(
              "[WebSocket] Parsed read receipt acknowledgement:",
              response
            );

            // Clear the fallback timeout
            const extWindow = window as ExtendedWindow;
            if (
              extWindow.receiptTimeouts &&
              extWindow.receiptTimeouts[receiptId]
            ) {
              clearTimeout(extWindow.receiptTimeouts[receiptId]);
              delete extWindow.receiptTimeouts[receiptId];
              console.log(
                `[WebSocket] Cleared timeout for receipt: ${receiptId}`
              );
            }

            // Also clear by message ID
            if (
              extWindow.messageTimeouts &&
              extWindow.messageTimeouts[messageId]
            ) {
              clearTimeout(extWindow.messageTimeouts[messageId]);
              delete extWindow.messageTimeouts[messageId];
              console.log(
                `[WebSocket] Cleared timeout for message: ${messageId}`
              );
            }

            // Unsubscribe from the temporary subscription
            subscription.unsubscribe();

            // Get current user ID from store
            const currentUserId = store.getState().user.userInfo?.id;
            console.log(
              "[WebSocket] Current user ID for read update:",
              currentUserId
            );

            // First update the UI immediately to provide feedback
            store.dispatch(
              updateMessagesReadStatus({
                contactId,
                currentUserId,
              })
            );
            console.log(
              "[WebSocket] Immediate UI update dispatched with currentUserId:",
              currentUserId
            );

            // Update the UI to show messages as read
            import("../store/chatSlice").then(
              ({ updateMessagesReadStatus }) => {
                import("../store/store").then(({ default: store }) => {
                  console.log(
                    "[WebSocket] Updating read status in Redux store with currentUserId:",
                    currentUserId
                  );
                  store.dispatch(
                    updateMessagesReadStatus({
                      contactId,
                      currentUserId,
                    })
                  );

                  // No longer forcing a second update to prevent unnecessary re-renders
                  console.log(
                    "[WebSocket] Skipping forced second UI update to prevent unnecessary re-renders"
                  );
                });
              }
            );
          } catch (error) {
            console.error(
              "[WebSocket] Error processing read receipt acknowledgement:",
              error
            );
          }
        }
      );

      // Send the read receipt
      stompClient.publish({
        destination: "/app/chat.markAsRead",
        body: readReceiptBody,
        headers: {
          "receipt": receiptId,
        },
      });
      console.log("[WebSocket] Read receipt sent with receipt ID:", receiptId);
      console.log("[WebSocket] Read receipt payload:", readReceiptBody);

      // Log that we're expecting a notification to be sent to the sender
      console.log(
        "[WebSocket] Server should now notify the sender (contactId) that their messages were read by:",
        currentUserId
      );
    }
    return true;
  } catch (error) {
    console.error(
      "[WebSocket] Error marking messages as read via WebSocket:",
      error
    );
    return false;
  }
};

/**
 * Send a status update via WebSocket
 * @param status The new status (online, away, busy, offline)
 * @returns true if the status was sent successfully, false otherwise
 */
export const sendStatusUpdateViaWebSocket = (
  status: "online" | "away" | "busy" | "offline"
): boolean => {
  try {
    console.log("[WebSocket] Sending status update via WebSocket:", status);

    if (!stompClient || !stompClient.connected) {
      console.warn("[WebSocket] Not connected, cannot send status update");
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

