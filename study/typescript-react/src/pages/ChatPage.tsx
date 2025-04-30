import React, { useState, useEffect, useRef } from "react";
import TinyMCEEditor from "../components/TinyMCEEditor";
import GroupAvatar from "../components/GroupAvatar";
import "../styles/ChatPage.css";
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
  Select,
  message as antdMessage,
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
  FilterOutlined,
  UserAddOutlined,
  UsergroupAddOutlined,
  EllipsisOutlined,
  DeleteOutlined,
  CopyOutlined,
  ForwardOutlined,
  CheckOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { UnknownAction, ThunkDispatch } from "@reduxjs/toolkit";
import { RootState } from "../types";
import { ChatMessage, ChatContact } from "../types/ChatTypes";

// Message Item Component
interface MessageItemProps {
  message: ChatMessage;
  userId: string;
  dispatch: ThunkDispatch<RootState, unknown, UnknownAction>;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  userId,
  dispatch,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Character limit for message preview
  const CHARACTER_LIMIT = 280;

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(message.content);
  };

  const handleSaveEdit = () => {
    if (editedContent.trim() !== "" && editedContent !== message.content) {
      dispatch(
        editMessageThunk({
          messageId: message.id,
          content: editedContent,
        })
      );
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(message.content);
  };

  // Cleanup effect to clear any pending timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleDelete = () => {
    Modal.confirm({
      title: "Delete Message",
      content: "Are you sure you want to delete this message?",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        dispatch(deleteMessageThunk(message.id));
      },
    });
  };

  const handleCopy = () => {
    // Create a temporary element to hold the message content without formatting
    const tempElement = document.createElement("div");
    tempElement.innerHTML = message.content;
    const textContent = tempElement.textContent || tempElement.innerText || "";

    // Copy to clipboard
    navigator.clipboard
      .writeText(textContent)
      .then(() => {
        // Use the imported message from antd, not the message prop
        antdMessage.success("Message copied to clipboard");
      })
      .catch((err) => {
        console.error("Failed to copy message: ", err);
        // Use the imported message from antd, not the message prop
        antdMessage.error("Failed to copy message");
      });

    setIsDropdownOpen(false);
  };

  // Forward Message Modal Component
  const ForwardMessageModal = ({
    messageContent,
    contacts,
    onCancel,
    onForward,
  }: {
    messageContent: string;
    contacts: ChatContact[];
    onCancel: () => void;
    onForward: (contactIds: string[]) => void;
  }) => {
    const [searchText, setSearchText] = useState("");
    const [selectedContacts, setSelectedContacts] = useState<Set<string>>(
      new Set()
    );

    // Filter contacts based on search text
    const filteredContacts = contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(searchText.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchText.toLowerCase())
    );

    // Extract plain text from HTML content
    const getPlainText = (html: string) => {
      const tempElement = document.createElement("div");
      tempElement.innerHTML = html;
      return tempElement.textContent || tempElement.innerText || "";
    };

    const plainTextContent = getPlainText(messageContent);

    const handleOk = () => {
      if (selectedContacts.size === 0) {
        antdMessage.error("Please select at least one contact");
        return;
      }
      onForward(Array.from(selectedContacts));
    };

    return (
      <div>
        {/* Message Preview */}
        <div style={{ marginBottom: 16 }}>
          <Typography.Text strong>Message Preview:</Typography.Text>
          <div
            style={{
              maxHeight: "80px",
              overflow: "auto",
              border: "1px solid #d9d9d9",
              borderRadius: "4px",
              padding: "8px",
              marginTop: "8px",
              backgroundColor: "#f5f5f5",
            }}
          >
            {plainTextContent.length > 100
              ? plainTextContent.substring(0, 100) + "..."
              : plainTextContent}
          </div>
        </div>

        {/* Search Bar */}
        <Input
          placeholder="Search contacts..."
          prefix={<SearchOutlined />}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ marginBottom: 16 }}
          autoFocus
        />

        {/* Contact List */}
        <div
          style={{
            maxHeight: "300px",
            overflow: "auto",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
          }}
        >
          <List
            dataSource={filteredContacts}
            renderItem={(contact) => (
              <List.Item
                key={contact.id}
                onClick={() => {
                  // Toggle selection
                  const newSelected = new Set(selectedContacts);
                  if (newSelected.has(contact.id)) {
                    newSelected.delete(contact.id);
                  } else {
                    newSelected.add(contact.id);
                  }
                  setSelectedContacts(newSelected);
                }}
                style={{
                  cursor: "pointer",
                  backgroundColor: selectedContacts.has(contact.id)
                    ? "#e6f7ff"
                    : "transparent",
                  padding: "8px 16px",
                  transition: "background-color 0.3s",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Avatar icon={<UserOutlined />} style={{ marginRight: 12 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{contact.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(0, 0, 0, 0.45)" }}>
                    {contact.email}
                  </div>
                </div>
                {selectedContacts.has(contact.id) && (
                  <div style={{ color: "#1890ff" }}>
                    <CheckOutlined />
                  </div>
                )}
              </List.Item>
            )}
            locale={{ emptyText: "No contacts found" }}
          />
        </div>

        {/* Selected Contacts Count */}
        {selectedContacts.size > 0 && (
          <div style={{ marginTop: 8, textAlign: "right" }}>
            <Typography.Text type="secondary">
              {selectedContacts.size} contact
              {selectedContacts.size > 1 ? "s" : ""} selected
            </Typography.Text>
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
          }}
        >
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleOk}
            disabled={selectedContacts.size === 0}
          >
            Forward
            {selectedContacts.size > 0 ? ` (${selectedContacts.size})` : ""}
          </Button>
        </div>
      </div>
    );
  };

  const handleForward = () => {
    // Create the modal
    const modal = Modal.info({
      icon: null,
      content: null, // We'll update this after creating the modal
      footer: null,
      closable: true,
      maskClosable: true,
      width: 520,
      className: "forward-message-modal-container",
    });

    // Get the contacts from Redux store
    const { contacts } = store.getState().chat;

    // Render our custom component inside the modal
    modal.update({
      content: (
        <ForwardMessageModal
          messageContent={message.content}
          contacts={contacts}
          onCancel={() => {
            modal.destroy();
            setIsDropdownOpen(false);
          }}
          onForward={(contactIds) => {
            // Get the current user ID
            const currentUserId = store.getState().user.userInfo?.id || "";

            // Check if the user is only trying to forward to themselves
            const isOnlySendingToSelf =
              contactIds.length === 1 && contactIds[0] === currentUserId;

            if (isOnlySendingToSelf) {
              antdMessage.warning(
                "You cannot forward a message only to yourself"
              );
              modal.destroy();
              setIsDropdownOpen(false);
              return;
            }

            // Check if any of the recipients is the current user
            const includesSelf = contactIds.includes(currentUserId);

            // Filter out current user from recipients to prevent duplicates
            const filteredContactIds = contactIds.filter(
              (id) => String(id) !== String(currentUserId)
            );
            console.log(
              "[Chat] Recipients after filtering out current user:",
              filteredContactIds
            );

            // Only proceed if we have recipients after filtering
            if (filteredContactIds.length === 0) {
              console.log(
                "[Chat] No recipients to forward to after filtering out current user"
              );

              // Show appropriate message based on whether the user tried to forward only to themselves
              if (includesSelf && contactIds.length === 1) {
                antdMessage.warning("Cannot forward a message to yourself");
              } else {
                antdMessage.info("No valid recipients to forward to");
              }
              return;
            }

            try {
              // Forward the message to the selected contacts
              // Get the current selected contact ID
              const currentSelectedContact =
                store.getState().chat.selectedContact;
              const currentContactId = currentSelectedContact?.id;

              console.log("[Chat] ===== FORWARD MESSAGE PROCESS STARTED =====");
              console.log(
                "[Chat] Message content:",
                message.content.substring(0, 50) + "..."
              );
              console.log("[Chat] Current user ID:", userId);
              console.log("[Chat] Current contact ID:", currentContactId);
              console.log(
                "[Chat] Recipients after filtering:",
                filteredContactIds
              );
              console.log("[Chat] Original message sender:", message.sender.id);
              console.log(
                "[Chat] Original message receiver:",
                message.receiver.id
              );

              dispatch(
                forwardMessageThunk({
                  content: message.content,
                  recipientIds: filteredContactIds,
                  currentUserId: userId,
                  currentContactId: currentContactId,
                })
              )
                .unwrap()
                .then((results) => {
                  console.log("Forward results:", results);
                  // Count successful forwards
                  const successCount = results ? results.length : 0;

                  // Show success message
                  if (successCount > 0) {
                    // If the user was in the original list but filtered out, mention it
                    if (includesSelf) {
                      antdMessage.success(
                        `Message forwarded to ${successCount} contact${
                          successCount > 1 ? "s" : ""
                        } (excluding yourself)`
                      );
                    } else {
                      antdMessage.success(
                        `Message forwarded to ${successCount} contact${
                          successCount > 1 ? "s" : ""
                        }`
                      );
                    }

                    // Get the current selected contact from the Redux store
                    const currentSelectedContact =
                      store.getState().chat.selectedContact;

                    // If the current selected contact is one of the recipients, refresh messages
                    if (
                      currentSelectedContact &&
                      filteredContactIds.includes(currentSelectedContact.id)
                    ) {
                      console.log(
                        "[Chat] Refreshing messages for current contact after forward"
                      );
                      dispatch(fetchMessages(currentSelectedContact.id));
                    }
                  } else {
                    antdMessage.warning("No messages were forwarded");
                  }
                })
                .catch((error) => {
                  console.error("Forward error:", error);
                  // Show error message with more details
                  let errorMessage = "Failed to forward message";
                  if (typeof error === "string") {
                    errorMessage += `: ${error}`;
                  } else if (
                    error &&
                    typeof error === "object" &&
                    "message" in error &&
                    typeof error.message === "string"
                  ) {
                    errorMessage += `: ${error.message}`;
                  }
                  antdMessage.error(errorMessage);
                });
            } catch (error) {
              console.error("Unexpected error during forward dispatch:", error);
              antdMessage.error(
                "An unexpected error occurred while forwarding the message"
              );
            }

            modal.destroy();
            setIsDropdownOpen(false);
          }}
        />
      ),
    });
  };

  const isUserMessage = message.sender.id === userId;
  const isGroupMessage = message.metadata?.isGroupMessage || false;

  return (
    <div
      className={isUserMessage ? "user-message" : "other-user-message"}
      style={{
        alignSelf: isUserMessage ? "flex-end" : "flex-start",
        backgroundColor: isUserMessage
          ? "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)"
          : "linear-gradient(135deg, #f5f5f5 0%, #e9e9e9 100%)",
        background: isUserMessage
          ? "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)"
          : "linear-gradient(135deg, #f5f5f5 0%, #e9e9e9 100%)",
        color: isUserMessage ? "white" : "rgba(0, 0, 0, 0.85)",
        padding: "10px 14px",
        borderRadius: isUserMessage
          ? "18px 18px 4px 18px"
          : "18px 18px 18px 4px",
        maxWidth: "80%",
        width: "fit-content",
        marginBottom: 12,
        marginLeft: isUserMessage ? "auto" : 0,
        marginRight: isUserMessage ? 0 : "auto",
        wordBreak: "break-word",
        boxShadow: isUserMessage
          ? "0 1px 2px rgba(0, 0, 0, 0.1)"
          : "0 1px 3px rgba(0, 0, 0, 0.2)",
        border: isUserMessage ? "none" : "1px solid rgba(0, 0, 0, 0.2)",
        position: "relative",
      }}
      onMouseEnter={() => {
        // Clear any existing timeout
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        // Only hide if dropdown is not open
        if (!isDropdownOpen) {
          // Set a timeout to delay hiding the menu
          hoverTimeoutRef.current = setTimeout(() => {
            setIsHovered(false);
          }, 1500); // 1500ms delay before hiding
        }
      }}
    >
      {/* Message options menu - show for all messages */}
      {isHovered && (
        <div
          style={{
            position: "absolute",
            bottom: "0", // Align with bottom border
            left: isUserMessage ? "-30px" : "auto", // Left for user's messages, right for others
            right: isUserMessage ? "auto" : "-30px", // Right for other's messages
            zIndex: 10,
            // Removed transform property to prevent Y-axis jumping
          }}
          onMouseEnter={() => {
            // Clear any existing timeout when mouse enters the menu
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
              hoverTimeoutRef.current = null;
            }
          }}
          onMouseLeave={() => {
            // Only hide if dropdown is not open
            if (!isDropdownOpen) {
              // Set a timeout when mouse leaves the menu
              hoverTimeoutRef.current = setTimeout(() => {
                setIsHovered(false);
              }, 1000); // 1000ms delay for menu
            }
          }}
        >
          <Dropdown
            menu={{
              items: [
                // Copy option for all messages
                {
                  key: "copy",
                  icon: <CopyOutlined />,
                  label: "Copy",
                  onClick: (e) => {
                    e.domEvent.stopPropagation();
                    handleCopy();
                    setIsDropdownOpen(false);
                  },
                },
                // Forward option for all messages
                {
                  key: "forward",
                  icon: <ForwardOutlined />,
                  label: "Forward",
                  onClick: (e) => {
                    e.domEvent.stopPropagation();
                    handleForward();
                    setIsDropdownOpen(false);
                  },
                },
                // Edit and Delete options only for user's own messages
                ...(isUserMessage
                  ? [
                      {
                        key: "edit",
                        icon: <EditOutlined />,
                        label: "Edit",
                        onClick: (e) => {
                          e.domEvent.stopPropagation();
                          handleEdit();
                          setIsDropdownOpen(false);
                        },
                      },
                      {
                        key: "delete",
                        icon: <DeleteOutlined />,
                        label: "Delete",
                        danger: true,
                        onClick: (e) => {
                          e.domEvent.stopPropagation();
                          handleDelete();
                          setIsDropdownOpen(false);
                        },
                      },
                    ]
                  : []),
              ],
            }}
            trigger={["click"]}
            destroyPopupOnHide={false}
            onOpenChange={(open) => setIsDropdownOpen(open)}
            placement={isUserMessage ? "bottomLeft" : "bottomRight"} // Updated for bottom position
          >
            <Button
              type="text"
              size="small"
              icon={<EllipsisOutlined style={{ fontSize: "16px" }} />}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderRadius: "50%",
                width: "28px", // Increased size
                height: "28px", // Increased size
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: 0,
                border: "1px solid #e8e8e8",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                transition: "all 0.2s ease",
                marginBottom: "0", // Ensure no bottom margin
                cursor: "pointer",
              }}
              className="message-action-button"
              onClick={(e) => {
                e.stopPropagation();
                // Force the dropdown to stay open longer
                setIsDropdownOpen(true);
              }}
            />
          </Dropdown>
        </div>
      )}

      {/* Message content */}
      {isEditing ? (
        <div style={{ width: "100%" }}>
          {/* Import TinyMCEEditor at the top of the file */}
          <TinyMCEEditor
            value={editedContent}
            onChange={(content) => setEditedContent(content)}
            height={250}
            placeholder="Edit your message..."
            outputFormat="html"
            onEnterPress={handleSaveEdit}
          />
          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}
          >
            <Button
              size="small"
              onClick={handleCancelEdit}
              style={{ fontSize: "12px" }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              size="small"
              onClick={handleSaveEdit}
              style={{ fontSize: "12px" }}
            >
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              flexGrow: 1,
              marginRight: message.content.length < 120 ? "16px" : "0",
            }}
          >
            {/* Show sender name for group messages that are not from the current user */}
            {isGroupMessage && !isUserMessage && (
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  marginBottom: "4px",
                  color: "#1890ff",
                }}
              >
                {message.sender.name}
              </div>
            )}
            {message.content.length > CHARACTER_LIMIT &&
            !isExpanded &&
            !message.content.includes("<table") &&
            !message.content.includes("<img") ? (
              <>
                <div
                  style={{ whiteSpace: "pre-wrap", width: "100%" }}
                  className="message-content"
                  dangerouslySetInnerHTML={{
                    __html: message.content.substring(0, CHARACTER_LIMIT),
                  }}
                ></div>
                <span style={{ opacity: 0.5 }}>...</span>
                <div style={{ marginTop: "8px" }}>
                  <Button
                    type="link"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(true);
                    }}
                    style={{
                      padding: "2px 8px",
                      height: "auto",
                      fontSize: "12px",
                      color: isUserMessage
                        ? "rgba(255, 255, 255, 0.85)"
                        : "#1890ff",
                      background: isUserMessage
                        ? "rgba(255, 255, 255, 0.15)"
                        : "rgba(24, 144, 255, 0.1)",
                      borderRadius: "4px",
                      marginLeft: "-8px",
                    }}
                  >
                    Read more
                  </Button>
                </div>
              </>
            ) : (
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  width: "100%", // Đảm bảo div chiếm toàn bộ chiều rộng
                }}
                className="message-content"
                dangerouslySetInnerHTML={{ __html: message.content }}
              ></div>
            )}
          </div>

          {/* Message footer - inline for short messages, new line for long ones */}
          <div
            style={{
              fontSize: 11,
              opacity: 0.8,
              fontWeight: 500,
              letterSpacing: "0.3px",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              marginTop: message.content.length < 120 && !isExpanded ? 0 : 4,
              flexShrink: 0,
              alignSelf: "flex-end", // Always align to bottom
              width:
                message.content.length < 120 && !isExpanded ? "auto" : "100%",
              paddingTop: "10px",
            }}
          >
            {message.persistent === false && (
              <span
                style={{
                  fontSize: "10px",
                  color: isUserMessage ? "#fff" : "#ff4d4f",
                  opacity: 0.8,
                  marginRight: "4px",
                }}
                title="This message is not saved to database"
              >
                ⚡
              </span>
            )}

            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}

              {isUserMessage && (
                <span
                  style={{
                    color: message.read ? "#52c41a" : "#fff",
                    opacity: message.read ? 1 : 0.7,
                    marginLeft: "2px",
                    display: "inline-flex",
                    alignItems: "flex-end", // Align to bottom
                    transform: "scale(1, 1.2)", // Make taller
                    letterSpacing: message.read ? "-3px" : "0", // Bring double checks closer
                    position: "relative",
                    bottom: "-1px", // Fine-tune vertical alignment
                  }}
                  title={message.read ? "Read" : "Sent"}
                >
                  {message.read ? (
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "normal",
                        fontFamily: "'Segoe UI', Arial, sans-serif", // Thinner font
                        transform: "scaleX(0.8)", // Make thinner horizontally
                        lineHeight: "1", // Prevent extra space below
                        marginBottom: "5px",
                      }}
                    >
                      ✓✓
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "normal",
                        fontFamily: "'Segoe UI', Arial, sans-serif", // Thinner font
                        transform: "scaleX(0.8)", // Make thinner horizontally
                        lineHeight: "1", // Prevent extra space below
                        marginBottom: "5px",
                      }}
                    >
                      ✓
                    </span>
                  )}
                </span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

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
  editMessageThunk,
  deleteMessageThunk,
  setSelectedContact,
  updateContactGroupThunk,
  updateContactDisplayNameThunk,
  removeContactThunk,
  fetchPendingRequests,
  respondToRequest,
  updateMessagesReadStatus, // Import the updateMessagesReadStatus action
  resetMessageDeletedFlag, // Import the resetMessageDeletedFlag action
  forwardMessageThunk,
  // Group-related thunks
  fetchGroupsThunk,
  createGroupThunk,
  sendGroupMessageThunk,
  fetchGroupMessagesThunk,
  updateGroupThunk,
} from "../store/chatSlice";

