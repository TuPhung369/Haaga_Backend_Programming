import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Button,
  TextField,
  Paper,
  Box,
  CircularProgress,
  Typography
} from "@mui/material";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "../type/types";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import "../styles/AssistantAI.css";

interface ChatMessage {
  id?: number;
  content: string;
  sender: string;
  timestamp?: number[] | string;
  sessionId: string;
}

const AssistantAI: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false); // State để hiển thị icon
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null); // Ref cho chat container
  const { token } = useSelector((state: RootState) => state.auth);
  const { userInfo } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = useCallback(async () => {
    try {
      setLoading(true);
      const { getRecaptchaToken } = await import("../utils/recaptchaUtils");
      const recaptchaToken = getRecaptchaToken();

      const response = await axios.get(
        `/api/chat/${userInfo?.id}?recaptchaToken=${encodeURIComponent(
          recaptchaToken
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        setMessages(response.data);
        const lastMessage = response.data[response.data.length - 1];
        if (lastMessage.sessionId) {
          setSessionId(lastMessage.sessionId);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Error loading chat history:", error);
      setLoading(false);
      setMessages([]);
    }
  }, [token, userInfo?.id]);

  useEffect(() => {
    setSessionId(uuidv4());
    setMessages([
      {
        content: "Hello! I am your AI assistant. How can I help you today?",
        sender: "AI",
        sessionId: uuidv4(),
        timestamp: new Date().toISOString()
      }
    ]);

    if (userInfo?.id) {
      loadChatHistory();
    }
  }, [userInfo?.id, loadChatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false); // Ẩn icon khi đã ở dưới cùng
  };

  // Kiểm tra vị trí cuộn để hiển thị/ẩn icon
  const handleScroll = () => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50; // Gần đáy trong 50px
      setShowScrollButton(!isNearBottom);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !userInfo?.id) return;

    const userMessage: ChatMessage = {
      content: input,
      sender: "USER",
      sessionId: sessionId,
      timestamp: new Date().toISOString()
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { getRecaptchaToken } = await import("../utils/recaptchaUtils");
      const recaptchaToken = getRecaptchaToken();

      const response = await axios.post(
        "/api/chat/send",
        {
          userId: userInfo.id,
          message: input,
          sessionId: sessionId,
          recaptchaToken
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            content:
              typeof response.data.content === "string"
                ? response.data.content
                : response.data.content || "No response",
            sender: "AI",
            sessionId: sessionId,
            timestamp: new Date().toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = {
        content: "Sorry, something went wrong. Please try again.",
        sender: "AI",
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const parseTimestamp = (timestamp?: number[] | string) => {
    if (!timestamp) return null;
    if (typeof timestamp === "string") return new Date(timestamp);
    if (Array.isArray(timestamp) && timestamp.length >= 6) {
      const [year, month, day, hour, minute, second] = timestamp;
      return new Date(year, month - 1, day, hour, minute, second);
    }
    return null;
  };

  const formatTimestamp = (timestamp?: number[] | string) => {
    const date = parseTimestamp(timestamp);
    if (!date || isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  return (
    <Box className="root-container">
      <Paper elevation={3} className="chat-card">
        <Box
          className="chat-container"
          ref={chatContainerRef}
          onScroll={handleScroll}
        >
          {Array.isArray(messages) && messages.length === 0 ? (
            <Box className="empty-chat">
              <Typography variant="h6">No messages yet</Typography>
              <Typography variant="body2">
                Start a conversation by typing a message below.
              </Typography>
            </Box>
          ) : (
            <Box className="messages-container">
              {messages.map((message, index) => (
                <Box
                  key={index}
                  className={`message ${
                    message.sender === "USER" ? "user-message" : "bot-message"
                  }`}
                >
                  <Typography
                    variant="body1"
                    className={
                      message.sender === "USER" ? "user-name" : "ai-name"
                    }
                  >
                    {message.sender === "USER"
                      ? userInfo?.username || "User"
                      : "AI Assistant"}
                  </Typography>
                  <div className="markdown">
                    {" "}
                    {/* Add this div */}
                    <ReactMarkdown
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        code({ className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
                          return match ? (
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  {message.timestamp && (
                    <Typography variant="caption" className="message-timestamp">
                      {formatTimestamp(message.timestamp)}
                    </Typography>
                  )}
                </Box>
              ))}
              {loading && (
                <Box className="loading-message">
                  <CircularProgress size={20} />
                  <Typography variant="body1">AI is thinking...</Typography>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Box>
          )}
          {showScrollButton && (
            <Button className="scroll-down-button" onClick={scrollToBottom}>
              <ArrowDownwardIcon />
            </Button>
          )}
        </Box>

        <Box className="input-container" style={{ position: "relative" }}>
          <TextField
            fullWidth
            multiline
            className="message-input"
            maxRows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message here..."
            variant="outlined"
            disabled={loading}
          />

          <Button
            className="send-button"
            variant="contained"
            onClick={handleSendMessage}
            disabled={!input.trim() || loading}
          >
            Send
          </Button>
          {showScrollButton && (
            <Button className="scroll-down-button" onClick={scrollToBottom}>
              <ArrowDownwardIcon />
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default AssistantAI;
