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

// Function to check for unread messages and update their status
const checkForUnreadMessages = async () => {
  try {
    console.log(
      "[WebSocket] Checking for unread messages after reconnection or activation"
    );

    // Get the current user ID
    const currentUserId = store.getState().user.userInfo?.id;
    if (!currentUserId) {
      console.log(
        "[WebSocket] No current user ID found, skipping unread message check"
      );
      return;
    }

    // Get the contacts list
    const contacts = store.getState().chat.contacts;
    if (!contacts || contacts.length === 0) {
      console.log(
        "[WebSocket] No contacts found, skipping unread message check"
      );
      return;
    }

    // Check for unread messages for each contact
    console.log("[WebSocket] Checking unread messages for all contacts");

    // Import the necessary functions
    const { getUnreadMessageCount } = await import("../services/chatService");

    // Check if there are any unread messages
    const unreadCount = await getUnreadMessageCount();

    if (unreadCount > 0) {
      console.log(
        `[WebSocket] Found ${unreadCount} unread messages, updating UI`
      );

      // Get the selected contact
      const selectedContact = store.getState().chat.selectedContact;

      // If a contact is selected, mark their messages as read
      if (selectedContact) {
        console.log(
          `[WebSocket] Marking messages from selected contact ${selectedContact.id} as read`
        );
        markMessagesAsReadViaWebSocket(selectedContact.id);
      }
    } else {
      console.log("[WebSocket] No unread messages found");
    }
  } catch (error) {
    console.error("[WebSocket] Error checking for unread messages:", error);
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

  // Set up visibility change listener to check for unread messages when tab becomes active
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        console.log(
          "[WebSocket] Document became visible, checking for unread messages"
        );
        checkForUnreadMessages();
      }
    });
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
      // Improve reconnection settings
      reconnectDelay: 2000, // Faster initial reconnect
      // maxWebSocketFrameSize is not supported in StompConfig type, removing it
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

      // Attempt to reconnect after a short delay if not explicitly disconnected
      setTimeout(() => {
        if (!stompClient) {
          console.log(
            "[WebSocket] Attempting to reconnect after disconnect..."
          );
          connectWebSocket(userId, connectionCallback);
        }
      }, 3000);
    };

    // Handle connection errors
    stompClient.onStompError = (frame) => {
      console.error("[WebSocket] Connection error:", frame);
      if (connectionCallback) {
        connectionCallback(false);
      }

      // Attempt to reconnect after a short delay
      setTimeout(() => {
        console.log("[WebSocket] Attempting to reconnect after error...");
        connectWebSocket(userId, connectionCallback);
      }, 5000);
    };

    // Handle connection events
    stompClient.onConnect = () => {
      console.log("[WebSocket] Connection established successfully");
      if (connectionCallback) {
        connectionCallback(true);
      }

      // Check for unread messages when connection is established
      setTimeout(() => {
        console.log(
          "[WebSocket] Connection established, checking for unread messages"
        );
        checkForUnreadMessages();
      }, 1000); // Wait a second to ensure everything is initialized

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
                  const tempMessageIndex = messages.findIndex(
                    (msg) =>
                      msg.id.toString().startsWith("temp-") &&
                      msg.content === receivedMessage.content &&
                      msg.sender.id === receivedMessage.sender.id &&
                      msg.receiver.id === receivedMessage.receiver.id
                  );

                  const hasTempMessage = tempMessageIndex !== -1;

                  console.log(
                    "[WebSocket] Has matching temp message?",
                    hasTempMessage,
                    tempMessageIndex !== -1
                      ? `at index ${tempMessageIndex}`
                      : ""
                  );

                  // Check if this message already exists in the store before dispatching
                  const existingMessages = store.getState().chat.messages;
                  const exactDuplicateIndex = existingMessages.findIndex(
                    (msg) => msg.id === receivedMessage.id
                  );

                  const similarMessageIndex = existingMessages.findIndex(
                    (msg) =>
                      msg.id !== receivedMessage.id && // Not the same ID
                      !msg.id.toString().startsWith("temp-") && // Not a temp message
                      msg.content === receivedMessage.content &&
                      msg.sender.id === receivedMessage.sender.id &&
                      msg.receiver.id === receivedMessage.receiver.id &&
                      Math.abs(
                        new Date(msg.timestamp).getTime() -
                          new Date(receivedMessage.timestamp).getTime()
                      ) < 5000
                  );

                  const isDuplicate =
                    exactDuplicateIndex !== -1 || similarMessageIndex !== -1;

                  // If we have a temp message, replace it with the confirmed one
                  if (hasTempMessage) {
                    console.log(
                      "[WebSocket] Replacing temporary message with confirmed message"
                    );

                    // Use the updateMessageContent action to replace the temp message
                    // This will preserve the message's position in the list
                    store.dispatch({
                      type: "chat/updateMessageContent",
                      payload: {
                        messageId: messages[tempMessageIndex].id,
                        newMessage: receivedMessage,
                      },
                    });

                    console.log(
                      "[WebSocket] Temporary message replaced successfully"
                    );

                    // Clear any message timeouts for this message
                    const extendedWindow = window as ExtendedWindow;
                    if (extendedWindow.messageTimeouts) {
                      Object.keys(extendedWindow.messageTimeouts).forEach(
                        (key) => {
                          clearTimeout(extendedWindow.messageTimeouts![key]);
                          delete extendedWindow.messageTimeouts![key];
                        }
                      );
                    }
                  }
                  // If it's not a duplicate and not replacing a temp message, add it as new
                  else if (!isDuplicate) {
                    // Dispatch the message to Redux store
                    console.log(
                      "[WebSocket] Dispatching new message to Redux store"
                    );
                    store.dispatch(addMessage(receivedMessage));
                    console.log(
                      "[WebSocket] New message dispatched successfully"
                    );

                    // Check if this message is from the currently selected contact
                    // If so, automatically mark it as read
                    const selectedContact =
                      store.getState().chat.selectedContact;
                    if (
                      selectedContact &&
                      !isFromCurrentUser &&
                      receivedMessage.sender.id === selectedContact.id
                    ) {
                      console.log(
                        "[WebSocket] Message is from currently selected contact, automatically marking as read"
                      );

                      // Use setTimeout to ensure the message is added to the store first
                      setTimeout(() => {
                        markMessagesAsReadViaWebSocket(
                          receivedMessage.sender.id
                        );
                      }, 500);
                    } else {
                      console.log(
                        "[WebSocket] Message is not from selected contact or is from current user, not marking as read automatically"
                      );
                    }
                  } else {
                    console.log(
                      "[WebSocket] Skipping duplicate message:",
                      receivedMessage.id,
                      exactDuplicateIndex !== -1
                        ? `(exact duplicate at index ${exactDuplicateIndex})`
                        : similarMessageIndex !== -1
                        ? `(similar message at index ${similarMessageIndex})`
                        : ""
                    );
                  }
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

                  // Check if this message already exists in the store before dispatching
                  const existingMessages = store.getState().chat.messages;
                  const isDuplicate = existingMessages.some(
                    (msg) =>
                      // Exact ID match
                      msg.id === receivedMessage.id ||
                      // Same content, sender, receiver, and timestamp within 5 seconds
                      (msg.content === receivedMessage.content &&
                        msg.sender.id === receivedMessage.sender.id &&
                        msg.receiver.id === receivedMessage.receiver.id &&
                        Math.abs(
                          new Date(msg.timestamp).getTime() -
                            new Date(receivedMessage.timestamp).getTime()
                        ) < 5000)
                  );

                  if (!isDuplicate) {
                    // Dispatch the message to Redux store
                    console.log(
                      "[WebSocket] Dispatching general message to Redux store"
                    );
                    store.dispatch(addMessage(receivedMessage));
                    console.log(
                      "[WebSocket] General message dispatched successfully"
                    );

                    // Check if this is a message from the current user (a confirmation)
                    const currentUserId = store.getState().user.userInfo?.id;
                    const isFromCurrentUser =
                      receivedMessage.sender.id === currentUserId;

                    // Check if this message is from the currently selected contact
                    // If so, automatically mark it as read
                    const selectedContact =
                      store.getState().chat.selectedContact;
                    if (
                      selectedContact &&
                      !isFromCurrentUser &&
                      receivedMessage.sender.id === selectedContact.id
                    ) {
                      console.log(
                        "[WebSocket] General message is from currently selected contact, automatically marking as read"
                      );

                      // Use setTimeout to ensure the message is added to the store first
                      setTimeout(() => {
                        markMessagesAsReadViaWebSocket(
                          receivedMessage.sender.id
                        );
                      }, 500);
                    } else {
                      console.log(
                        "[WebSocket] General message is not from selected contact or is from current user, not marking as read automatically"
                      );
                    }
                  } else {
                    console.log(
                      "[WebSocket] Skipping duplicate general message:",
                      receivedMessage.id
                    );
                  }
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

            // Subscribe to direct notifications
            console.log(
              `[WebSocket] Subscribing to direct notifications at: /user/${capturedUserId}/queue/direct-notifications`
            );
            const directNotificationSubscription = stompClient.subscribe(
              `/user/${capturedUserId}/queue/direct-notifications`,
              (message: IMessage) => {
                console.log(
                  "[WebSocket] *** DIRECT NOTIFICATION RECEIVED *** Raw message:",
                  message
                );
                try {
                  const directNotification = JSON.parse(message.body);
                  console.log(
                    "[WebSocket] Direct notification parsed - FULL OBJECT:",
                    directNotification
                  );

                  // Log additional details for debugging
                  const currentUserId = store.getState().user.userInfo?.id;
                  console.log(
                    "[WebSocket] Current user ID (receiver of direct notification):",
                    currentUserId
                  );
                  console.log(
                    "[WebSocket] Who read my messages?",
                    directNotification.readerId || directNotification.contactId
                  );

                  // Process the direct notification - update the UI to show messages as read
                  if (
                    directNotification.type === "READ_RECEIPT" ||
                    directNotification.type === "DIRECT_READ_RECEIPT"
                  ) {
                    console.log(
                      "[WebSocket] Processing direct read receipt notification"
                    );

                    // Import the necessary actions to update message read status
                    import("../store/chatSlice").then(
                      ({ updateMessagesReadStatus }) => {
                        // Dispatch the action to update the UI
                        store.dispatch(
                          updateMessagesReadStatus({
                            contactId:
                              directNotification.readerId ||
                              directNotification.contactId,
                            currentUserId: currentUserId,
                            isRecipientReadEvent: true,
                            forceUpdate: true,
                          })
                        );

                        console.log(
                          "[WebSocket] Direct notification processed, UI updated"
                        );
                      }
                    );
                  }
                } catch (error) {
                  console.error(
                    "[WebSocket] Error processing direct notification:",
                    error
                  );
                }
              }
            );
            console.log(
              "[WebSocket] Direct notification subscription created:",
              directNotificationSubscription ? "Success" : "Failed"
            );
            const readReceiptSubscription = stompClient.subscribe(
              `/user/${capturedUserId}/queue/read-receipts`,
              (message: IMessage) => {
                console.log(
                  "[WebSocket] *** READ RECEIPT RECEIVED *** Raw message:",
                  message
                );
                try {
                  const readReceipt = JSON.parse(message.body);
                  console.log(
                    "[WebSocket] Read receipt parsed - FULL OBJECT:",
                    readReceipt
                  );
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

                  // Log additional details for debugging
                  const currentUserId = store.getState().user.userInfo?.id;
                  console.log(
                    "[WebSocket] Current user ID (receiver of notification):",
                    currentUserId
                  );
                  console.log(
                    "[WebSocket] Is this a notification that someone read my messages?",
                    readReceipt.contactId !== currentUserId ? "YES" : "NO"
                  );
                  console.log(
                    "[WebSocket] Who read my messages?",
                    readReceipt.contactId
                  );

                  // Check if this is a confirmation message after database update
                  const isConfirmation =
                    readReceipt.type === "READ_CONFIRMATION";

                  // Check if this is a direct notification
                  const isDirectNotification =
                    readReceipt.isDirectNotification === true;

                  if (isConfirmation) {
                    console.log(
                      "[WebSocket] *** RECEIVED READ CONFIRMATION *** This is a confirmation after database update"
                    );
                  }

                  if (isDirectNotification) {
                    console.log(
                      "[WebSocket] *** RECEIVED DIRECT NOTIFICATION *** This is a direct notification from the reader"
                    );
                  }

                  // Get current user ID for logging

                  // Update the UI to show messages as read by dispatching an action to Redux
                  console.log(
                    "[WebSocket] Messages marked as read for contact:",
                    readReceipt.contactId,
                    "Current user ID:",
                    currentUserId
                  );

                  // Log whether this is a confirmation of our read action or a notification that our messages were read
                  // If contactId is NOT our ID, then this is a notification that someone read our messages
                  // The contactId in this case is the ID of the user who read our messages

                  // IMPORTANT DEBUG LOGS
                  console.log("[WebSocket] *** DECISION POINT ***");
                  console.log(
                    "[WebSocket] readReceipt.contactId:",
                    readReceipt.contactId
                  );
                  console.log("[WebSocket] currentUserId:", currentUserId);
                  console.log("[WebSocket] isConfirmation:", isConfirmation);
                  console.log(
                    "[WebSocket] isDirectNotification:",
                    isDirectNotification
                  );
                  console.log(
                    "[WebSocket] readReceipt.contactId !== currentUserId:",
                    readReceipt.contactId !== currentUserId
                  );

                  if (
                    readReceipt.contactId !== currentUserId ||
                    isConfirmation ||
                    isDirectNotification
                  ) {
                    console.log(
                      "[WebSocket] *** CONDITION MET: Will process this notification ***"
                    );

                    // For confirmation messages or direct notifications, we always want to update the UI regardless of contactId
                    if (isConfirmation || isDirectNotification) {
                      console.log(
                        "[WebSocket] *** PROCESSING CONFIRMATION OR DIRECT NOTIFICATION ***"
                      );
                      console.log(
                        "[WebSocket] *** PROCESSING READ CONFIRMATION OR DIRECT NOTIFICATION *** Updating UI"
                      );

                      // For confirmation messages or direct notifications, we need to update the read status for all messages
                      // sent to the contact who read our messages
                      let readerId;
                      let contactIdToUpdate;

                      if (isDirectNotification) {
                        // For direct notifications, the contactId is the ID of the reader (the user who read our messages)
                        readerId = readReceipt.readerId;
                        contactIdToUpdate = readReceipt.contactId;

                        console.log(
                          "[WebSocket] Direct notification - Reader ID:",
                          readerId,
                          "Contact ID to update:",
                          contactIdToUpdate
                        );
                      } else {
                        // For regular read receipts, use the readerId from the receipt
                        readerId = readReceipt.readerId;
                        contactIdToUpdate = readReceipt.contactId;
                      }

                      if (readerId && currentUserId) {
                        console.log(
                          "[WebSocket] Updating read status for messages sent to:",
                          contactIdToUpdate
                        );

                        store.dispatch(
                          updateMessagesReadStatus({
                            contactId: contactIdToUpdate,
                            currentUserId: currentUserId,
                            isRecipientReadEvent: true, // This is a confirmation that the recipient read our messages
                            forceUpdate: isDirectNotification, // Force update for direct notifications
                          })
                        );

                        // Log that we've dispatched the action
                        console.log(
                          "[WebSocket] Dispatched updateMessagesReadStatus action with contactId:",
                          contactIdToUpdate,
                          "currentUserId:",
                          currentUserId,
                          "isRecipientReadEvent: true, forceUpdate:",
                          isDirectNotification
                        );
                      }
                    } else {
                      console.log(
                        "[WebSocket] *** IMPORTANT: This is a notification that our messages were read by the recipient ***"
                      );

                      // In the ReadStatusResponse from the server, contactId is the ID of the user who read the messages
                      // This is the user we need to update the read status for

                      // The contactId is the ID of the user who read our messages
                      const readerId = readReceipt.contactId;

                      console.log(
                        "[WebSocket] Messages were read by user with ID:",
                        readerId
                      );

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

                        // Check if we have any messages to this user in our store
                        const messages = store.getState().chat.messages;
                        const hasSentMessages = messages.some(
                          (msg) =>
                            msg.sender.id === currentUserId &&
                            msg.receiver.id === readerId
                        );

                        if (hasSentMessages) {
                          console.log(
                            "[WebSocket] Found messages in store that need to be marked as read"
                          );

                          // Dispatch the action with both IDs to ensure proper updating
                          store.dispatch(
                            updateMessagesReadStatus({
                              contactId: readerId,
                              currentUserId: currentUserId,
                              isRecipientReadEvent: true, // This is a notification that the recipient read our messages
                            })
                          );
                        } else {
                          console.log(
                            "[WebSocket] No messages found in store to this user, fetching from server..."
                          );

                          // If we don't have messages in the store (e.g., user wasn't active),
                          // fetch messages from the server to update the UI
                          import("../services/chatService").then(
                            ({ getMessages }) => {
                              getMessages(readerId)
                                .then((messages) => {
                                  console.log(
                                    "[WebSocket] Successfully fetched messages from server, updating store"
                                  );

                                  // Update the store with the fetched messages
                                  import("../store/chatSlice").then(
                                    ({ setMessages }) => {
                                      store.dispatch(setMessages(messages));

                                      // Now update the read status
                                      store.dispatch(
                                        updateMessagesReadStatus({
                                          contactId: readerId,
                                          currentUserId: currentUserId,
                                          isRecipientReadEvent: true,
                                        })
                                      );
                                    }
                                  );
                                })
                                .catch((error) => {
                                  console.error(
                                    "[WebSocket] Failed to fetch messages from server:",
                                    error
                                  );
                                });
                            }
                          );
                        }

                        // Log whether the contact is currently selected (for debugging)
                        const selectedContact =
                          store.getState().chat.selectedContact;
                        const isContactSelected =
                          selectedContact && selectedContact.id === readerId;
                        console.log(
                          `[WebSocket] Contact ${readerId} is ${
                            isContactSelected ? "currently" : "not"
                          } selected in the UI`
                        );
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

                        // Update the read status for all contacts with unread messages
                        console.log(
                          "[WebSocket] Updating read status for all contacts with unread messages"
                        );

                        // Process each contact with unread messages
                        otherUserIds.forEach((contactId) => {
                          console.log(
                            `[WebSocket] Updating read status for contact: ${contactId}`
                          );
                          store.dispatch(
                            updateMessagesReadStatus({
                              contactId: contactId,
                              currentUserId: currentUserId,
                              isRecipientReadEvent: true, // This is a notification that the recipient read our messages
                            })
                          );
                        });

                        // Log whether any of these contacts is currently selected (for debugging)
                        if (selectedContact) {
                          console.log(
                            `[WebSocket] Currently selected contact: ${
                              selectedContact.id
                            }, is in unread list: ${otherUserIds.includes(
                              selectedContact.id
                            )}`
                          );
                        }
                      }
                    }
                  } else {
                    console.log(
                      "[WebSocket] This is a notification about messages we received or a confirmation of our read action"
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

            // Subscribe to direct notifications (for read receipts and other direct messages)
            console.log(
              `[WebSocket] Subscribing to direct notifications at: /user/${capturedUserId}/queue/direct-notifications`
            );
            const directNotificationsSubscription = stompClient.subscribe(
              `/user/${capturedUserId}/queue/direct-notifications`,
              (message: IMessage) => {
                console.log(
                  "[WebSocket] Raw direct notification received:",
                  message
                );
                try {
                  const notification = JSON.parse(message.body);
                  console.log(
                    "[WebSocket] Direct notification parsed:",
                    notification
                  );

                  // Check if this is a read receipt notification
                  if (notification.type === "DIRECT_READ_RECEIPT") {
                    console.log(
                      "[WebSocket] *** RECEIVED DIRECT READ RECEIPT *** from user:",
                      notification.readerId
                    );

                    // Get current user ID
                    const currentUserId = store.getState().user.userInfo?.id;

                    // Update the UI to show messages as read
                    console.log(
                      "[WebSocket] Updating read status for messages sent to user:",
                      notification.contactId
                    );

                    // Dispatch action to update read status in Redux store
                    store.dispatch(
                      updateMessagesReadStatus({
                        contactId: notification.contactId,
                        currentUserId: currentUserId,
                        isRecipientReadEvent: true, // This is a notification that the recipient read our messages
                      })
                    );
                  }
                } catch (error) {
                  console.error(
                    "[WebSocket] Error processing direct notification:",
                    error
                  );
                }
              }
            );
            console.log(
              "[WebSocket] Direct notifications subscription created:",
              directNotificationsSubscription ? "Success" : "Failed"
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
  persistent: boolean = true,
  isGroup: boolean = false
): boolean => {
  console.log("[WebSocket] Sending message via WebSocket:", {
    content: content.substring(0, 20) + "...",
    receiverId,
    persistent,
    isGroup,
    isGroupType: typeof isGroup,
  });

  // Generate a unique message ID that can be used to track this message
  const clientMessageId = `client-${Date.now()}-${Math.floor(
    Math.random() * 1000
  )}`;

  // Store this ID in the window object for tracking
  const extendedWindow = window as ExtendedWindow;
  extendedWindow.messageTimeouts = extendedWindow.messageTimeouts || {};

  // Set up a timeout to check if the message was confirmed
  extendedWindow.messageTimeouts[clientMessageId] = setTimeout(() => {
    console.log(
      `[WebSocket] Checking confirmation status for message: ${clientMessageId}`
    );
    // This will run if we don't get a confirmation within the timeout period
    // We'll check if the message is still in the store with a temporary ID
    const messages = store.getState().chat.messages;
    const tempMessages = messages.filter(
      (msg) =>
        msg.id.toString().startsWith("temp-") &&
        msg.content === content &&
        msg.sender.id === store.getState().user.userInfo?.id &&
        msg.receiver.id === receiverId
    );

    if (tempMessages.length > 0) {
      console.log(
        `[WebSocket] Message ${clientMessageId} not confirmed yet, attempting HTTP fallback`
      );
      // If we still have a temporary message, try HTTP fallback
      if (isGroup) {
        import("./chatService").then(({ sendGroupMessage }) => {
          sendGroupMessage(content, receiverId, persistent)
            .then((response) => {
              console.log(
                `[WebSocket] HTTP fallback successful for group message: ${clientMessageId}`
              );
              store.dispatch(addMessage(response));
            })
            .catch((error) => {
              console.error(
                `[WebSocket] HTTP fallback failed for group message: ${clientMessageId}`,
                error
              );
            });
        });
      } else {
        import("./chatService").then(({ sendMessage }) => {
          sendMessage(content, receiverId, persistent)
            .then((response) => {
              console.log(
                `[WebSocket] HTTP fallback successful for direct message: ${clientMessageId}`
              );
              store.dispatch(addMessage(response));
            })
            .catch((error) => {
              console.error(
                `[WebSocket] HTTP fallback failed for direct message: ${clientMessageId}`,
                error
              );
            });
        });
      }
    } else {
      console.log(
        `[WebSocket] Message ${clientMessageId} already confirmed or removed`
      );
    }

    // Clean up the timeout
    if (extendedWindow.messageTimeouts) {
      delete extendedWindow.messageTimeouts[clientMessageId];
    }
  }, 10000); // 10 seconds timeout

  // ADDITIONAL SAFETY CHECK: Check if this might be a group ID by looking at the store
  // We'll use a synchronous approach to ensure we have the correct isGroup value
  let finalIsGroup = isGroup;

  try {
    // Get the store directly
    const state = store.getState();
    const groups = state.chat.groups || [];
    const selectedContact = state.chat.selectedContact;

    // Convert receiverId to string for consistent comparison
    const receiverIdStr = String(receiverId);

    // Log all groups for debugging
    console.log(
      "[WebSocket] All groups in store:",
      groups.map((g) => ({ id: g.id, name: g.name }))
    );
    console.log(
      "[WebSocket] Checking if receiverId is a group:",
      receiverIdStr
    );
    console.log("[WebSocket] Selected contact:", selectedContact);

    // Check if the receiverId matches any group ID - use string comparison
    const matchingGroup = groups.find(
      (group) => String(group.id) === receiverIdStr
    );

    // Check if the selected contact has isGroup=true and matches the receiverId
    const isSelectedContactGroup =
      selectedContact &&
      String(selectedContact.id) === receiverIdStr &&
      (selectedContact.isGroup === true ||
        String(selectedContact.isGroup) === "true");

    // Additional check: see if the receiverId is in the groups array
    const isInGroupsList = groups.some(
      (group) => String(group.id) === receiverIdStr
    );

    console.log("[WebSocket] Group detection results:", {
      matchingGroup: matchingGroup ? matchingGroup.name : null,
      isSelectedContactGroup,
      isInGroupsList,
      receiverIdStr,
    });

    // If we find a matching group or the selected contact is a group, override isGroup
    if (matchingGroup || isSelectedContactGroup || isInGroupsList) {
      console.log(
        "[WebSocket] CRITICAL OVERRIDE: Detected receiverId as a group ID!"
      );
      console.log(
        "[WebSocket] Group name:",
        matchingGroup
          ? matchingGroup.name
          : selectedContact
          ? selectedContact.name
          : "Unknown"
      );
      console.log("[WebSocket] Original isGroup flag:", finalIsGroup);
      console.log("[WebSocket] Overriding isGroup flag to true");
      finalIsGroup = true;
    }

    // CRITICAL: Check if the current selected contact in the UI is a group
    // This is the most reliable way to determine if we're sending to a group
    const currentSelectedContact = state.chat.selectedContact;
    if (currentSelectedContact) {
      console.log(
        "[WebSocket] Current selected contact:",
        currentSelectedContact.id
      );
      console.log(
        "[WebSocket] Current selected contact isGroup:",
        currentSelectedContact.isGroup
      );

      // If the current selected contact is a group and we're sending to a different ID,
      // this might be a bug - log a warning
      if (
        (currentSelectedContact.isGroup === true || isInGroupsList) &&
        String(currentSelectedContact.id) !== receiverIdStr
      ) {
        console.warn(
          "[WebSocket] WARNING: Sending to a different ID than the selected group contact!"
        );
        console.warn(
          "[WebSocket] Selected contact:",
          currentSelectedContact.id
        );
        console.warn("[WebSocket] Sending to:", receiverIdStr);
      }
    }
  } catch (e) {
    console.error("[WebSocket] Error checking if receiverId is a group:", e);
  }

  // Update the isGroup parameter with our final determination
  isGroup = finalIsGroup;
  console.log(
    "[WebSocket] Final isGroup determination after all checks:",
    isGroup
  );

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

    // Define the message payload type to include all possible properties
    interface MessagePayload {
      content: string;
      messageId: string;
      persistent: boolean;
      isGroup: boolean;
      groupId?: string | null;
      receiverId?: string | null;
      messageType?: string;
    }

    // We'll create the message payload after our final group check
    let messagePayload: MessagePayload = {
      content: content, // Ensure content is passed as is, without additional encoding
      messageId,
      persistent,
      isGroup, // Initial isGroup flag
    };

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
        // Import the necessary functions from chatService
        import("./chatService").then(({ sendMessage, sendGroupMessage }) => {
          console.log("[WebSocket] Falling back to HTTP method for message");
          console.log("[WebSocket] Final isGroup flag:", isGroup);

          // CRITICAL: Double-check if this is a group message by looking at the store
          // This is our last chance to catch a group message before sending it as a direct message
          let finalIsGroup = isGroup;
          try {
            // Import store dynamically to avoid circular dependencies
            import("../store/store").then(({ default: store }) => {
              const state = store.getState();
              const groups = state.chat.groups || [];
              const receiverIdStr = String(receiverId);

              // Check if the receiverId is in the groups list
              const isInGroupsList = groups.some(
                (group) => String(group.id) === receiverIdStr
              );

              if (isInGroupsList && !finalIsGroup) {
                console.log(
                  "[WebSocket] CRITICAL LAST-MINUTE OVERRIDE: Detected receiverId as a group ID in HTTP fallback!"
                );
                console.log("[WebSocket] Original isGroup flag:", finalIsGroup);
                console.log(
                  "[WebSocket] Overriding isGroup flag to true for HTTP fallback"
                );
                finalIsGroup = true;
              }
            });
          } catch (e) {
            console.error("[WebSocket] Error in last-minute group check:", e);
          }

          // Function to handle HTTP sending with retry capability
          const sendWithRetry = async (retryCount = 0, maxRetries = 2) => {
            try {
              let response;

              // Use the appropriate function based on whether this is a group message
              if (finalIsGroup) {
                console.log(
                  "[WebSocket] Using group-specific endpoint for fallback"
                );
                response = await sendGroupMessage(
                  content,
                  receiverId,
                  persistent
                );
              } else {
                console.log(
                  "[WebSocket] Using direct message endpoint for fallback"
                );
                response = await sendMessage(
                  content,
                  receiverId,
                  persistent,
                  false
                );
              }
              console.log("[WebSocket] HTTP fallback successful:", response);

              // Import and dispatch the addMessage action to update the UI
              import("../store/chatSlice").then(({ addMessage }) => {
                import("../store/store").then(({ default: store }) => {
                  store.dispatch(addMessage(response));
                });
              });

              return response;
            } catch (error) {
              console.error("[WebSocket] HTTP fallback failed:", error);

              // Define a type for the error object
              interface HttpError {
                status?: number;
                httpStatus?: number;
                response?: { status: number };
                message?: string;
              }

              // Check if this is an authentication error (401)
              const isAuthError =
                error &&
                typeof error === "object" &&
                ((error as HttpError).status === 401 ||
                  (error as HttpError).httpStatus === 401 ||
                  (error as HttpError).response?.status === 401 ||
                  (error as Error).message?.includes("401"));

              if (isAuthError && retryCount < maxRetries) {
                console.log(
                  `[WebSocket] Authentication error detected, attempting token refresh and retry (${
                    retryCount + 1
                  }/${maxRetries})`
                );

                // Import and call refreshToken
                try {
                  const { refreshToken } = await import(
                    "../utils/tokenRefresh"
                  );
                  const refreshed = await refreshToken(true);

                  if (refreshed) {
                    console.log(
                      "[WebSocket] Token refreshed successfully, retrying message send"
                    );
                    // Wait a moment for the token to be properly set in the store
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    return sendWithRetry(retryCount + 1, maxRetries);
                  } else {
                    console.error(
                      "[WebSocket] Token refresh failed, cannot retry message send"
                    );
                    throw error;
                  }
                } catch (refreshError) {
                  console.error(
                    "[WebSocket] Error during token refresh:",
                    refreshError
                  );
                  throw error;
                }
              } else {
                throw error;
              }
            }
          };

          // Start the send with retry process
          sendWithRetry().catch((finalError) => {
            console.error(
              "[WebSocket] All HTTP fallback attempts failed:",
              finalError
            );
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
      console.log("[WebSocket] Final isGroup determination:", isGroup);

      // Update the message payload based on our final determination
      if (isGroup) {
        // For group messages, use groupId instead of receiverId
        messagePayload = {
          ...messagePayload,
          groupId: receiverId, // Set the groupId
          receiverId: null, // Clear the receiverId
          isGroup: true, // Ensure isGroup is true
          messageType: "GROUP", // Set the message type
        };
        console.log(
          "[WebSocket] Using GROUP message handling with groupId:",
          receiverId
        );
      } else {
        // For direct messages, keep receiverId
        messagePayload = {
          ...messagePayload,
          receiverId, // Keep the receiverId
          groupId: null, // Ensure groupId is null
          isGroup: false, // Ensure isGroup is false
          messageType: "DIRECT", // Set the message type
        };
        console.log(
          "[WebSocket] Using DIRECT message handling with receiverId:",
          receiverId
        );
      }

      // Create the final message body
      const finalMessageBody = JSON.stringify(messagePayload);

      // Use different destinations for group and direct messages
      const destination = isGroup
        ? "/app/chat.sendGroupMessage"
        : "/app/chat.sendMessage";

      console.log(
        `[WebSocket] Using destination: ${destination} for ${
          isGroup ? "GROUP" : "DIRECT"
        } message`
      );
      console.log(`[WebSocket] Final message payload:`, messagePayload);

      stompClient.publish({
        destination: destination,
        body: finalMessageBody,
        headers: {
          "receipt": receiptId,
          "persistent": persistent.toString(),
          "isGroup": isGroup.toString(),
          "messageType": isGroup ? "GROUP" : "DIRECT",
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
  if (!stompClient || !stompClient.connected) {
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
    }
    return true;
  } catch (error) {
    console.error("[WebSocket] Error sending typing notification:", error);
    return false;
  }
};

export const markMessagesAsReadViaWebSocket = (contactId: string): boolean => {
  // Get the selected contact from the store to check if it's a group
  const state = store.getState();
  const selectedContact = state.chat.selectedContact;
  const isGroup = selectedContact?.isGroup || false;

  // Check if the contact exists in the contacts list
  const contacts = state.chat.contacts;
  const contactExists = contacts.some((contact) => contact.id === contactId);
  const groups = state.chat.groups || [];
  const groupExists = groups.some((group) => group.id === contactId);

  // If the contact doesn't exist in either contacts or groups, log a warning
  if (!contactExists && !groupExists) {
    console.warn(
      `[WebSocket] *** WARNING *** Contact/Group with ID ${contactId} not found in contacts or groups list. Proceeding anyway.`
    );
  }

  console.log(
    `[WebSocket] *** STARTING PROCESS *** Marking messages as read for ${
      isGroup ? "group" : "contact"
    }:`,
    contactId,
    `(isGroup: ${isGroup})`
  );

  // Get current user ID from store for logging
  const currentUserId = state.user.userInfo?.id;
  console.log("[WebSocket] Current user ID:", currentUserId);

  // IMPORTANT: First update the UI immediately to provide instant feedback to the user
  // This makes the app feel more responsive
  console.log(
    `[WebSocket] *** STEP 1: UPDATING UI IMMEDIATELY *** for ${
      isGroup ? "group" : "contact"
    }:`,
    contactId
  );

  store.dispatch(
    updateMessagesReadStatus({
      contactId,
      currentUserId,
      isRecipientReadEvent: false, // We are marking messages as read that we received
    })
  );

  console.log(
    `[WebSocket] *** STEP 2: UI UPDATED SUCCESSFULLY *** for ${
      isGroup ? "group" : "contact"
    }:`,
    contactId
  );

  // Now update the database via HTTP API call
  console.log(
    `[WebSocket] *** STEP 3: CALLING HTTP API *** to update database for ${
      isGroup ? "group" : "contact"
    }:`,
    contactId
  );

  // Call the appropriate API based on whether this is a group or regular contact
  const apiCall = isGroup
    ? import("../services/chatService").then(({ markGroupMessagesAsRead }) =>
        markGroupMessagesAsRead(contactId)
      )
    : import("../services/chatService").then(({ markMessagesAsRead }) =>
        markMessagesAsRead(contactId)
      );

  // Now send the WebSocket notification to inform the sender that their messages were read
  // This should happen before waiting for the HTTP API call to complete
  if (stompClient && stompClient.connected) {
    try {
      // Generate a unique receipt ID for this operation
      const receiptId = `read-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;
      const messageId = `read-msg-${Date.now()}`;
      console.log(
        "[WebSocket] *** STEP 4: SENDING WEBSOCKET NOTIFICATION *** Generated receipt ID:",
        receiptId
      );

      // Create read receipt payload with more detailed information
      const readReceiptBody = JSON.stringify({
        contactId,
        messageId,
        readerId: currentUserId, // Add the reader's ID to the payload
        timestamp: new Date().toISOString(), // Add timestamp for tracking
        isGroup: isGroup, // Indicate if this is a group message
        type: "READ_RECEIPT", // Explicitly mark the type of notification
        forceNotify: true, // Add a flag to force notification to the sender
        senderIds: [contactId], // Explicitly specify which users should be notified
      });

      // Send the read receipt notification via WebSocket
      stompClient.publish({
        destination: "/app/chat.markAsRead",
        body: readReceiptBody,
        headers: {
          "receipt": receiptId,
        },
      });

      console.log(
        "[WebSocket] *** STEP 5: WEBSOCKET NOTIFICATION SENT *** with receipt ID:",
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

      // Also send a direct message to the sender's queue to ensure they get the notification
      console.log(
        "[WebSocket] *** STEP 5.1: SENDING DIRECT NOTIFICATION TO SENDER ***"
      );

      // Create a direct notification for the sender
      const directNotificationBody = JSON.stringify({
        contactId: currentUserId, // This is the ID of the reader (current user)
        messageId: `direct-${Date.now()}`,
        readerId: currentUserId,
        timestamp: new Date().toISOString(),
        isGroup: isGroup,
        type: "READ_RECEIPT", // Use the standard read receipt type that server already handles
        targetUserId: contactId, // The user who should receive this notification
        forceNotify: true, // Force notification
        isDirectNotification: true, // Flag to indicate this is a direct notification
        senderIds: [contactId], // Explicitly specify which users should be notified
      });

      console.log(
        "[WebSocket] *** DIRECT NOTIFICATION PAYLOAD ***",
        directNotificationBody
      );

      // Send a direct message to the sender's queue using the standard read receipt endpoint
      stompClient.publish({
        destination: `/app/chat.markAsRead`, // Use the standard markAsRead endpoint
        body: directNotificationBody,
        headers: {
          "receipt": `direct-${receiptId}`,
          "targetUserId": contactId, // Add the target user ID as a header
          "forceNotify": "true", // Force notification in headers too
          "isDirectNotification": "true", // Flag in headers too
        },
      });

      // ADDITIONAL ATTEMPT 1: Try sending directly to the user's queue
      try {
        console.log(
          "[WebSocket] *** ATTEMPTING DIRECT QUEUE SEND (METHOD 1) ***"
        );

        // Create a simplified payload for direct queue
        const directQueuePayload = JSON.stringify({
          contactId: currentUserId, // Reader ID
          readerId: currentUserId,
          timestamp: new Date().toISOString(),
          type: "READ_RECEIPT",
          isDirectNotification: true,
          forceUpdate: true,
          message: `User ${currentUserId} has read your messages`,
        });

        // Send directly to the user's queue
        stompClient.publish({
          destination: `/queue/user.${contactId}.read-receipts`, // Direct to user's queue
          body: directQueuePayload,
          headers: {
            "content-type": "application/json",
            "receipt": `direct-queue-${receiptId}`,
          },
        });

        console.log(
          "[WebSocket] Direct queue message sent to:",
          `/queue/user.${contactId}.read-receipts`
        );
      } catch (directQueueError) {
        console.error(
          "[WebSocket] Error sending direct queue message:",
          directQueueError
        );
      }

      // ADDITIONAL ATTEMPT 2: Try sending to the user's topic
      try {
        console.log(
          "[WebSocket] *** ATTEMPTING DIRECT TOPIC SEND (METHOD 2) ***"
        );

        // Create a simplified payload for direct topic
        const directTopicPayload = JSON.stringify({
          contactId: currentUserId, // Reader ID
          readerId: currentUserId,
          timestamp: new Date().toISOString(),
          type: "READ_RECEIPT",
          isDirectNotification: true,
          forceUpdate: true,
          message: `User ${currentUserId} has read your messages`,
          targetUserId: contactId,
        });

        // Send to a topic that the user might be subscribed to
        stompClient.publish({
          destination: `/topic/user.${contactId}.notifications`, // User-specific topic
          body: directTopicPayload,
          headers: {
            "content-type": "application/json",
            "receipt": `direct-topic-${receiptId}`,
          },
        });

        console.log(
          "[WebSocket] Direct topic message sent to:",
          `/topic/user.${contactId}.notifications`
        );
      } catch (directTopicError) {
        console.error(
          "[WebSocket] Error sending direct topic message:",
          directTopicError
        );
      }

      // ADDITIONAL ATTEMPT 3: Try sending to the standard user destination prefix
      try {
        console.log(
          "[WebSocket] *** ATTEMPTING STANDARD USER DESTINATION (METHOD 3) ***"
        );

        // Create a simplified payload
        const standardUserPayload = JSON.stringify({
          contactId: currentUserId, // Reader ID
          readerId: currentUserId,
          timestamp: new Date().toISOString(),
          type: "READ_RECEIPT",
          isDirectNotification: true,
          forceUpdate: true,
          message: `User ${currentUserId} has read your messages`,
        });

        // Send using the standard user destination prefix
        stompClient.publish({
          destination: `/user/${contactId}/queue/read-receipts`, // Standard user destination
          body: standardUserPayload,
          headers: {
            "content-type": "application/json",
            "receipt": `standard-user-${receiptId}`,
          },
        });

        console.log(
          "[WebSocket] Standard user destination message sent to:",
          `/user/${contactId}/queue/read-receipts`
        );
      } catch (standardUserError) {
        console.error(
          "[WebSocket] Error sending to standard user destination:",
          standardUserError
        );
      }

      // ADDITIONAL ATTEMPT 4: Try sending to the direct notifications queue
      try {
        console.log(
          "[WebSocket] *** ATTEMPTING DIRECT NOTIFICATIONS QUEUE (METHOD 4) ***"
        );

        // Create a simplified payload
        const directNotificationsPayload = JSON.stringify({
          contactId: currentUserId, // Reader ID
          readerId: currentUserId,
          timestamp: new Date().toISOString(),
          type: "DIRECT_READ_RECEIPT",
          isDirectNotification: true,
          forceUpdate: true,
          message: `User ${currentUserId} has read your messages`,
        });

        // Send to the direct notifications queue
        stompClient.publish({
          destination: `/user/${contactId}/queue/direct-notifications`, // Direct notifications queue
          body: directNotificationsPayload,
          headers: {
            "content-type": "application/json",
            "receipt": `direct-notifications-${receiptId}`,
          },
        });

        console.log(
          "[WebSocket] Direct notifications message sent to:",
          `/user/${contactId}/queue/direct-notifications`
        );
      } catch (directNotificationsError) {
        console.error(
          "[WebSocket] Error sending to direct notifications queue:",
          directNotificationsError
        );
      }

      // ADDITIONAL ATTEMPT 5: Try sending via server endpoint for direct notifications
      try {
        console.log(
          "[WebSocket] *** ATTEMPTING SERVER ENDPOINT FOR DIRECT NOTIFICATIONS (METHOD 5) ***"
        );

        // Create a payload for the server endpoint
        const serverEndpointPayload = JSON.stringify({
          contactId: currentUserId, // Reader ID
          readerId: currentUserId,
          timestamp: new Date().toISOString(),
          type: "DIRECT_READ_RECEIPT",
          targetUserId: contactId,
          isDirectNotification: true,
          forceUpdate: true,
        });

        // Send via server endpoint
        stompClient.publish({
          destination: `/app/chat.directNotify`, // Server endpoint for direct notifications
          body: serverEndpointPayload,
          headers: {
            "content-type": "application/json",
            "receipt": `server-endpoint-${receiptId}`,
            "targetUserId": contactId,
          },
        });

        console.log(
          "[WebSocket] Server endpoint message sent to:",
          `/app/chat.directNotify`
        );
      } catch (serverEndpointError) {
        console.error(
          "[WebSocket] Error sending via server endpoint:",
          serverEndpointError
        );
      }

      // Log the details of the direct notification
      console.log("[WebSocket] *** DIRECT NOTIFICATION DETAILS ***");
      console.log("[WebSocket] Reader ID (current user):", currentUserId);
      console.log("[WebSocket] Target user ID (sender):", contactId);
      console.log("[WebSocket] Is group message:", isGroup);
      console.log("[WebSocket] Message ID:", `direct-${Date.now()}`);
      console.log("[WebSocket] Timestamp:", new Date().toISOString());

      console.log("[WebSocket] Direct notification sent to sender:", contactId);
    } catch (error) {
      console.error(
        "[WebSocket] Error sending read notification via WebSocket:",
        error
      );
      // Continue with the HTTP API call even if WebSocket notification fails
    }
  } else {
    console.warn(
      "[WebSocket] *** WARNING: NO ACTIVE CONNECTION *** Cannot send read notification via WebSocket"
    );
  }

  // Finally, wait for the HTTP API call to complete
  apiCall
    .then((response) => {
      console.log(
        `[WebSocket] *** STEP 6: DATABASE UPDATED SUCCESSFULLY *** via HTTP API call for ${
          isGroup ? "group" : "contact"
        }:`,
        contactId,
        response
      );

      // We've already sent direct notifications before the HTTP call, so we don't need to send another one here
    })
    .catch((error) => {
      // If the error is a 404 (Not Found), it means the group/contact doesn't exist
      // We should handle this gracefully without disrupting the UI
      if (error?.response?.status === 404) {
        console.warn(
          `[WebSocket] *** WARNING: RESOURCE NOT FOUND *** ${
            isGroup ? "Group" : "Contact"
          } with ID ${contactId} does not exist. Skipping database update.`
        );
        return true;
      }

      console.error(
        `[WebSocket] *** ERROR: FAILED TO UPDATE DATABASE *** via HTTP API call for ${
          isGroup ? "group" : "contact"
        }:`,
        contactId,
        error
      );

      // Even if the HTTP API call fails, the UI has already been updated and
      // the WebSocket notification has been sent, so the user experience is not affected
    });

  return true;
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

