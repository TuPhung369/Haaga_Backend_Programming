import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Input,
  Button,
  List,
  Avatar,
  Typography,
  Spin,
  notification,
  Modal,
  Form,
  Dropdown,
  Tag,
  Switch,
} from "antd";
import {
  SendOutlined,
  UserOutlined,
  PlusOutlined,
  TagOutlined,
  EditOutlined,
  BookOutlined,
  LaptopOutlined,
  StarOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  TeamOutlined,
  FilterOutlined,
  UserAddOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { UnknownAction, ThunkDispatch } from "@reduxjs/toolkit";
import { RootState } from "../types";
import { ChatMessage } from "../types/ChatTypes";
import {
  NovuProvider,
  PopoverNotificationCenter,
  NotificationBell,
} from "@novu/notification-center";
import store from "../store/store"; // Import for direct access to Redux store
import { updateUserStatus as updateUserStatusInRedux } from "../store/userSlice"; // Import the action

import {
  fetchContacts,
  fetchMessages,
  sendMessageThunk,
  // markAsRead, // Không sử dụng trực tiếp, thay thế bằng updateMessagesReadStatus
  addContactThunk as addContact, // Renamed in the combined slice
  setSelectedContact,
  updateContactGroupThunk,
  updateContactDisplayNameThunk,
  fetchPendingRequests,
  respondToRequest,
  addMessage, // Import the addMessage action
  updateMessagesReadStatus, // Import the updateMessagesReadStatus action
} from "../store/chatSlice";

import {
  connectWebSocket,
  disconnectWebSocket,
  sendMessageViaWebSocket,
  sendTypingNotification,
  sendStatusUpdateViaWebSocket,
} from "../services/websocketService";
import { USER_STATUS_COLORS } from "../utils/constant";

const { Title, Text } = Typography;

// Styles for action buttons
const actionButtonStyles = {
  addContact: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    height: "32px",
    width: "32px",
    padding: "0",
    borderColor: "rgba(24, 144, 255, 1)", // Giảm độ đậm của border
    color: "#1890ff",
    transition: "all 0.3s ease",
  },
  addGroup: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    height: "32px",
    width: "32px",
    padding: "0",
    borderColor: "rgba(24, 144, 255, 1)", // Giảm độ đậm của border
    color: "#1890ff",
    transition: "all 0.3s ease",
  },
  filter: (isActive: boolean) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    height: "32px",
    width: "32px",
    padding: "0",
    borderColor: isActive ? undefined : "rgba(24, 144, 255, 1)", // Giảm độ đậm của border
    color: isActive ? undefined : "#1890ff",
    background: isActive ? "rgba(24, 144, 255, 1)" : undefined, // Giảm độ đậm của background
    transition: "all 0.3s ease",
  }),
};

// Add CSS classes for hover effects
const addCssStyles = () => {
  if (!document.getElementById("chat-page-styles")) {
    const styleEl = document.createElement("style");
    styleEl.id = "chat-page-styles";
    styleEl.innerHTML = `
      .action-button.ant-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      }
      .action-button.ant-btn-primary:hover {
        background-color: #40a9ff;
      }
      .action-button.ant-btn:not(.ant-btn-primary):hover {
        opacity: 0.85;
      }
    `;
    document.head.appendChild(styleEl);
  }
};

