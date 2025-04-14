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
} from "antd";
import {
  SendOutlined,
  UserOutlined,
  PlusOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { UnknownAction, ThunkDispatch } from "@reduxjs/toolkit";
import { RootState } from "../types";
import {
  NovuProvider,
  PopoverNotificationCenter,
  NotificationBell,
} from "@novu/notification-center";

import {
  fetchContacts,
  fetchMessages,
  sendMessageThunk,
  markAsRead, // Uncommented to use for marking messages as read
  addContactThunk as addContact, // Renamed in the combined slice
  setSelectedContact,
  updateContactGroupThunk,
  fetchPendingRequests,
  respondToRequest,
  addMessage, // Import the addMessage action
} from "../store/chatSlice";

import {
  connectWebSocket,
  disconnectWebSocket,
  sendMessageViaWebSocket,
  sendTypingNotification,
} from "../services/websocketService";

const { Title, Text } = Typography;

const ChatPage: React.FC = () => {
  const dispatch =
    useDispatch<ThunkDispatch<RootState, unknown, UnknownAction>>();
  const [messageText, setMessageText] = useState("");
  const [isAddContactModalVisible, setIsAddContactModalVisible] =
    useState(false);
  const [newContactEmail, setNewContactEmail] = useState("");
  const [form] = Form.useForm();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Lấy token từ state nhưng không sử dụng trực tiếp ở đây
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { token } = useSelector((state: RootState) => state.auth);
  const { userInfo } = useSelector((state: RootState) => state.user);
  const userId = userInfo?.id || "guest";
  const {
    messages,
    contacts,
    pendingRequests,
    selectedContact,
    loading: loadingContacts,
  } = useSelector((state: RootState) => state.chat);

  // Novu application ID
  const NOVU_APP_ID = import.meta.env.VITE_NOVU_APP_ID || "your-novu-app-id";

  useEffect(() => {
    // Fetch contacts
    dispatch(fetchContacts())
      .unwrap()
      .catch((error) => {
        notification.error({
          message: "Connection Error",
          description:
            "Failed to connect to the chat server. Please try again later.",
        });
      });

    // Fetch pending contact requests
    dispatch(fetchPendingRequests())
      .unwrap()
      .catch((error) => {
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
      // Fetch messages for the selected contact
      dispatch(fetchMessages(selectedContact.id))
        .unwrap()
        .then(() => {
          // After messages are fetched, mark them as read
          console.log("[Chat] Marking messages as read for contact:", selectedContact.id);
          
          // Try to mark messages as read via WebSocket first
          import("../services/websocketService").then(({ markMessagesAsReadViaWebSocket }) => {
            const sentViaWebSocket = markMessagesAsReadViaWebSocket(selectedContact.id);
            
            // If WebSocket fails, fall back to HTTP
            if (!sentViaWebSocket) {
              console.log("[Chat] WebSocket marking failed, falling back to HTTP");
              dispatch(markAsRead(selectedContact.id))
                .unwrap()
                .catch(error => {
                  console.error("[Chat] Error marking messages as read:", error);
                });
            }
          });
        })
        .catch(error => {
          console.error("[Chat] Error fetching messages:", error);
        });
    }
  }, [selectedContact, dispatch]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    });

    // Create a temporary message to display immediately
    const tempMessage: any = {
      id: `temp-${Date.now()}`,
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
    };

    // Add the temporary message to the Redux store
    console.log("[Chat] Adding temporary message to store:", tempMessage);
    dispatch(addMessage(tempMessage as any));

    try {
      // Try to send via WebSocket first
      console.log("[Chat] Attempting to send via WebSocket");
      const sentViaWebSocket = sendMessageViaWebSocket(
        messageText,
        selectedContact.id
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
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 10px",
        }}
      >
        <Title
          level={2}
          style={{
            margin: 0,
            color: "#1890ff",
            fontWeight: 600,
            textShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
          }}
        >
          Chat
        </Title>
        <NovuProvider subscriberId={userId} applicationIdentifier={NOVU_APP_ID}>
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

      <div style={{ display: "flex", height: "calc(100% - 60px)", gap: 16 }}>
        {/* Contacts List */}
        <Card
          style={{
            width: 300,
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
              justifyContent: "space-between",
              alignItems: "center",
              background: "linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%)",
            }}
          >
            <Title
              level={4}
              style={{
                margin: 0,
                color: "#1890ff",
                fontWeight: 600,
                fontSize: "18px",
              }}
            >
              Contacts
            </Title>
            <Button
              type="primary"
              shape="circle"
              icon={<PlusOutlined />}
              onClick={showAddContactModal}
              style={{
                backgroundColor: "#1890ff",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease",
              }}
            />
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
                        <Avatar
                          icon={<UserOutlined />}
                          style={{ backgroundColor: "#ff4d4f" }}
                        />
                      }
                      title={request.name}
                      description={request.email}
                    />
                  </List.Item>
                )}
              />
            </div>
          )}

          {/* Contacts List */}
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
              dataSource={contacts}
              renderItem={(contact) => (
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
                  actions={[
                    <Dropdown
                      key="group-dropdown"
                      menu={{
                        items: [
                          {
                            key: "friend",
                            label: "Friend",
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
                            label: "Family",
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
                            label: "College",
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
                            label: "Work",
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
                            label: "Other",
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
                            label: "None",
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
                        style={{ color: "#8c8c8c" }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Dropdown>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={<UserOutlined />}
                        style={{
                          backgroundColor:
                            contact.status === "online"
                              ? "#52c41a"
                              : contact.status === "away"
                              ? "#faad14"
                              : "#d9d9d9",
                        }}
                      />
                    }
                    title={
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span>{contact.name}</span>
                        {contact.group && (
                          <Tag
                            color="blue"
                            style={{
                              fontSize: "10px",
                              marginLeft: "4px",
                              padding: "0 4px",
                              height: "20px",
                              lineHeight: "20px",
                            }}
                          >
                            {contact.group}
                          </Tag>
                        )}
                      </div>
                    }
                    description={
                      <Text ellipsis style={{ maxWidth: 200 }}>
                        {contact.lastMessage || "No messages yet"}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>

        {/* Chat Area */}
        <Card
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
            border: "none",
            background: "#fff",
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
                  gap: 12,
                  background:
                    "linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%)",
                  borderTopLeftRadius: "12px",
                  borderTopRightRadius: "12px",
                }}
              >
                <Avatar
                  icon={<UserOutlined />}
                  style={{
                    backgroundColor:
                      selectedContact.status === "online"
                        ? "#52c41a"
                        : selectedContact.status === "away"
                        ? "#faad14"
                        : "#d9d9d9",
                  }}
                />
                <div>
                  <Title
                    level={4}
                    style={{
                      margin: 0,
                      color: "#1890ff",
                      fontWeight: 600,
                      fontSize: "18px",
                    }}
                  >
                    {selectedContact.name}
                  </Title>
                  <Text
                    style={{
                      color:
                        selectedContact.status === "online"
                          ? "#52c41a"
                          : selectedContact.status === "away"
                          ? "#faad14"
                          : "#8c8c8c",
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
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
                            ? "#52c41a"
                            : selectedContact.status === "away"
                            ? "#faad14"
                            : "#8c8c8c",
                      }}
                    />
                    {selectedContact.status.charAt(0).toUpperCase() +
                      selectedContact.status.slice(1)}
                  </Text>
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  padding: "16px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {loadingContacts ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
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
                      height: "100%",
                    }}
                  >
                    <Text type="secondary">
                      No messages yet. Start the conversation!
                    </Text>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
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
                        maxWidth: "70%",
                        marginBottom: 12,
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
                          justifyContent: "flex-end",
                          gap: "4px",
                        }}
                      >
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {message.sender.id === userId && (
                          <span
                            style={{
                              fontSize: "14px",
                              color:
                                message.sender.id === userId
                                  ? "#fff"
                                  : "#52c41a",
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
                <div ref={messagesEndRef} />
              </div>

              <div
                style={{
                  padding: "16px",
                  borderTop: "1px solid #f0f0f0",
                  display: "flex",
                  gap: 12,
                  background:
                    "linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%)",
                  borderBottomLeftRadius: "12px",
                  borderBottomRightRadius: "12px",
                }}
              >
                <Input
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    // Send typing notification when user starts typing
                    if (selectedContact) {
                      sendTypingNotification(
                        selectedContact.id,
                        e.target.value.length > 0
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
                    background: messageText.trim()
                      ? "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)"
                      : undefined,
                    boxShadow: messageText.trim()
                      ? "0 2px 5px rgba(0, 0, 0, 0.15)"
                      : undefined,
                    transition: "all 0.3s ease",
                  }}
                >
                  Send
                </Button>
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
            borderRadius: "6px",
          },
        }}
        cancelButtonProps={{
          style: {
            borderRadius: "6px",
          },
        }}
        styles={{
          body: { padding: "20px 24px" },
        }}
        style={{ top: 20 }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="email"
            label={
              <span style={{ fontSize: "15px", fontWeight: 500 }}>
                Email Address
              </span>
            }
            rules={[
              {
                required: true,
                message: "Please enter the contact's email address",
              },
              { type: "email", message: "Please enter a valid email address" },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="Enter email address"
              value={newContactEmail}
              onChange={(e) => setNewContactEmail(e.target.value)}
              style={{
                borderRadius: "6px",
                padding: "8px 12px",
                height: "40px",
              }}
            />
          </Form.Item>
          <div
            style={{
              marginTop: "10px",
              padding: "10px",
              background: "#f9f9f9",
              borderRadius: "6px",
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