import {
  connectWebSocket,
  disconnectWebSocket,
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
        border-color: #40a9ff;
        color: #40a9ff;
      }
      .action-button.ant-btn-primary:hover {
        background-color: #40a9ff;
        opacity: 0.9;
      }
      .action-button.ant-btn:not(.ant-btn-primary):hover {
        opacity: 0.85;
      }
      .message-action-button:hover {
        background-color: #f0f0f0 !important;
        transform: scale(1.05);
      }
      .ant-dropdown-menu-item {
        padding: 8px 16px !important;
        min-width: 120px;
      }
      .contact-list-item:hover {
        background-color: rgba(24, 144, 255, 0.05) !important;
        border: 1px solid rgba(24, 144, 255, 0.1) !important;
        /* Ensure no transform is applied on hover */
        transform: none !important;
      }
      /* Styles for tables in messages */
      .message-content table {
        border-collapse: collapse;
        width: 100%;
        margin: 8px 0;
        table-layout: fixed;
      }
      .message-content table td,
      .message-content table th {
        border: 1px solid #ddd !important;
        padding: 8px;
        word-wrap: break-word;
      }
      .message-content table tr:nth-child(even) {
        background-color: rgba(0, 0, 0, 0.05);
      }
      .message-content table th {
        padding-top: 10px;
        padding-bottom: 10px;
        text-align: left;
        background-color: rgba(24, 144, 255, 0.1);
      }
      /* Styles for other elements in messages */
      .message-content img {
        max-width: 100%;
        height: auto;
      }
      .message-content pre {
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 3px;
        padding: 10px;
        white-space: pre-wrap;
        margin: 8px 0;
      }
      .message-content blockquote {
        border-left: 3px solid #ccc;
        margin-left: 0;
        padding-left: 10px;
        color: #666;
      }
      /* Styles for lists in messages */
      .message-content ul,
      .message-content ol {
        padding-left: 20px;
        margin: 8px 0;
        display: block;
      }
      .message-content ul {
        list-style-type: disc;
      }
      .message-content ol {
        list-style-type: decimal;
      }
      /* Nested lists styling */
      .message-content li {
        margin-bottom: 4px;
        display: list-item;
      }
      /* Nested lists styling */
      .message-content ul ul,
      .message-content ol ol,
      .message-content ul ol,
      .message-content ol ul {
        margin-top: 4px;
        margin-bottom: 0;
      }
      /* Second level list style */
      .message-content ul ul {
        list-style-type: circle;
      }
      .message-content ol ol {
        list-style-type: lower-alpha;
      }
      /* Third level list style */
      .message-content ul ul ul {
        list-style-type: square;
      }
      .message-content ol ol ol {
        list-style-type: lower-roman;
      }
      /* Ensure proper indentation for nested lists */
      .message-content li > ul,
      .message-content li > ol {
        margin-left: 10px;
        margin-bottom: 0;
      }
      /* Second level list style */
      .message-content ul ul {
        list-style-type: circle;
      }
      .message-content ol ol {
        list-style-type: lower-alpha;
      }
      /* Third level list style */
      .message-content ul ul ul {
        list-style-type: square;
      }
      .message-content ol ol ol {
        list-style-type: lower-roman;
      }
      /* Ensure proper indentation for nested lists */
      .message-content li > ul,
      .message-content li > ol {
        margin-left: 10px;
      }
      /* Prevent transform on Card components and their children */
      .ant-card, 
      .ant-card-body, 
      .ant-card-head, 
      .ant-list, 
      .ant-list-item,
      .ant-list-item-meta,
      .ant-list-item-meta-content,
      .ant-list-item-meta-title,
      .ant-list-item-meta-description {
        transform: none !important;
        transition: box-shadow 0.3s ease, background-color 0.3s ease, border 0.3s ease !important;
      }
      
      .ant-card:hover,
      .ant-card-body:hover, 
      .ant-card-head:hover, 
      .ant-list:hover, 
      .ant-list-item:hover,
      .ant-list-item-meta:hover,
      .ant-list-item-meta-content:hover,
      .ant-list-item-meta-title:hover,
      .ant-list-item-meta-description:hover {
        transform: none !important;
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
  const userId = userInfo?.id || "guest";
  const {
    messages,
    contacts,
    pendingRequests,
    selectedContact,
    loading: loadingContacts,
    groups,
  } = useSelector((state: RootState) => state.chat);

  const [messageText, setMessageText] = useState("");
  const [isAddContactModalVisible, setIsAddContactModalVisible] =
    useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newContactEmail, setNewContactEmail] = useState("");
  const [persistMessages, setPersistMessages] = useState(true);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>(
    []
  );
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
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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

    // Fetch groups
    dispatch(fetchGroupsThunk())
      .unwrap()
      .then(() => {
        console.log("[Chat] Groups fetched successfully");
      })
      .catch((error) => {
        console.error("[Chat] Error fetching groups:", error);
        notification.error({
          message: "Error",
          description: "Failed to fetch groups.",
        });
      });

    // Connect to WebSocket if userId is available
    if (userId && userId !== "guest") {
      try {
        const connected = connectWebSocket(userId, (isConnected) => {
          // Callback to update connection status
          setIsWebSocketConnected(isConnected);
          console.log(
            "[Chat] WebSocket connection status updated:",
            isConnected
          );

          // If connected, try to send status update immediately
          if (isConnected && userInfo?.id) {
            console.log(
              "[Chat] WebSocket connected, sending status update:",
              userStatus
            );
            const sent = sendStatusUpdateViaWebSocket(userStatus);
            if (sent) {
              console.log(
                "[Chat] Status update sent successfully after connection"
              );
            }
          }
        });

        if (!connected) {
          console.warn("WebSocket connection failed, falling back to HTTP");
          setIsWebSocketConnected(false);
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
        setIsWebSocketConnected(false);
      }
    }

    // Cleanup WebSocket connection when component unmounts
    return () => {
      disconnectWebSocket();
    };
  }, [dispatch, userStatus, userInfo?.id, userId]);

  useEffect(() => {
    if (selectedContact) {
      console.log(
        "[Chat] Contact selected:",
        selectedContact.name,
        "isGroup:",
        selectedContact.isGroup
      );

      // Fetch messages based on whether this is a group or individual contact
      if (selectedContact.isGroup) {
        // Handle group messages
        dispatch(fetchGroupMessagesThunk(selectedContact.id))
          .unwrap()
          .then(() => {
            // Group messages don't need to be marked as read in the same way
            console.log("[Chat] Group messages loaded successfully");
          })
          .catch((error) => {
            console.error("[Chat] Error fetching group messages:", error);
          });
      } else {
        // Handle individual messages
        dispatch(fetchMessages(selectedContact.id))
          .unwrap()
          .then(() => {
            // Get current user ID for proper logging
            const currentUserId = userInfo?.id;

            // Only mark messages as read if the document has focus (user is actively viewing)
            // and it's not a group chat (for individual chats only)
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
                "[Chat] Document does not have focus, not marking messages as read automatically"
              );
            }
          })
          .catch((error) => {
            console.error("[Chat] Error fetching messages:", error);
          });
      }
    }
  }, [selectedContact, dispatch, userInfo?.id]);

  // Add a separate effect to handle message deletion
  const messageDeleted = useSelector(
    (state: RootState) => state.chat.messageDeleted
  );

  useEffect(() => {
    // If a message was deleted, scroll to bottom and reset the flag
    if (messageDeleted) {
      console.log("[Chat] Message was deleted, scrolling to bottom");
      scrollToBottom();
      dispatch(resetMessageDeletedFlag());
    }
  }, [messageDeleted, dispatch]);

  // Add an effect to handle window resize events
  useEffect(() => {
    const handleResize = () => {
      console.log("[Chat] Window resize detected, scrolling to bottom");
      // Use a short delay to allow the layout to stabilize
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Add a specific effect for initial load and page refresh
  useEffect(() => {
    if (messages.length > 0 && selectedContact) {
      console.log(
        "[Chat] Initial load or refresh detected, scrolling to bottom with delay"
      );

      // Use a longer delay for initial load to ensure everything is rendered
      setTimeout(() => {
        // Force scroll to absolute bottom using the ref
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight;
          console.log(
            "[Chat] Forced initial scroll to absolute bottom using ref"
          );
        }
        // Fallback to querySelector if ref is not available
        else {
          const messagesContainer = document.querySelector(
            'div[style*="overflowY: auto"]'
          );
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            console.log(
              "[Chat] Forced initial scroll to absolute bottom using querySelector"
            );
          } else {
            console.log(
              "[Chat] Could not find messages container for initial scroll"
            );

            // As a last resort, try scrolling the messagesEndRef into view
            messagesEndRef.current?.scrollIntoView({ block: "end" });
          }
        }

        // Double-check after a short delay to ensure we're really at the bottom
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop =
              messagesContainerRef.current.scrollHeight;
          }
        }, 200);
      }, 500); // Longer delay for initial load
    }
  }, [selectedContact, messages.length, messagesEndRef]); // Fixed dependency array for initial load effect

  // Add an effect to handle window resize events
  useEffect(() => {
    const handleResize = () => {
      console.log("[Chat] Window resize detected, scrolling to bottom");
      // Use a short delay to allow the layout to stabilize
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Add a specific effect for initial load and page refresh
  useEffect(() => {
    if (messages.length > 0 && selectedContact) {
      console.log(
        "[Chat] Initial load or refresh detected, scrolling to bottom with delay"
      );

      // Use a longer delay for initial load to ensure everything is rendered
      setTimeout(() => {
        // Force scroll to absolute bottom using the ref
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight;
          console.log(
            "[Chat] Forced initial scroll to absolute bottom using ref"
          );
        }
        // Fallback to querySelector if ref is not available
        else {
          const messagesContainer = document.querySelector(
            'div[style*="overflowY: auto"]'
          );
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            console.log(
              "[Chat] Forced initial scroll to absolute bottom using querySelector"
            );
          } else {
            console.log(
              "[Chat] Could not find messages container for initial scroll"
            );

            // As a last resort, try scrolling the messagesEndRef into view
            messagesEndRef.current?.scrollIntoView({ block: "end" });
          }
        }

        // Double-check after a short delay to ensure we're really at the bottom
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop =
              messagesContainerRef.current.scrollHeight;
          }
        }, 200);
      }, 500); // Longer delay for initial load
    }
  }, [selectedContact, messages.length, messagesEndRef]); // Fixed dependency array for second load effect

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
      }, 1500); // 1.5 second debounce
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

  // State to track WebSocket connection status
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);

  // Add an effect to send the initial user status when the component mounts
  useEffect(() => {
    // Only send status update if user is logged in and WebSocket is connected
    if (userInfo?.id && isWebSocketConnected) {
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
  }, [userInfo?.id, userStatus, isWebSocketConnected]);

  // These functions are now handled by Redux actions

  // Wrapper function for sendMessage to use with TinyMCE
  const handleSendMessage = async (content?: string) => {
    console.log("[Chat] TinyMCE handleSendMessage called with content");

    // CRITICAL: Always get the latest selectedContact from the Redux store
    // This ensures we're using the most up-to-date contact information
    const storeState = store.getState();
    const storeSelectedContact = storeState.chat.selectedContact;
    const currentContactId = storeSelectedContact?.id;

    console.log("[Chat] Redux store selectedContact:", storeSelectedContact);
    console.log("[Chat] Component selectedContact:", selectedContact);
    console.log("[Chat] Current contact ID from Redux:", currentContactId);

    // Use the Redux store's selectedContact if available, otherwise fall back to the component state
    const effectiveContact = storeSelectedContact || selectedContact;

    // CRITICAL: Kiểm tra xem đây có phải là tin nhắn nhóm hay không
    // Đầu tiên, lấy danh sách nhóm từ store
    const groups = storeState.chat.groups || [];

    // CRITICAL: Kiểm tra xem ID của effectiveContact có trùng với ID của bất kỳ nhóm nào không
    // Đây là cách chính xác nhất để xác định xem đây có phải là tin nhắn nhóm hay không
    let isGroupMessage =
      effectiveContact &&
      groups.some((group) => group.id === effectiveContact.id);

    // Định nghĩa biến textToSend ở đây để tránh lỗi
    const textToSend = content !== undefined ? content : messageText;

    // Check if we have a selected contact
    if (!effectiveContact) {
      console.log("[Chat] No contact selected, cannot send message");
      return;
    }

    // Log thông tin để debug
    console.log(
      "[Chat] All groups in store:",
      groups.map((g) => ({ id: g.id, name: g.name }))
    );
    console.log(
      "[Chat] CRITICAL DEBUG - Full effectiveContact object:",
      JSON.stringify(effectiveContact, null, 2)
    );
    console.log(
      "[Chat] CRITICAL DEBUG - Full groups array:",
      JSON.stringify(groups, null, 2)
    );
    console.log("[Chat] CRITICAL DEBUG - isGroupMessage:", isGroupMessage);

    console.log(
      "[Chat] TinyMCE determined message type:",
      isGroupMessage ? "GROUP" : "DIRECT"
    );
    console.log("[Chat] Selected contact details:", {
      id: effectiveContact.id,
      name: effectiveContact.name,
      isGroup: effectiveContact.isGroup,
      isGroupType: typeof effectiveContact.isGroup,
      isGroupMessage: isGroupMessage,
    });

    // CRITICAL: Force check one more time by looking at the groups list directly
    const forceGroupCheck = groups.some(
      (group) => group.id === effectiveContact.id
    );

    // If forceGroupCheck is true, we KNOW this is a group message regardless of other checks
    if (forceGroupCheck) {
      console.log(
        "[Chat] CRITICAL OVERRIDE: Force detected as GROUP message based on direct group ID match"
      );
      isGroupMessage = true;
    }

    // CRITICAL: Nếu đây là tin nhắn nhóm, gửi trực tiếp đến API endpoint nhóm
    if (isGroupMessage) {
      console.log("[Chat] This is a GROUP message, sending to group endpoint");

      // Validate content - không cần định nghĩa lại biến textToSend vì đã được định nghĩa ở trên
      if (typeof textToSend !== "string" || !textToSend.trim()) {
        console.log("[Chat] Message text is empty or invalid, not sending");
        return;
      }

      try {
        console.log(
          "[Chat] CRITICAL: This is a GROUP message, using group endpoint"
        );
        console.log("[Chat] Group ID:", effectiveContact.id);
        console.log("[Chat] Group name:", effectiveContact.name);

        // NOTE: We don't need to create a temporary message here
        // The sendGroupMessageThunk will handle creating a temporary message

        // IMPORTANT: Always use the group-specific endpoint for group messages
        console.log(
          "[Chat] Using sendGroupMessage API endpoint for group message"
        );

        // CRITICAL: Double check that we're using the group endpoint
        console.log(
          "[Chat] CRITICAL: About to send group message to group ID:",
          effectiveContact.id
        );

        // Use ONLY the Redux thunk to send the message - this will handle all API calls
        // and ensure we don't have duplicate calls
        try {
          console.log("[Chat] Using sendGroupMessageThunk for group message");
          const result = await dispatch(
            sendGroupMessageThunk({
              content: textToSend,
              groupId: effectiveContact.id,
            })
          ).unwrap();

          console.log("[Chat] Group message sent successfully:", result);
        } catch (error) {
          console.error("[Chat] Error sending group message:", error);

          // Show error notification
          notification.error({
            message: "Group Message Not Sent",
            description:
              "There was a problem sending your message to the group. Please try again.",
            duration: 4,
          });
        }

        // Clear the input field
        setMessageText("");
      } catch (error) {
        console.error("[Chat] Error sending group message via TinyMCE:", error);
        notification.error({
          message: "Group Message Not Sent",
          description:
            "There was a problem sending your message to the group. Please try again.",
          duration: 4,
        });
      }
    } else {
      // We don't need special handling for Ctrl+Enter anymore
      // Both Send button and Ctrl+Enter use the same code path

      // Regular check for non-Ctrl+Enter messages
      // CRITICAL: Double-check one more time if this is actually a group message
      // This is our last chance to catch a group message before sending it as a direct message
      const groups = store.getState().chat.groups || [];
      const isActuallyGroup = groups.some(
        (group) => String(group.id) === String(effectiveContact.id)
      );

      if (isActuallyGroup) {
        console.log(
          "[Chat] CRITICAL OVERRIDE: Last-minute detection that this is actually a GROUP message"
        );
        console.log("[Chat] Redirecting to group message handler");

        // Force isGroupMessage to true and recall this function
        isGroupMessage = true;
        return handleSendMessage(content);
      }

      // For direct messages, handle it directly here instead of calling sendMessage
      console.log("[Chat] TinyMCE sending DIRECT message");

      // Validate content - không cần định nghĩa lại biến textToSend vì đã được định nghĩa ở trên
      if (typeof textToSend !== "string" || !textToSend.trim()) {
        console.log("[Chat] Message text is empty or invalid, not sending");
        return;
      }

      try {
        // We'll let the Redux thunk handle adding the message to the store
        // This prevents duplicate messages from appearing in the chat window
        console.log(
          "[Chat] Skipping temporary message creation to avoid duplicates"
        );

        // Use ONLY the Redux thunk to send the message - this will handle all API calls
        // and ensure we don't have duplicate calls
        try {
          console.log("[Chat] Using sendMessageThunk for direct message");
          const result = await dispatch(
            sendMessageThunk({
              content: textToSend,
              receiverId: effectiveContact.id,
              persistent: persistMessages,
              isGroup: false,
            })
          ).unwrap();

          console.log("[Chat] Direct message sent successfully:", result);
        } catch (error) {
          console.error("[Chat] Error sending direct message:", error);

          // Show error notification
          notification.error({
            message: "Message Not Sent",
            description:
              "There was a problem sending your message. Please try again.",
            duration: 4,
          });
        }

        // Clear the input field
        setMessageText("");
      } catch (error) {
        console.error(
          "[Chat] Error sending direct message via TinyMCE:",
          error
        );
        notification.error({
          message: "Message Not Sent",
          description:
            "There was a problem sending your message. Please try again.",
          duration: 4,
        });
      }
    }
  };

  const scrollToBottom = () => {
    // First try with the ref approach
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });

    // As a backup, also use direct DOM manipulation with the ref to ensure we scroll all the way
    setTimeout(() => {
      // First try with our direct ref
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop =
          messagesContainerRef.current.scrollHeight;
        console.log("[Chat] Forced scroll to bottom using container ref");
      }
      // If that fails, try with querySelector as a fallback
      else {
        const messagesContainer = document.querySelector(
          'div[style*="overflowY: auto"]'
        );
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
          console.log("[Chat] Forced scroll to bottom using querySelector");
        } else {
          console.log(
            "[Chat] Could not find messages container for direct scroll"
          );
        }
      }
    }, 100); // Small delay to ensure DOM has updated
  };

  // Effect to update read status when selected contact changes
  useEffect(() => {
    if (selectedContact && userInfo) {
      console.log("[Chat] Updating read status for selected contact");

      // Update read status in Redux
      dispatch(
        updateMessagesReadStatus({
          contactId: selectedContact.id,
          currentUserId: userInfo.id,
        })
      );

      // Mark messages as read via WebSocket
      import("../services/websocketService").then(
        ({ markMessagesAsReadViaWebSocket }) => {
          markMessagesAsReadViaWebSocket(selectedContact.id);
        }
      );
    }
  }, [selectedContact, userInfo, dispatch]);

  // We no longer need handleKeyPress as we're using TinyMCEEditor's onEnterPress

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
      const resultAction = await dispatch(addContact(newContactEmail));

      // Check if the action was rejected (error occurred)
      if (addContact.rejected.match(resultAction)) {
        // Get the error payload - ensure it's a string
        const errorPayload = resultAction.payload;
        const errorMessage =
          typeof errorPayload === "string"
            ? errorPayload
            : "Failed to add contact";

        // Check if it's a 404 error (user not found)
        if (
          (typeof errorMessage === "string" &&
            (errorMessage.includes("not found") ||
              errorMessage.includes("doesn't exist") ||
              errorMessage.includes("doesn't exist"))) ||
          resultAction.error.message?.includes("404")
        ) {
          notification.error({
            message: "User Not Found",
            description:
              "This email doesn't exist in the system. Please check and try again.",
            placement: "topRight",
            duration: 4,
          });
        } else {
          notification.error({
            message: "Error",
            description:
              errorMessage || "Failed to add contact. Please try again.",
            placement: "topRight",
            duration: 4,
          });
        }
        return;
      }

      // Close the modal and reset the form
      setIsAddContactModalVisible(false);
      setNewContactEmail("");
      form.resetFields();

      notification.success({
        message: "Success",
        description: "Contact request sent successfully! Waiting for approval.",
        placement: "topRight",
        duration: 4,
      });
    } catch (error) {
      console.error("Error adding contact:", error);
      notification.error({
        message: "Error",
        description: "Failed to add contact. Please try again.",
        placement: "topRight",
        duration: 4,
      });
    }
  };

  // Function to handle creating a new group
  const handleCreateGroup = async () => {
    try {
      if (!newGroupName.trim()) {
        notification.error({
          message: "Error",
          description: "Please enter a valid group name.",
          placement: "topRight",
          duration: 4,
        });
        return;
      }

      if (selectedGroupMembers.length === 0) {
        notification.error({
          message: "Error",
          description: "Please select at least one member for the group.",
          placement: "topRight",
          duration: 4,
        });
        return;
      }

      // Dispatch the createGroup action
      const resultAction = await dispatch(
        createGroupThunk({
          name: newGroupName.trim(),
          memberIds: selectedGroupMembers,
        })
      );

      // Check if the action was rejected (error occurred)
      if (createGroupThunk.rejected.match(resultAction)) {
        const errorPayload = resultAction.payload;
        const errorMessage =
          typeof errorPayload === "string"
            ? errorPayload
            : "Failed to create group";

        notification.error({
          message: "Error",
          description:
            errorMessage || "Failed to create group. Please try again.",
          placement: "topRight",
          duration: 4,
        });
        return;
      }

      // Close the modal and reset the form
      setShowCreateGroupModal(false);
      setNewGroupName("");
      setSelectedGroupMembers([]);

      // Fetch groups to update the list
      dispatch(fetchGroupsThunk());

      notification.success({
        message: "Success",
        description: "Group created successfully!",
        placement: "topRight",
        duration: 4,
      });
    } catch (error) {
      console.error("Error creating group:", error);
      notification.error({
        message: "Error",
        description: "Failed to create group. Please try again.",
        placement: "topRight",
        duration: 4,
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
        /* Ensure no transform is applied */
        transform: "none !important",
      }}
    >
      {/* Removed top header with Chat title and notification */}

      <div
        style={{
          display: "flex",
          height: "100%",
          gap: 16,
          /* Ensure no transform is applied */
          transform: "none !important",
        }}
      >
        {/* Contacts List - 20% width */}
        <Card
          style={{
            width: "20%",
            height: "100%",
            overflow: "auto",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
            border: "none",
            /* Ensure no transform is applied on hover */
            transform: "none !important",
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
                onClick={() => setShowCreateGroupModal(true)}
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
                    {
                      type: "divider",
                    },
                    {
                      key: "group",
                      label: (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <TeamOutlined style={{ color: "#1890ff" }} />
                          <span
                            style={{
                              color: "#1890ff",
                              fontWeight:
                                activeFilter === "group" ? "bold" : "normal",
                            }}
                          >
                            Groups
                          </span>
                        </div>
                      ),
                      onClick: () => setActiveFilter("group"),
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
                        color: activeFilter !== "all" ? "white" : undefined,
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
              overflowX: "hidden",
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
                style={{
                  overflowX: "hidden",
                }}
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
                dataSource={[
                  // Include regular contacts
                  ...contacts.filter((contact) => {
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
                        : activeFilter === "group"
                        ? false // Hide regular contacts when group filter is active
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
                  }),
                  // Include groups as contacts
                  ...groups
                    .map((group) => ({
                      id: group.id,
                      name: group.name,
                      email: `${group.members.length} members`,
                      status: "online", // Default status for groups
                      unreadCount: group.unreadCount || 0,
                      lastMessage: group.lastMessage,
                      isGroup: true,
                      members: group.members.map((member) => member.id),
                      avatar: group.avatar,
                    }))
                    .filter((groupContact) => {
                      // Apply search filter for groups
                      const matchesSearch =
                        searchText === "" ||
                        groupContact.name
                          .toLowerCase()
                          .includes(searchText.toLowerCase());

                      // Apply group/category filter for groups
                      const matchesFilter =
                        activeFilter === "all"
                          ? true
                          : activeFilter === "unread"
                          ? groupContact.unreadCount > 0
                          : activeFilter === "group"
                          ? true // Always show in group filter
                          : activeFilter === "friend" ||
                            activeFilter === "family" ||
                            activeFilter === "college" ||
                            activeFilter === "work" ||
                            activeFilter === "other"
                          ? false // Don't show groups when filtering by contact categories
                          : true;

                      return matchesSearch && matchesFilter;
                    }),
                ]}
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
                        transition:
                          "background-color 0.2s ease, border 0.2s ease",
                        /* Ensure no transform is applied */
                        transform: "none",
                        border:
                          selectedContact?.id === contact.id
                            ? "1px solid rgba(24, 144, 255, 0.2)"
                            : "1px solid transparent",
                      }}
                      className="contact-list-item"
                      actions={[]}
                    >
                      <List.Item.Meta
                        style={{
                          overflow: "hidden",
                        }}
                        avatar={
                          contact.isGroup ? (
                            // Group avatar with multiple user avatars
                            <GroupAvatar contact={contact} />
                          ) : (
                            // Regular user avatar
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
                          )
                        }
                        title={
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              overflow: "hidden",
                              width: "100%",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                overflow: "hidden",
                                minWidth: 0 /* This is important for flex child to respect parent width */,
                              }}
                            >
                              <span
                                style={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  maxWidth: "120px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                                title={contact.name}
                              >
                                {/* Group icon before name removed */}
                                {contact.name}
                              </span>
                              {/* Display fixed Group tag for groups or show dropdown for regular contacts */}
                              {contact.isGroup ? (
                                <Tag
                                  color="blue"
                                  icon={<TeamOutlined />}
                                  style={{
                                    fontSize: "10px",
                                    lineHeight: "14px",
                                    padding: "0 4px",
                                  }}
                                >
                                  Group
                                </Tag>
                              ) : (
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
                                              isGroup: contact.isGroup,
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
                                              isGroup: contact.isGroup,
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
                                              isGroup: contact.isGroup,
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
                                              isGroup: contact.isGroup,
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
                                              isGroup: contact.isGroup,
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
                                              isGroup: contact.isGroup,
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
                                  {contact.group ? (
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
                                        cursor: "pointer",
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {contact.group}
                                    </Tag>
                                  ) : (
                                    <Tag
                                      color="default"
                                      icon={<TagOutlined />}
                                      style={{
                                        fontSize: "10px",
                                        lineHeight: "14px",
                                        padding: "0 4px",
                                        cursor: "pointer",
                                        backgroundColor: "#f0f0f0",
                                        borderStyle: "dashed",
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      Add Tag
                                    </Tag>
                                  )}
                                </Dropdown>
                              )}
                            </div>
                            {contact.unreadCount > 0 && (
                              <Tag
                                color={contact.isGroup ? "#1890ff" : "#52c41a"}
                                style={{
                                  borderRadius: "12px",
                                  fontWeight: "bold",
                                  minWidth: "22px",
                                  textAlign: "center",
                                }}
                              >
                                {contact.unreadCount}
                              </Tag>
                            )}
                          </div>
                        }
                        description={
                          <Text
                            type="secondary"
                            style={{
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            {contact.isGroup ? (
                              <>
                                <TeamOutlined style={{ fontSize: "10px" }} />
                                {/* Extract the correct member count from the name or members array */}
                                {(() => {
                                  // Try to extract member count from the name (e.g., "4 members")
                                  const nameMatch =
                                    contact.name.match(/^(\d+)\s+members?$/);
                                  if (nameMatch) {
                                    return `${nameMatch[1]} members`;
                                  }

                                  // Fallback to members array if available
                                  if (Array.isArray(contact.members)) {
                                    return `${contact.members.length} members`;
                                  }

                                  // Use email as last resort
                                  return contact.email;
                                })()}
                              </>
                            ) : (
                              contact.email
                            )}
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
            /* Ensure no transform is applied on hover */
            transform: "none !important",
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
                  {selectedContact.isGroup ? (
                    <GroupAvatar contact={selectedContact} size={40} />
                  ) : (
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
                  )}
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
                      {selectedContact.isGroup ? (
                        <Tag
                          color="blue"
                          icon={<TeamOutlined />}
                          style={{
                            fontSize: "10px",
                            lineHeight: "14px",
                            padding: "0 4px",
                          }}
                        >
                          Group
                        </Tag>
                      ) : (
                        selectedContact.group && (
                          <Tag
                            color={
                              selectedContact.group === "Friend"
                                ? "red"
                                : selectedContact.group === "Family"
                                ? "green"
                                : selectedContact.group === "College"
                                ? "blue"
                                : selectedContact.group === "Work"
                                ? "purple"
                                : selectedContact.group === "Other"
                                ? "orange"
                                : "default"
                            }
                            icon={
                              selectedContact.group === "Friend" ? (
                                <UserOutlined />
                              ) : selectedContact.group === "Family" ? (
                                <TagOutlined />
                              ) : selectedContact.group === "College" ? (
                                <BookOutlined />
                              ) : selectedContact.group === "Work" ? (
                                <LaptopOutlined />
                              ) : selectedContact.group === "Other" ? (
                                <StarOutlined />
                              ) : null
                            }
                            style={{
                              fontSize: "10px",
                              lineHeight: "14px",
                              padding: "0 4px",
                            }}
                          >
                            {selectedContact.group}
                          </Tag>
                        )
                      )}
                      {/* Edit dropdown menu for both regular contacts and groups */}
                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: "edit",
                              icon: <EditOutlined />,
                              label: `Edit ${
                                selectedContact.isGroup ? "Group" : "Contact"
                              } Name`,
                              onClick: () => {
                                // Show a modal to edit the display name
                                Modal.confirm({
                                  title: `Edit ${
                                    selectedContact.isGroup
                                      ? "Group"
                                      : "Contact"
                                  } Name`,
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
                                      if (selectedContact.isGroup) {
                                        // Use updateGroupThunk for groups
                                        dispatch(
                                          updateGroupThunk({
                                            groupId: selectedContact.id,
                                            updates: {
                                              name: newName.trim(),
                                            },
                                          })
                                        )
                                          .unwrap()
                                          .then((updatedGroup) => {
                                            // Update the UI immediately
                                            console.log(
                                              "Group updated successfully:",
                                              updatedGroup
                                            );

                                            notification.success({
                                              message: "Success",
                                              description:
                                                "Group name updated successfully!",
                                            });
                                          })
                                          .catch((error) => {
                                            console.error(
                                              "Error updating group name:",
                                              error
                                            );
                                            notification.error({
                                              message: "Error",
                                              description:
                                                "Failed to update group name. Please try again.",
                                            });
                                          });
                                      } else {
                                        // Use updateContactDisplayNameThunk for regular contacts
                                        dispatch(
                                          updateContactDisplayNameThunk({
                                            contactId: selectedContact.id,
                                            displayName: newName.trim(),
                                          })
                                        )
                                          .unwrap()
                                          .then((updatedContact) => {
                                            // Update the UI immediately
                                            console.log(
                                              "Contact updated successfully:",
                                              updatedContact
                                            );

                                            notification.success({
                                              message: "Success",
                                              description:
                                                "Contact name updated successfully!",
                                            });
                                          })
                                          .catch((error) => {
                                            console.error(
                                              "Error updating contact name:",
                                              error
                                            );
                                            notification.error({
                                              message: "Error",
                                              description:
                                                "Failed to update contact name. Please try again.",
                                            });
                                          });
                                      }
                                    }
                                  },
                                });
                              },
                            },
                            // Only show remove option for regular contacts, not groups
                            ...(selectedContact.isGroup
                              ? []
                              : [
                                  {
                                    key: "remove",
                                    icon: <DeleteOutlined />,
                                    label: "Remove Contact",
                                    danger: true,
                                    onClick: () => {
                                      // Show confirmation modal before removing contact
                                      Modal.confirm({
                                        title: "Remove Contact",
                                        content: `Are you sure you want to remove ${selectedContact.name} from your contacts?`,
                                        okText: "Remove",
                                        okType: "danger",
                                        cancelText: "Cancel",
                                        onOk: async () => {
                                          try {
                                            console.log(
                                              `[ChatPage] Removing contact: ${selectedContact.id} (${selectedContact.name})`
                                            );

                                            // Store the contact info before removal for the notification
                                            const contactName =
                                              selectedContact.name;
                                            const contactId =
                                              selectedContact.id;

                                            // Show loading message
                                            antdMessage.loading({
                                              content: `Removing ${contactName} from contacts...`,
                                              key: "contact-removal",
                                              duration: 1,
                                            });

                                            // Call the removeContactThunk to permanently remove the contact from backend
                                            console.log(
                                              `[ChatPage] Dispatching removeContactThunk with contactId: ${contactId}`
                                            );

                                            const resultPromise = dispatch(
                                              removeContactThunk(contactId)
                                            );
                                            console.log(
                                              `[ChatPage] removeContactThunk dispatched, waiting for result`
                                            );

                                            resultPromise
                                              .unwrap()
                                              .then((result) => {
                                                console.log(
                                                  `[ChatPage] removeContactThunk succeeded with result:`,
                                                  result
                                                );

                                                // Show success message
                                                antdMessage.success({
                                                  content: `${contactName} has been permanently removed from your contacts list.`,
                                                  key: "contact-removal",
                                                  duration: 3,
                                                });
                                              })
                                              .catch((error) => {
                                                console.error(
                                                  "[ChatPage] removeContactThunk failed with error:",
                                                  error
                                                );

                                                // If API call fails, still remove locally for better UX
                                                dispatch({
                                                  type: "chat/removeContactLocally",
                                                  payload: contactId,
                                                });

                                                // Show warning about temporary removal
                                                notification.warning({
                                                  message:
                                                    "Contact Removal Issue",
                                                  description:
                                                    "The contact has been removed from your view, but there was an issue with the permanent removal. " +
                                                    "The contact may reappear after page refresh.",
                                                  duration: 0, // Don't auto-close
                                                });
                                              });
                                          } catch (error) {
                                            console.error(
                                              "[ChatPage] Error removing contact:",
                                              error
                                            );

                                            // Show error message
                                            antdMessage.error({
                                              content:
                                                "Failed to remove contact. Please try again.",
                                              key: "contact-removal",
                                              duration: 3,
                                            });
                                          }
                                        },
                                      });
                                    },
                                  },
                                ]),
                          ],
                        }}
                        trigger={["click"]}
                        placement="bottomRight"
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          style={{ color: "#8c8c8c" }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Dropdown>
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
                      {selectedContact.isGroup ? (
                        <TeamOutlined style={{ fontSize: "12px" }} />
                      ) : (
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
                      )}
                      {selectedContact.isGroup
                        ? `${selectedContact.members?.length || 0} members`
                        : selectedContact.status.charAt(0).toUpperCase() +
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
                ref={messagesContainerRef}
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
                    // Group messages by date and add date dividers
                    (() => {
                      // Function to format date for grouping
                      const formatMessageDate = (timestamp: string) => {
                        const messageDate = new Date(timestamp);
                        const today = new Date();
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);

                        // Reset hours to compare just the date
                        const messageDateOnly = new Date(
                          messageDate.getFullYear(),
                          messageDate.getMonth(),
                          messageDate.getDate()
                        );
                        const todayOnly = new Date(
                          today.getFullYear(),
                          today.getMonth(),
                          today.getDate()
                        );
                        const yesterdayOnly = new Date(
                          yesterday.getFullYear(),
                          yesterday.getMonth(),
                          yesterday.getDate()
                        );

                        if (messageDateOnly.getTime() === todayOnly.getTime()) {
                          return "Today";
                        } else if (
                          messageDateOnly.getTime() === yesterdayOnly.getTime()
                        ) {
                          return "Yesterday";
                        } else {
                          return messageDate.toLocaleDateString(undefined, {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          });
                        }
                      };

                      console.log("[Chat] ===== RENDERING MESSAGES =====");
                      console.log(
                        "[Chat] Current contact ID:",
                        selectedContact?.id
                      );
                      console.log(
                        "[Chat] Total messages before filtering:",
                        messages.length
                      );

                      // Filter out any messages that are being forwarded to the current contact
                      // This is a final safety check to prevent forwarded messages from appearing in the current chat
                      const filteredMessages = messages.filter((message) => {
                        // Check if this is a message that was forwarded from the current contact
                        const isForwardedFromCurrentContact =
                          message.metadata?.isForwarded === true &&
                          message.metadata?.originalContactId ===
                            selectedContact?.id;

                        if (isForwardedFromCurrentContact) {
                          console.log(
                            "[Chat] Filtering out forwarded message with metadata:",
                            message.id,
                            "sender:",
                            message.sender.id,
                            "receiver:",
                            message.receiver.id,
                            "originalContactId:",
                            message.metadata?.originalContactId
                          );
                          return false;
                        }

                        // Also check based on sender/receiver IDs as a fallback
                        const isForwardedBasedOnIds =
                          message.metadata?.isForwarded === true &&
                          (message.sender.id === userInfo?.id ||
                            message.receiver.id === userInfo?.id) &&
                          (message.sender.id === selectedContact?.id ||
                            message.receiver.id === selectedContact?.id);

                        if (isForwardedBasedOnIds) {
                          console.log(
                            "[Chat] Filtering out forwarded message based on IDs:",
                            message.id,
                            "sender:",
                            message.sender.id,
                            "receiver:",
                            message.receiver.id
                          );
                          return false;
                        }

                        return true;
                      });

                      console.log(
                        "[Chat] Messages after filtering:",
                        filteredMessages.length
                      );

                      // Group messages by date
                      const messagesByDate: { [key: string]: ChatMessage[] } =
                        {};
                      filteredMessages.forEach((message) => {
                        const dateKey = formatMessageDate(message.timestamp);
                        if (!messagesByDate[dateKey]) {
                          messagesByDate[dateKey] = [];
                        }
                        messagesByDate[dateKey].push(message);
                      });

                      // Render messages with date dividers
                      const result: JSX.Element[] = [];
                      Object.keys(messagesByDate).forEach((dateKey) => {
                        // Add date divider
                        result.push(
                          <div
                            key={`date-${dateKey}`}
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              margin: "16px 0",
                              position: "relative",
                              width: "100%",
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                height: "1px",
                                backgroundColor: "rgba(0, 0, 0, 0.1)",
                                top: "50%",
                              }}
                            />
                            <div
                              style={{
                                backgroundColor: "#f5f5f5",
                                padding: "4px 12px",
                                borderRadius: "16px",
                                fontSize: "12px",
                                color: "rgba(0, 0, 0, 0.65)",
                                fontWeight: 500,
                                zIndex: 1,
                                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                              }}
                            >
                              {dateKey}
                            </div>
                          </div>
                        );

                        // Add messages for this date
                        messagesByDate[dateKey].forEach((message) => {
                          result.push(
                            <MessageItem
                              key={`${message.id}-${
                                message.read ? "read" : "unread"
                              }-${readStatusVersion}`}
                              message={message}
                              userId={userId}
                              dispatch={dispatch}
                            />
                          );
                        });
                      });

                      return result;
                    })()
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
                {/* Khu vực nhập liệu với thanh công cụ ở trên và nút gửi ở bên phải */}
                <div style={{ position: "relative" }}>
                  {/* Nút gửi tin nhắn ở góc trên bên phải */}
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={() => handleSendMessage()}
                    disabled={!messageText.trim()}
                    style={{
                      position: "absolute",
                      top: "5px",
                      right: "5px",
                      zIndex: 100,
                      borderRadius: "50%",
                      width: "40px",
                      height: "40px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      background: messageText.trim()
                        ? "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)"
                        : undefined,
                      boxShadow: messageText.trim()
                        ? "0 2px 6px rgba(24, 144, 255, 0.5)"
                        : undefined,
                    }}
                  />

                  {/* TinyMCE Editor */}
                  <div style={{ position: "relative", minHeight: "150px" }}>
                    <TinyMCEEditor
                      placeholder="Type a message... (Shift+Enter for new line)"
                      value={messageText}
                      height={250}
                      outputFormat="html"
                      onChange={(content) => {
                        setMessageText(content);
                        // Send typing notification when user starts typing
                        if (selectedContact) {
                          sendTypingNotification(selectedContact.id);
                        }
                      }}
                      onEnterPress={handleSendMessage}
                      onFocus={() => {
                        // Update read status when input is focused
                        if (selectedContact && userInfo) {
                          console.log(
                            "[Chat] Message input focused, updating read status for",
                            selectedContact.isGroup ? "group" : "contact",
                            selectedContact.id
                          );

                          // Update read status in Redux
                          dispatch(
                            updateMessagesReadStatus({
                              contactId: selectedContact.id,
                              currentUserId: userInfo.id,
                            })
                          );

                          // Only mark messages as read if there are unread messages
                          const hasUnreadMessages =
                            selectedContact.unreadCount > 0;
                          if (hasUnreadMessages) {
                            console.log(
                              "[Chat] Has unread messages, marking as read via WebSocket"
                            );
                            // Mark messages as read via WebSocket
                            import("../services/websocketService").then(
                              ({ markMessagesAsReadViaWebSocket }) => {
                                markMessagesAsReadViaWebSocket(
                                  selectedContact.id
                                );
                              }
                            );
                          } else {
                            console.log(
                              "[Chat] No unread messages, skipping mark as read"
                            );
                          }
                        }
                      }}
                    />
                    {/* We'll use a separate useEffect to handle focus behavior */}
                  </div>

                  {/* Hướng dẫn Shift+Enter */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      right: "16px",
                      fontSize: "11px",
                      color: "rgba(0, 0, 0, 0.45)",
                      pointerEvents: "none",
                      display: messageText.length > 0 ? "none" : "block",
                    }}
                  >
                    Shift+Enter for new line | Ctrl+Enter to send
                  </div>
                </div>

                {/* Xóa nút gửi tin nhắn cũ */}
                {/* <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    style={{
                      borderRadius: "50%",
                      width: "48px",
                      height: "48px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  />
                </div>

                <div
                  style={{
                    position: "absolute",
                    bottom: "8px",
                    right: "16px",
                    fontSize: "11px",
                    color: "rgba(0, 0, 0, 0.45)",
                    pointerEvents: "none",
                    display: messageText.length > 0 ? "none" : "block",
                  }}
                >
                  Shift+Enter for new line
                </div>
                {/* Nút gửi tin nhắn thứ hai đã được xóa và thay thế bằng nút ở trên */}
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

      {/* Create Group Modal */}
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
            <UsergroupAddOutlined style={{ fontSize: "20px" }} /> Create New
            Group
          </div>
        }
        open={showCreateGroupModal}
        onOk={handleCreateGroup}
        onCancel={() => {
          setShowCreateGroupModal(false);
          setNewGroupName("");
          setSelectedGroupMembers([]);
        }}
        okText="Create Group"
        cancelText="Cancel"
        okButtonProps={{
          style: {
            background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
            border: "none",
            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
          },
        }}
      >
        <Form layout="vertical">
          <Form.Item
            name="groupName"
            label="Group Name"
            rules={[
              {
                required: true,
                message: "Please enter a group name",
              },
            ]}
          >
            <Input
              placeholder="Enter group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              style={{
                borderRadius: "6px",
                padding: "8px 12px",
              }}
              prefix={<TeamOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
            />
          </Form.Item>
          <Form.Item
            name="members"
            label="Select Members"
            rules={[
              {
                required: true,
                message: "Please select at least one member",
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Select members"
              style={{ width: "100%", borderRadius: "6px" }}
              value={selectedGroupMembers}
              onChange={(values) => setSelectedGroupMembers(values)}
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label?.toString().toLowerCase() ?? "").includes(
                  input.toLowerCase()
                )
              }
              options={contacts
                .filter((contact) => contact.contactStatus === "ACCEPTED")
                .map((contact) => ({
                  value: contact.id,
                  label: contact.name || contact.email,
                }))}
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
              Create a group chat with your contacts. You can add more members
              later.
            </p>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ChatPage;

