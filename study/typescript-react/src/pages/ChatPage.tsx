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
} from "antd";
import { SendOutlined, UserOutlined } from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../types";
import {
  NovuProvider,
  PopoverNotificationCenter,
  NotificationBell,
} from "@novu/notification-center";
import { Message, Contact } from "../services/chatService";

import {
  fetchContacts,
  fetchMessages,
  sendMessageThunk,
  markAsRead,
  addContact,
  setSelectedContact,
} from "../store/chatSlice";

const { Title, Text } = Typography;

const ChatPage: React.FC = () => {
  const dispatch = useDispatch();
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { token, userId } = useSelector((state: RootState) => state.auth);
  const { messages, contacts, selectedContact, loading } = useSelector(
    (state: RootState) => state.chat
  );

  // Novu application ID
  const NOVU_APP_ID = import.meta.env.VITE_NOVU_APP_ID || "your-novu-app-id";

  useEffect(() => {
    dispatch(fetchContacts());
  }, [dispatch]);

  useEffect(() => {
    if (selectedContact) {
      dispatch(fetchMessages(selectedContact.id));
    }
  }, [selectedContact, dispatch]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // These functions are now handled by Redux actions

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedContact) return;

    try {
      await dispatch(
        sendMessageThunk({
          content: messageText,
          receiverId: selectedContact.id,
        })
      );

      // Clear the input field
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
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
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const onNotificationClick = (message: any) => {
    // Handle notification click - e.g., navigate to specific chat
    if (message.payload && message.payload.contactId) {
      const contact = contacts.find((c) => c.id === message.payload.contactId);
      if (contact) {
        dispatch(setSelectedContact(contact));
        // Fetch messages for this contact
        dispatch(fetchMessages(message.payload.contactId));
      }
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title level={2} style={{ margin: 0, color: "#fff" }}>
          Chat
        </Title>
        <NovuProvider subscriberId={userId} applicationIdentifier={NOVU_APP_ID}>
          <PopoverNotificationCenter onNotificationClick={onNotificationClick}>
            {({ unseenCount }) => (
              <NotificationBell unseenCount={unseenCount} />
            )}
          </PopoverNotificationCenter>
        </NovuProvider>
      </div>

      <div style={{ display: "flex", height: "calc(100% - 60px)", gap: 16 }}>
        {/* Contacts List */}
        <Card
          style={{ width: 300, height: "100%", overflow: "auto" }}
          bodyStyle={{ padding: 0, height: "100%" }}
        >
          <div style={{ padding: "16px", borderBottom: "1px solid #f0f0f0" }}>
            <Title level={4} style={{ margin: 0 }}>
              Contacts
            </Title>
          </div>

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
                        ? "#f0f0f0"
                        : "transparent",
                    padding: "12px 16px",
                  }}
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
                    title={contact.name}
                    description={
                      <Text ellipsis style={{ maxWidth: 200 }}>
                        {contact.lastMessage || "No messages yet"}
                      </Text>
                    }
                  />
                  {contact.unreadCount > 0 && (
                    <div
                      style={{
                        backgroundColor: "#1890ff",
                        color: "white",
                        borderRadius: "50%",
                        width: 20,
                        height: 20,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        fontSize: 12,
                      }}
                    >
                      {contact.unreadCount}
                    </div>
                  )}
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
                  <Title level={4} style={{ margin: 0 }}>
                    {selectedContact.name}
                  </Title>
                  <Text type="secondary">{selectedContact.status}</Text>
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
                {loading ? (
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
                          message.sender.id === userId ? "#1890ff" : "#f0f0f0",
                        color:
                          message.sender.id === userId
                            ? "white"
                            : "rgba(0, 0, 0, 0.85)",
                        padding: "8px 12px",
                        borderRadius: 8,
                        maxWidth: "70%",
                        marginBottom: 8,
                        wordBreak: "break-word",
                      }}
                    >
                      <div>{message.content}</div>
                      <div
                        style={{
                          fontSize: 12,
                          marginTop: 4,
                          textAlign: "right",
                          opacity: 0.7,
                        }}
                      >
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
                  gap: 8,
                }}
              >
                <Input
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  style={{ flex: 1 }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={sendMessage}
                  disabled={!messageText.trim()}
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
    </div>
  );
};

export default ChatPage;