const ChatPage: React.FC = () => {
  // Add CSS styles when component mounts
  useEffect(() => {
    addCssStyles();
    return () => {
      const styleEl = document.getElementById("chat-page-styles");
      if (styleEl) styleEl.remove();
    };
  }, []);
  const dispatch =
    useDispatch<ThunkDispatch<RootState, unknown, UnknownAction>>();

  // Get user info from Redux store first
  const { userInfo } = useSelector((state: RootState) => state.user);
  const { token } = useSelector((state: RootState) => state.auth);
  const userId = userInfo?.id || "guest";
  const {
    messages,
    contacts,
    pendingRequests,
    selectedContact,
    loading: loadingContacts,
  } = useSelector((state: RootState) => state.chat);

  const [messageText, setMessageText] = useState("");
  const [isAddContactModalVisible, setIsAddContactModalVisible] =
    useState(false);
  const [newContactEmail, setNewContactEmail] = useState("");
  const [persistMessages, setPersistMessages] = useState(true);
  // Add a state to force re-renders when read status changes
  const [readStatusVersion, setReadStatusVersion] = useState(0);
  // Add state for contact search
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  // Add state for user status - initialize from Redux store if available
  const [userStatus, setUserStatus] = useState<
    "online" | "away" | "busy" | "offline"
  >(
    (userInfo?.userStatus as "online" | "away" | "busy" | "offline") || "online"
  );

  // Log when readStatusVersion changes
  useEffect(() => {
    console.log(
      "[Chat] *** READ STATUS VERSION UPDATED, UI WILL RE-RENDER ***:",
      readStatusVersion
    );
  }, [readStatusVersion]);

  // Update local state when userInfo.userStatus changes in Redux
  useEffect(() => {
    if (userInfo?.userStatus) {
      setUserStatus(
        userInfo.userStatus as "online" | "away" | "busy" | "offline"
      );
    }
  }, [userInfo?.userStatus]);
  const [form] = Form.useForm();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Novu application ID
  const NOVU_APP_ID = import.meta.env.VITE_NOVU_APP_ID || "your-novu-app-id";

  useEffect(() => {
    // Fetch contacts
    dispatch(fetchContacts())
      .unwrap()
      .catch(() => {
        notification.error({
          message: "Connection Error",
          description:
            "Failed to connect to the chat server. Please try again later.",
        });
      });

    // Fetch pending contact requests
    dispatch(fetchPendingRequests())
      .unwrap()
      .then((pendingRequests) => {
        // Show notification if there are pending requests
        if (pendingRequests && pendingRequests.length > 0) {
          notification.info({
            message: "Contact Requests",
            description: `You have ${pendingRequests.length} pending contact request(s)`,
            duration: 5,
          });
        }
      })
      .catch(() => {
        notification.error({
          message: "Error",
          description: "Failed to fetch pending contact requests.",
        });
      });

    // Connect to WebSocket if userId is available
    if (userId && userId !== "guest") {
      try {
        const connected = connectWebSocket(userId);
        if (!connected) {
          console.warn("WebSocket connection failed, falling back to HTTP");
          // Optional: Show notification to user
          notification.info({
            message: "Chat Information",
            description:
              "Using standard connection mode. Real-time updates may be delayed.",
            duration: 5,
          });
        }
      } catch (error) {
        console.error("Error connecting to WebSocket:", error);
      }
    }

    // Cleanup WebSocket connection when component unmounts
    return () => {
      disconnectWebSocket();
    };
  }, [dispatch, userId]);

  useEffect(() => {
    if (selectedContact) {
      console.log("[Chat] Contact selected:", selectedContact.name);

      // Fetch messages only once when contact is selected
      // This is the only place we'll fetch messages from the server
      dispatch(fetchMessages(selectedContact.id))
        .unwrap()
        .then(() => {
          // Get current user ID for proper logging
          const currentUserId = userInfo?.id;

          // Only mark messages as read if the document has focus (user is actively viewing)
          if (document.hasFocus()) {
            console.log(
              "[Chat] Marking messages as read for contact:",
              selectedContact.id,
              "Current user ID:",
              currentUserId,
              "Document has focus:",
              document.hasFocus()
            );

            // First, update the UI immediately based on Redux store
            dispatch(
              updateMessagesReadStatus({
                contactId: selectedContact.id,
                currentUserId: userInfo?.id,
              })
            );

            console.log(
              "[Chat] Dispatched immediate UI update for read status on contact selection"
            );

            // Try to mark messages as read via WebSocket
            import("../services/websocketService").then(
              ({ markMessagesAsReadViaWebSocket }) => {
                markMessagesAsReadViaWebSocket(selectedContact.id);
              }
            );
          } else {
            console.log(
              "[Chat] Document does not have focus, not marking messages as read automatically on contact selection"
            );
          }
        })
        .catch((error) => {
          console.error("[Chat] Error fetching messages:", error);
        });
    }
  }, [selectedContact, dispatch, userInfo?.id]);

  useEffect(() => {
    // Always scroll to bottom when messages change
    scrollToBottom();

    // Mark messages as read only when they are actually displayed and the user is actively viewing them
    if (selectedContact && messages.length > 0 && document.hasFocus()) {
      // Get current user ID for proper filtering
      const currentUserId = userInfo?.id;

      // Check if there are any unread messages from the selected contact
      const hasUnreadMessages = messages.some(
        (msg) =>
          msg.sender.id === selectedContact.id &&
          msg.receiver.id === currentUserId &&
          !msg.read
      );

      if (hasUnreadMessages) {
        console.log(
          "[Chat] Auto-marking messages as read for contact:",
          selectedContact.id,
          "Current user ID:",
          currentUserId,
          "Document has focus:",
          document.hasFocus()
        );

        // Only update if the document has focus (user is actively viewing)
        if (document.hasFocus()) {
          // Update the UI immediately based on Redux store
          dispatch(
            updateMessagesReadStatus({
              contactId: selectedContact.id,
              currentUserId: userInfo?.id,
            })
          );

          console.log("[Chat] Dispatched immediate UI update for read status");

          // Mark messages as read via WebSocket
          import("../services/websocketService").then(
            ({ markMessagesAsReadViaWebSocket }) => {
              markMessagesAsReadViaWebSocket(selectedContact.id);
            }
          );
        } else {
          console.log(
            "[Chat] Document does not have focus, not marking messages as read automatically"
          );
        }
      }
    }
  }, [messages, selectedContact, dispatch, userInfo?.id]);

  // Create a ref to store the previous read messages count
  const prevReadMessagesCountRef = useRef<number>(0);

  // Create a ref to store the debounce timer
  const readStatusUpdateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // No longer needed after removing polling mechanism

  // Add a useEffect to track changes in the messages array, but with debouncing
  useEffect(() => {
    // Only check for read status changes for messages sent by the current user
    const readMessages = messages.filter(
      (msg) => msg.sender.id === userInfo?.id && msg.read
    );

    const readMessagesCount = readMessages.length;

    // Only update if the number of read messages has actually changed
    if (readMessagesCount > prevReadMessagesCountRef.current) {
      console.log("[Chat] *** DETECTED NEW READ STATUS CHANGES ***");
      console.log(
        "[Chat] Found messages sent by current user that were read:",
        readMessagesCount,
        "Previous count:",
        prevReadMessagesCountRef.current
      );

      // Update the ref with the new count
      prevReadMessagesCountRef.current = readMessagesCount;

      // Clear any existing timer
      if (readStatusUpdateTimerRef.current) {
        clearTimeout(readStatusUpdateTimerRef.current);
      }

      // Use a debounced update to prevent multiple rapid re-renders
      readStatusUpdateTimerRef.current = setTimeout(() => {
        console.log("[Chat] Applying debounced read status update");
        setReadStatusVersion((prev) => prev + 1);
        readStatusUpdateTimerRef.current = null;
      }, 1000); // 1 second debounce
    }

    // Clean up the timeout when the component unmounts
    return () => {
      if (readStatusUpdateTimerRef.current) {
        clearTimeout(readStatusUpdateTimerRef.current);
      }
    };
  }, [messages, userInfo?.id]);

  // Add a window focus handler to check for read status changes when the window regains focus
  useEffect(() => {
    // Only set up focus handler if we have a selected contact and we're logged in
    if (selectedContact && userInfo?.id) {
      console.log("[Chat] Setting up window focus handler for message updates");

      // Add a focus event listener to mark messages as read when the window gets focus
      const handleWindowFocus = () => {
        console.log("[Chat] Window focus gained, updating read status");

        // Only update the UI based on current Redux store data
        // No fetch needed - WebSocket will keep the store updated
        if (selectedContact) {
          dispatch(
            updateMessagesReadStatus({
              contactId: selectedContact.id,
              currentUserId: userInfo?.id,
            })
          );
        }
      };

      window.addEventListener("focus", handleWindowFocus);

      // Clean up event listeners when the component unmounts or the selected contact changes
      return () => {
        console.log("[Chat] Cleaning up window focus event listener");
        window.removeEventListener("focus", handleWindowFocus);
      };
    }
  }, [selectedContact, userInfo?.id, dispatch]);

  // Add an effect to send the initial user status when the component mounts
  useEffect(() => {
    // Only send status update if user is logged in
    if (userInfo?.id) {
      console.log("[Chat] Sending initial user status:", userStatus);

      // Send the initial status update via WebSocket
      const sent = sendStatusUpdateViaWebSocket(userStatus);

      if (!sent) {
        console.warn(
          "[Chat] Failed to send initial status update via WebSocket"
        );
      } else {
        console.log("[Chat] Initial status update sent successfully");
      }
    }
  }, [userInfo?.id, userStatus]);

  // These functions are now handled by Redux actions

  const sendMessage = async () => {
    console.log("[Chat] Send message function called");

    if (!messageText.trim()) {
      console.log("[Chat] Message text is empty, not sending");
      return;
    }

    if (!selectedContact) {
      console.log("[Chat] No contact selected, cannot send message");
      return;
    }

    console.log("[Chat] Preparing to send message:", {
      text: messageText,
      to: selectedContact.name,
      contactId: selectedContact.id,
      persistent: persistMessages,
    });

    // Create a temporary message to display immediately
    const tempId = `temp-${Date.now()}`;
    console.log("[Chat] Creating temporary message with ID:", tempId);

    const tempMessage: ChatMessage = {
      id: tempId,
      content: messageText,
      sender: {
        id: userInfo?.id || "unknown",
        name: userInfo?.username || "Me",
      },
      receiver: {
        id: selectedContact.id,
        name: selectedContact.name,
      },
      timestamp: new Date().toISOString(),
      read: false,
      persistent: persistMessages,
    };

    // Add the temporary message to the Redux store
    console.log("[Chat] Adding temporary message to store:", tempMessage);
    dispatch(addMessage(tempMessage));

    try {
      // Try to send via WebSocket first
      console.log("[Chat] Attempting to send via WebSocket");
      console.log("[Chat] Message persistence setting:", persistMessages);
      const sentViaWebSocket = sendMessageViaWebSocket(
        messageText,
        selectedContact.id,
        persistMessages
      );
      console.log(
        "[Chat] WebSocket send result:",
        sentViaWebSocket ? "Success" : "Failed"
      );

      // If WebSocket fails or is not connected, fall back to HTTP
      if (!sentViaWebSocket) {
        console.log("[Chat] WebSocket send failed, falling back to HTTP");
        console.log("[Chat] Dispatching sendMessageThunk");

        const result = await dispatch(
          sendMessageThunk({
            content: messageText,
            receiverId: selectedContact.id,
            persistent: persistMessages,
          })
        ).unwrap();

        console.log("[Chat] HTTP send result:", result);
      }

      // Clear the input field
      console.log("[Chat] Clearing message input field");
      setMessageText("");
    } catch (error) {
      console.error("[Chat] Error sending message:", error);
      notification.error({
        message: "Error",
        description: "Failed to send message. Please try again.",
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    console.log("[Chat] Key pressed:", e.key);

    if (e.key === "Enter") {
      console.log("[Chat] Enter key detected, triggering sendMessage");
      e.preventDefault(); // Prevent default form submission behavior
      sendMessage();
    }
  };

  // Define a type for notification message
  interface NotificationMessage {
    payload?: {
      contactId?: string;
    };
  }

  const onNotificationClick = (message: NotificationMessage) => {
    // Handle notification click - e.g., navigate to specific chat
    if (message.payload && message.payload.contactId) {
      const contactId = message.payload.contactId;
      const contact = contacts.find((c) => c.id === contactId);
      if (contact) {
        dispatch(setSelectedContact(contact));
        // Fetch messages for this contact
        dispatch(fetchMessages(contactId));
      }
    }
  };

  // Function to show the add contact modal
  const showAddContactModal = () => {
    setIsAddContactModalVisible(true);
    form.resetFields();
  };

  // Function to handle modal cancel
  const handleCancel = () => {
    setIsAddContactModalVisible(false);
    setNewContactEmail("");
    form.resetFields();
  };

  // Function to update user status
  const updateUserStatus = (status: "online" | "away" | "busy" | "offline") => {
    console.log("[Chat] Updating user status to:", status);

    // Update local state
    setUserStatus(status);

    // Update Redux store
    dispatch(updateUserStatusInRedux(status));

    // Send status update via WebSocket for real-time updates
    const sent = sendStatusUpdateViaWebSocket(status);

    if (!sent) {
      console.warn("[Chat] Failed to send status update via WebSocket");
      notification.warning({
        message: "Status Update",
        description:
          "Could not update your status in real-time. Other users may not see your current status.",
        duration: 3,
      });
    }

    // Update status in database for persistence
    try {
      // Import the updateUserStatus function from userService
      import("../services/userService").then(
        ({ updateUserStatus: updateUserStatusInDB }) => {
          // Get token from Redux store
          const token = store.getState().auth.token;

          if (token) {
            // Update in database
            updateUserStatusInDB(status, token)
              .then(() => {
                console.log("[Chat] Status updated in database successfully");
                notification.success({
                  message: "Status Updated",
                  description: `Your status is now set to ${status}.`,
                  duration: 2,
                });
              })
              .catch((error) => {
                console.error(
                  "[Chat] Error updating status in database:",
                  error
                );
                // Still show success notification if WebSocket update was successful
                if (sent) {
                  notification.success({
                    message: "Status Updated",
                    description: `Your status is now set to ${status} (real-time only).`,
                    duration: 2,
                  });
                }
              });
          } else {
            console.warn(
              "[Chat] No token available, cannot update status in database"
            );
            // Still show success notification if WebSocket update was successful
            if (sent) {
              notification.success({
                message: "Status Updated",
                description: `Your status is now set to ${status} (real-time only).`,
                duration: 2,
              });
            }
          }
        }
      );
    } catch (error) {
      console.error("[Chat] Error importing updateUserStatus function:", error);
      // Still show success notification if WebSocket update was successful
      if (sent) {
        notification.success({
          message: "Status Updated",
          description: `Your status is now set to ${status} (real-time only).`,
          duration: 2,
        });
      }
    }
  };

  // Function to handle adding a new contact
  const handleAddContact = async () => {
    try {
      await form.validateFields();
      if (!newContactEmail.trim()) {
        notification.error({
          message: "Error",
          description: "Please enter a valid email address.",
        });
        return;
      }

      // Dispatch the addContact action
      await dispatch(addContact(newContactEmail));

      // Close the modal and reset the form
      setIsAddContactModalVisible(false);
      setNewContactEmail("");
      form.resetFields();

      notification.success({
        message: "Success",
        description: "Contact request sent successfully! Waiting for approval.",
      });
    } catch (error) {
      console.error("Error adding contact:", error);
      notification.error({
        message: "Error",
        description: "Failed to add contact. Please try again.",
      });
    }
  };

  // Function to handle responding to a contact request
  const handleRespondToRequest = async (
    contactId: string,
    action: "accept" | "reject"
  ) => {
    try {
      await dispatch(respondToRequest({ contactId, action }));

      notification.success({
        message: "Success",
        description: `Contact request ${
          action === "accept" ? "accepted" : "rejected"
        } successfully!`,
      });
    } catch (error) {
      console.error(`Error ${action}ing contact request:`, error);
      notification.error({
        message: "Error",
        description: `Failed to ${action} contact request. Please try again.`,
      });
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* Removed top header with Chat title and notification */}

      <div style={{ display: "flex", height: "100%", gap: 16 }}>
        {/* Contacts List - 25% width */}
        <Card
          style={{
            width: "25%",
            height: "100%",
            overflow: "auto",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
            border: "none",
          }}
          styles={{
            body: { padding: 0, height: "100%" },
          }}
        >
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid #f0f0f0",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              background: "linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%)",
            }}
          >
            {/* User profile and notification row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: "online",
                        label: (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: "#52c41a",
                              }}
                            />
                            <span>Available</span>
                          </div>
                        ),
                        onClick: () => updateUserStatus("online"),
                      },
                      {
                        key: "away",
                        label: (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: "#faad14",
                              }}
                            />
                            <span>Away</span>
                          </div>
                        ),
                        onClick: () => updateUserStatus("away"),
                      },
                      {
                        key: "busy",
                        label: (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: "#f5222d",
                              }}
                            />
                            <span>Busy</span>
                          </div>
                        ),
                        onClick: () => updateUserStatus("busy"),
                      },
                      {
                        key: "offline",
                        label: (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: "#8c8c8c",
                              }}
                            />
                            <span>Appear Offline</span>
                          </div>
                        ),
                        onClick: () => updateUserStatus("offline"),
                      },
                    ],
                  }}
                  placement="bottomLeft"
                  trigger={["click"]}
                >
                  <div
                    style={{ position: "relative", cursor: "pointer" }}
                    title={`Status: ${
                      userStatus.charAt(0).toUpperCase() + userStatus.slice(1)
                    }`}
                  >
                    <Avatar
                      size="large"
                      icon={<UserOutlined />}
                      style={{
                        backgroundColor:
                          userStatus === "online"
                            ? "#52c41a"
                            : userStatus === "away"
                            ? "#faad14"
                            : userStatus === "busy"
                            ? "#f5222d"
                            : "#8c8c8c",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        border: "2px solid white",
                        background:
                          userStatus === "online"
                            ? "#52c41a" // Green for Online
                            : userStatus === "away"
                            ? "#faad14" // Yellow for Away
                            : userStatus === "busy"
                            ? "#f5222d" // Red for Busy
                            : "#8c8c8c", // Grey for Offline
                      }}
                    />
                  </div>
                </Dropdown>
                <Text strong style={{ fontSize: "16px" }}>
                  {userInfo?.username || "User"}
                </Text>
              </div>

              <NovuProvider
                subscriberId={userId}
                applicationIdentifier={NOVU_APP_ID}
              >
                <PopoverNotificationCenter
                  onNotificationClick={onNotificationClick}
                  colorScheme="light"
                >
                  {({ unseenCount }) => (
                    <NotificationBell unseenCount={unseenCount} />
                  )}
                </PopoverNotificationCenter>
              </NovuProvider>
            </div>

            {/* Search and action buttons row */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <Input
                placeholder="Search contacts..."
                prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{
                  borderRadius: "8px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                  flex: 1,
                }}
                allowClear
              />

              <Button
                icon={<UserAddOutlined style={{ fontSize: "14px" }} />}
                onClick={showAddContactModal}
                style={actionButtonStyles.addContact}
                title="Add New Contact"
                className="action-button"
              />

              <Button
                icon={<UsergroupAddOutlined style={{ fontSize: "14px" }} />}
                style={actionButtonStyles.addGroup}
                title="Create New Group"
                className="action-button"
              />

              <Dropdown
                menu={{
                  items: [
                    {
                      key: "all",
                      label: (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              fontWeight:
                                activeFilter === "all" ? "bold" : "normal",
                            }}
                          >
                            All Contacts
                          </span>
                        </div>
                      ),
                      onClick: () => setActiveFilter("all"),
                    },
                    {
                      key: "unread",
                      label: (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              fontWeight:
                                activeFilter === "unread" ? "bold" : "normal",
                            }}
                          >
                            Unread Messages
                          </span>
                        </div>
                      ),
                      onClick: () => setActiveFilter("unread"),
                    },
                    {
                      type: "divider",
                    },
                    {
                      key: "friend",
                      label: (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <UserOutlined style={{ color: "#f5222d" }} />
                          <span
                            style={{
                              color: "#f5222d",
                              fontWeight:
                                activeFilter === "friend" ? "bold" : "normal",
                            }}
                          >
                            Friends
                          </span>
                        </div>
                      ),
                      onClick: () => setActiveFilter("friend"),
                    },
                    {
                      key: "family",
                      label: (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <TagOutlined style={{ color: "#52c41a" }} />
                          <span
                            style={{
                              color: "#52c41a",
                              fontWeight:
                                activeFilter === "family" ? "bold" : "normal",
                            }}
                          >
                            Family
                          </span>
                        </div>
                      ),
                      onClick: () => setActiveFilter("family"),
                    },
                    {
                      key: "college",
                      label: (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <BookOutlined style={{ color: "#1890ff" }} />
                          <span
                            style={{
                              color: "#1890ff",
                              fontWeight:
                                activeFilter === "college" ? "bold" : "normal",
                            }}
                          >
                            College
                          </span>
                        </div>
                      ),
                      onClick: () => setActiveFilter("college"),
                    },
                    {
                      key: "work",
                      label: (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <LaptopOutlined style={{ color: "#722ed1" }} />
                          <span
                            style={{
                              color: "#722ed1",
                              fontWeight:
                                activeFilter === "work" ? "bold" : "normal",
                            }}
                          >
                            Work
                          </span>
                        </div>
                      ),
                      onClick: () => setActiveFilter("work"),
                    },
                    {
                      key: "other",
                      label: (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <StarOutlined style={{ color: "#faad14" }} />
                          <span
                            style={{
                              color: "#faad14",
                              fontWeight:
                                activeFilter === "other" ? "bold" : "normal",
                            }}
                          >
                            Other
                          </span>
                        </div>
                      ),
                      onClick: () => setActiveFilter("other"),
                    },
                  ],
                }}
                placement="bottomRight"
                trigger={["click"]}
              >
                <Button
                  icon={
                    <FilterOutlined
                      style={{
                        color: activeFilter !== "all" ? "#1890ff" : undefined,
                        fontSize: "14px",
                      }}
                    />
                  }
                  style={actionButtonStyles.filter(activeFilter !== "all")}
                  title="Filter Contacts"
                  className="action-button"
                />
              </Dropdown>
            </div>
          </div>

          {/* Pending Contact Requests Section */}
          {pendingRequests && pendingRequests.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Title level={5} style={{ marginBottom: 8, color: "#ff4d4f" }}>
                Pending Requests
              </Title>
              <List
                dataSource={pendingRequests}
                renderItem={(request) => (
                  <List.Item
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "rgba(255, 77, 79, 0.05)",
                      borderRadius: "8px",
                      margin: "4px 0",
                      border: "1px solid rgba(255, 77, 79, 0.2)",
                    }}
                    actions={[
                      <Button
                        key="accept"
                        type="primary"
                        size="small"
                        onClick={() =>
                          handleRespondToRequest(request.id, "accept")
                        }
                      >
                        Accept
                      </Button>,
                      <Button
                        key="reject"
                        danger
                        size="small"
                        onClick={() =>
                          handleRespondToRequest(request.id, "reject")
                        }
                      >
                        Reject
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{ position: "relative" }}>
                          <Avatar
                            icon={<UserOutlined />}
                            style={{
                              backgroundColor:
                                request.status === "online"
                                  ? USER_STATUS_COLORS.ONLINE
                                  : request.status === "away"
                                  ? USER_STATUS_COLORS.AWAY
                                  : request.status === "busy"
                                  ? USER_STATUS_COLORS.BUSY
                                  : USER_STATUS_COLORS.OFFLINE_AVATAR,
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              bottom: 0,
                              right: 0,
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              border: "1px solid white",
                              background:
                                request.status === "online"
                                  ? USER_STATUS_COLORS.ONLINE
                                  : request.status === "away"
                                  ? USER_STATUS_COLORS.AWAY
                                  : request.status === "busy"
                                  ? USER_STATUS_COLORS.BUSY
                                  : USER_STATUS_COLORS.OFFLINE,
                            }}
                          />
                        </div>
                      }
                      title={request.name}
                      description={request.email}
                    />
                  </List.Item>
                )}
              />
            </div>
          )}

          {/* Contacts List with Scroll */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              paddingBottom: "8px",
            }}
          >
            {loadingContacts ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "20px",
                }}
              >
                <Spin />
              </div>
            ) : (
              <List
                locale={{
                  emptyText: (
                    <div style={{ padding: "20px", textAlign: "center" }}>
                      <div style={{ marginBottom: "10px", fontSize: "24px" }}>
                        <SearchOutlined style={{ color: "#bfbfbf" }} />
                      </div>
                      <Text type="secondary">
                        {searchText
                          ? "No contacts match your search"
                          : activeFilter !== "all"
                          ? "No contacts in this filter"
                          : "No contacts found"}
                      </Text>
                    </div>
                  ),
                }}
                dataSource={contacts.filter((contact) => {
                  // Apply search filter
                  const matchesSearch =
                    searchText === "" ||
                    contact.name
                      .toLowerCase()
                      .includes(searchText.toLowerCase()) ||
                    contact.email
                      .toLowerCase()
                      .includes(searchText.toLowerCase());

                  // Apply group/category filter
                  const matchesFilter =
                    activeFilter === "all"
                      ? true
                      : activeFilter === "unread"
                      ? contact.unreadCount > 0
                      : activeFilter === "friend"
                      ? contact.group === "Friend"
                      : activeFilter === "family"
                      ? contact.group === "Family"
                      : activeFilter === "college"
                      ? contact.group === "College"
                      : activeFilter === "work"
                      ? contact.group === "Work"
                      : activeFilter === "other"
                      ? contact.group === "Other"
                      : true;

                  return matchesSearch && matchesFilter;
                })}
                renderItem={(contact) => {
                  return (
                    <List.Item
                      onClick={() => dispatch(setSelectedContact(contact))}
                      style={{
                        cursor: "pointer",
                        backgroundColor:
                          selectedContact?.id === contact.id
                            ? "rgba(24, 144, 255, 0.1)"
                            : "transparent",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        margin: "4px 8px",
                        transition: "all 0.3s ease",
                        border:
                          selectedContact?.id === contact.id
                            ? "1px solid rgba(24, 144, 255, 0.2)"
                            : "1px solid transparent",
                      }}
                      className="contact-list-item"
                      actions={[]}
                    >
                      <List.Item.Meta
                        avatar={
                          <div style={{ position: "relative" }}>
                            <Avatar
                              icon={<UserOutlined />}
                              style={{
                                backgroundColor:
                                  contact.status === "online"
                                    ? USER_STATUS_COLORS.ONLINE
                                    : contact.status === "away"
                                    ? USER_STATUS_COLORS.AWAY
                                    : contact.status === "busy"
                                    ? USER_STATUS_COLORS.BUSY
                                    : USER_STATUS_COLORS.OFFLINE_AVATAR,
                              }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                bottom: 0,
                                right: 0,
                                width: "10px",
                                height: "10px",
                                borderRadius: "50%",
                                border: "1px solid white",
                                background:
                                  contact.status === "online"
                                    ? USER_STATUS_COLORS.ONLINE
                                    : contact.status === "away"
                                    ? USER_STATUS_COLORS.AWAY
                                    : contact.status === "busy"
                                    ? USER_STATUS_COLORS.BUSY
                                    : USER_STATUS_COLORS.OFFLINE,
                              }}
                            />
                          </div>
                        }
                        title={
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <span>{contact.name}</span>
                              {contact.group && (
                                <Tag
                                  color={
                                    contact.group === "Friend"
                                      ? "red"
                                      : contact.group === "Family"
                                      ? "green"
                                      : contact.group === "College"
                                      ? "blue"
                                      : contact.group === "Work"
                                      ? "purple"
                                      : contact.group === "Other"
                                      ? "orange"
                                      : "default"
                                  }
                                  icon={
                                    contact.group === "Friend" ? (
                                      <UserOutlined />
                                    ) : contact.group === "Family" ? (
                                      <TagOutlined />
                                    ) : contact.group === "College" ? (
                                      <BookOutlined />
                                    ) : contact.group === "Work" ? (
                                      <LaptopOutlined />
                                    ) : contact.group === "Other" ? (
                                      <StarOutlined />
                                    ) : null
                                  }
                                  style={{
                                    fontSize: "10px",
                                    lineHeight: "14px",
                                    padding: "0 4px",
                                  }}
                                >
                                  {contact.group}
                                </Tag>
                              )}
                              <Dropdown
                                menu={{
                                  items: [
                                    {
                                      key: "friend",
                                      label: (
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                          }}
                                        >
                                          <UserOutlined
                                            style={{ color: "#f5222d" }}
                                          />
                                          <span style={{ color: "#f5222d" }}>
                                            Friend
                                          </span>
                                        </div>
                                      ),
                                      onClick: (e) => {
                                        e.domEvent.stopPropagation();
                                        dispatch(
                                          updateContactGroupThunk({
                                            contactId: contact.id,
                                            group: "Friend",
                                          })
                                        );
                                      },
                                    },
                                    {
                                      key: "family",
                                      label: (
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                          }}
                                        >
                                          <TagOutlined
                                            style={{ color: "#52c41a" }}
                                          />
                                          <span style={{ color: "#52c41a" }}>
                                            Family
                                          </span>
                                        </div>
                                      ),
                                      onClick: (e) => {
                                        e.domEvent.stopPropagation();
                                        dispatch(
                                          updateContactGroupThunk({
                                            contactId: contact.id,
                                            group: "Family",
                                          })
                                        );
                                      },
                                    },
                                    {
                                      key: "college",
                                      label: (
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                          }}
                                        >
                                          <BookOutlined
                                            style={{ color: "#1890ff" }}
                                          />
                                          <span style={{ color: "#1890ff" }}>
                                            College
                                          </span>
                                        </div>
                                      ),
                                      onClick: (e) => {
                                        e.domEvent.stopPropagation();
                                        dispatch(
                                          updateContactGroupThunk({
                                            contactId: contact.id,
                                            group: "College",
                                          })
                                        );
                                      },
                                    },
                                    {
                                      key: "work",
                                      label: (
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                          }}
                                        >
                                          <LaptopOutlined
                                            style={{ color: "#722ed1" }}
                                          />
                                          <span style={{ color: "#722ed1" }}>
                                            Work
                                          </span>
                                        </div>
                                      ),
                                      onClick: (e) => {
                                        e.domEvent.stopPropagation();
                                        dispatch(
                                          updateContactGroupThunk({
                                            contactId: contact.id,
                                            group: "Work",
                                          })
                                        );
                                      },
                                    },
                                    {
                                      key: "other",
                                      label: (
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                          }}
                                        >
                                          <StarOutlined
                                            style={{ color: "#faad14" }}
                                          />
                                          <span style={{ color: "#faad14" }}>
                                            Other
                                          </span>
                                        </div>
                                      ),
                                      onClick: (e) => {
                                        e.domEvent.stopPropagation();
                                        dispatch(
                                          updateContactGroupThunk({
                                            contactId: contact.id,
                                            group: "Other",
                                          })
                                        );
                                      },
                                    },
                                    {
                                      key: "none",
                                      label: (
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                          }}
                                        >
                                          <CloseCircleOutlined
                                            style={{ color: "#8c8c8c" }}
                                          />
                                          <span style={{ color: "#8c8c8c" }}>
                                            None
                                          </span>
                                        </div>
                                      ),
                                      onClick: (e) => {
                                        e.domEvent.stopPropagation();
                                        dispatch(
                                          updateContactGroupThunk({
                                            contactId: contact.id,
                                            group: "",
                                          })
                                        );
                                      },
                                    },
                                  ],
                                }}
                                onClick={(e) => e.stopPropagation()}
                                placement="bottomRight"
                                trigger={["click"]}
                              >
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<TagOutlined />}
                                  style={{
                                    color: "#8c8c8c",
                                    padding: 0,
                                    minWidth: "20px",
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </Dropdown>
                            </div>
                            {contact.unreadCount > 0 && (
                              <Tag color="#1890ff">{contact.unreadCount}</Tag>
                            )}
                          </div>
                        }
                        description={
                          <Text
                            type="secondary"
                            style={{
                              fontSize: "12px",
                            }}
                          >
                            {contact.email}
                          </Text>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            )}
          </div>
        </Card>

        {/* Chat Area - 75% width */}
        <Card
          style={{
            width: "75%",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
            border: "none",
            background: "#fff",
            overflow: "hidden", // Prevent overflow from the card
          }}
          styles={{
            body: {
              padding: 0,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
            },
          }}
        >
          {selectedContact ? (
            <>
              <div
                style={{
                  padding: "16px",
                  borderBottom: "1px solid #f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between" /* Added to create space between contact info and switch */,
                  background:
                    "linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%)",
                  borderTopLeftRadius: "12px",
                  borderTopRightRadius: "12px",
                  zIndex: 10, // Ensure header stays on top
                }}
              >
                {/* Left side - Contact info */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar
                    icon={<UserOutlined />}
                    style={{
                      backgroundColor:
                        selectedContact.status === "online"
                          ? USER_STATUS_COLORS.ONLINE
                          : selectedContact.status === "away"
                          ? USER_STATUS_COLORS.AWAY
                          : selectedContact.status === "busy"
                          ? USER_STATUS_COLORS.BUSY
                          : USER_STATUS_COLORS.OFFLINE_AVATAR,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Title
                        level={4}
                        style={{
                          margin: 0,
                          fontSize: "16px",
                          fontWeight: 600,
                        }}
                      >
                        {selectedContact.name}
                      </Title>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        style={{ color: "#8c8c8c" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Show a modal to edit the display name
                          Modal.confirm({
                            title: "Edit Display Name",
                            content: (
                              <Input
                                placeholder="Enter new display name"
                                defaultValue={selectedContact.name}
                                id="display-name-input"
                              />
                            ),
                            onOk: () => {
                              const input = document.getElementById(
                                "display-name-input"
                              ) as HTMLInputElement;
                              const newName = input?.value;
                              if (newName && newName.trim()) {
                                dispatch(
                                  updateContactDisplayNameThunk({
                                    contactId: selectedContact.id,
                                    displayName: newName.trim(),
                                  })
                                );
                                notification.success({
                                  message: "Success",
                                  description:
                                    "Contact name updated successfully!",
                                });
                              }
                            },
                          });
                        }}
                      />
                    </div>
                    <Text
                      type="secondary"
                      style={{
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background:
                            selectedContact.status === "online"
                              ? USER_STATUS_COLORS.ONLINE
                              : selectedContact.status === "away"
                              ? USER_STATUS_COLORS.AWAY
                              : selectedContact.status === "busy"
                              ? USER_STATUS_COLORS.BUSY
                              : USER_STATUS_COLORS.OFFLINE,
                        }}
                      />
                      {selectedContact.status.charAt(0).toUpperCase() +
                        selectedContact.status.slice(1)}
                    </Text>
                  </div>
                </div>

                {/* Right side - Save switch */}
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Text
                    style={{
                      marginRight: "8px",
                      fontSize: "14px",
                      color: persistMessages ? "#52c41a" : "#ff4d4f",
                    }}
                  >
                    {persistMessages
                      ? "Messages will be saved"
                      : "Messages will not be saved"}
                  </Text>
                  <Switch
                    checked={persistMessages}
                    onChange={(checked) => {
                      console.log(
                        "[Chat] Persistence setting changed to:",
                        checked
                      );
                      setPersistMessages(checked);
                    }}
                    checkedChildren="Save"
                    unCheckedChildren="Don't save"
                    size="small"
                  />
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  padding: "16px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column", // Changed from column-reverse to column
                  background: "#fff",
                  width: "100%" /* Ensure full width of container */,
                }}
              >
                <div style={{ width: "100%" }}>
                  {loadingContacts ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                        padding: "20px 0",
                      }}
                    >
                      <Spin />
                    </div>
                  ) : messages.length === 0 ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "40px 0",
                      }}
                    >
                      <Text type="secondary">
                        No messages yet. Start the conversation!
                      </Text>
                    </div>
                  ) : (
                    // Display messages in correct chronological order
                    messages.map((message) => (
                      <div
                        key={`${message.id}-${
                          message.read ? "read" : "unread"
                        }-${readStatusVersion}`}
                        style={{
                          alignSelf:
                            message.sender.id === userId
                              ? "flex-end"
                              : "flex-start",
                          backgroundColor:
                            message.sender.id === userId
                              ? "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)"
                              : "linear-gradient(135deg, #f5f5f5 0%, #e9e9e9 100%)",
                          background:
                            message.sender.id === userId
                              ? "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)"
                              : "linear-gradient(135deg, #f5f5f5 0%, #e9e9e9 100%)",
                          color:
                            message.sender.id === userId
                              ? "white"
                              : "rgba(0, 0, 0, 0.85)",
                          padding: "10px 14px",
                          borderRadius:
                            message.sender.id === userId
                              ? "18px 18px 4px 18px"
                              : "18px 18px 18px 4px",
                          maxWidth: "80%" /* Updated to 80% */,
                          width:
                            "fit-content" /* Added to make width fit content */,
                          marginBottom: 12,
                          marginLeft:
                            message.sender.id === userId
                              ? "auto"
                              : 0 /* Right align for current user */,
                          marginRight:
                            message.sender.id === userId
                              ? 0
                              : "auto" /* Left align for other users */,
                          wordBreak: "break-word",
                          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                          position: "relative",
                        }}
                      >
                        <div>{message.content}</div>
                        <div
                          style={{
                            fontSize: 11,
                            marginTop: 4,
                            textAlign: "right",
                            opacity: 0.8,
                            fontWeight: 500,
                            letterSpacing: "0.3px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            {message.persistent === false && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  color:
                                    message.sender.id === userId
                                      ? "#fff"
                                      : "#ff4d4f",
                                  opacity: 0.8,
                                }}
                                title="This message is not saved to database"
                              >
                                ⚡
                              </span>
                            )}
                            {new Date(message.timestamp).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>

                          {message.sender.id === userId && (
                            <span
                              style={{
                                fontSize: "14px",
                                color: message.read ? "#52c41a" : "#fff",
                                opacity: message.read ? 1 : 0.7,
                                fontWeight: message.read ? "bold" : "normal",
                              }}
                              title={message.read ? "Read" : "Sent"}
                            >
                              {message.read ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />{" "}
                  {/* Moved reference to the end of messages */}
                </div>
              </div>

              <div
                style={{
                  padding: "16px",
                  borderTop: "1px solid #f0f0f0",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  background:
                    "linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%)",
                  borderBottomLeftRadius: "12px",
                  borderBottomRightRadius: "12px",
                  zIndex: 10, // Ensure input stays on top
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <Input.TextArea
                    placeholder="Type a message..."
                    value={messageText}
                    autoSize={{
                      minRows: 2,
                      maxRows: 6,
                    }} /* Set minimum height to 2 rows (double the default) */
                    onChange={(e) => {
                      setMessageText(e.target.value);
                      // Send typing notification when user starts typing
                      if (selectedContact) {
                        sendTypingNotification(selectedContact.id);
                      }
                    }}
                    onFocus={() => {
                      // Update read status when input is focused
                      if (selectedContact) {
                        console.log(
                          "[Chat] Message input focused, updating read status"
                        );
                        // Only update the UI based on current Redux store data
                        dispatch(
                          updateMessagesReadStatus({
                            contactId: selectedContact.id,
                            currentUserId: userInfo?.id,
                          })
                        );

                        // Mark messages as read via WebSocket
                        import("../services/websocketService").then(
                          ({ markMessagesAsReadViaWebSocket }) => {
                            markMessagesAsReadViaWebSocket(selectedContact.id);
                          }
                        );
                      }
                    }}
                    onKeyPress={handleKeyPress}
                    style={{
                      flex: 1,
                      borderRadius: "20px",
                      padding: "8px 16px",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                      border: "1px solid #e8e8e8",
                      height: "80px", // Doubled height from 40px to 80px
                      resize: "none", // Prevent manual resizing
                    }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={sendMessage}
                    disabled={!messageText.trim()}
                    style={{
                      borderRadius: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: messageText.trim()
                        ? "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)"
                        : undefined,
                      boxShadow: messageText.trim()
                        ? "0 2px 5px rgba(0, 0, 0, 0.15)"
                        : undefined,
                      transition: "all 0.3s ease",
                      height: "40px", // Standard height for the button
                      width: "80px", // Fixed width
                    }}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <Text type="secondary">Select a contact to start chatting</Text>
            </div>
          )}
        </Card>
      </div>

      {/* Add Contact Modal */}
      <Modal
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#1890ff",
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            <PlusOutlined style={{ fontSize: "20px" }} /> Add New Contact
          </div>
        }
        open={isAddContactModalVisible}
        onOk={handleAddContact}
        onCancel={handleCancel}
        okText="Add Contact"
        cancelText="Cancel"
        okButtonProps={{
          style: {
            background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
            border: "none",
            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
          },
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              {
                required: true,
                message: "Please enter an email address",
              },
              {
                type: "email",
                message: "Please enter a valid email address",
              },
            ]}
          >
            <Input
              placeholder="Enter email address"
              value={newContactEmail}
              onChange={(e) => setNewContactEmail(e.target.value)}
              style={{
                borderRadius: "6px",
                padding: "8px 12px",
              }}
            />
          </Form.Item>
          <div
            style={{
              marginTop: "16px",
              fontSize: "13px",
              color: "#8c8c8c",
            }}
          >
            <p style={{ margin: 0 }}>
              Enter the email address of the person you want to chat with. They
              will receive a notification to connect with you.
            </p>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ChatPage;


