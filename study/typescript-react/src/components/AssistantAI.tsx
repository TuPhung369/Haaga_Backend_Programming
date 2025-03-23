import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Button,
  TextField,
  Paper,
  Typography,
  Box,
  Avatar,
  Grid,
  CircularProgress
} from "@mui/material";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "../type/types";

interface ChatMessage {
  id?: number;
  content: string;
  sender: string;
  timestamp?: string;
  sessionId: string;
}

const AssistantAI: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
  }, [token, userInfo?.id]); // Dependencies for useCallback

  useEffect(() => {
    setSessionId(uuidv4());
    setMessages([
      {
        content: "Hello! I am your AI assistant. How can I help you today?",
        sender: "AI",
        sessionId: uuidv4()
      }
    ]);

    if (userInfo?.id) {
      loadChatHistory();
    }
  }, [userInfo?.id, loadChatHistory]); // Dependencies for useEffect

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !userInfo?.id) return;

    const userMessage: ChatMessage = {
      content: input,
      sender: "USER",
      sessionId: sessionId
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
            sessionId: sessionId
          }
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = {
        content: "Sorry, something went wrong. Please try again.",
        sender: "AI",
        sessionId: sessionId
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

  return (
    <Box
      sx={{
        p: 2,
        height: "calc(100vh - 160px)",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        AI Assistant
      </Typography>

      <Paper
        elevation={3}
        sx={{
          p: 2,
          flexGrow: 1,
          mb: 2,
          overflow: "auto",
          maxHeight: "calc(100vh - 280px)",
          backgroundColor: "#f5f5f5"
        }}
      >
        {Array.isArray(messages) &&
          messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                justifyContent:
                  message.sender === "USER" ? "flex-end" : "flex-start",
                mb: 2
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection:
                    message.sender === "USER" ? "row-reverse" : "row",
                  alignItems: "flex-start",
                  maxWidth: "80%"
                }}
              >
                <Avatar
                  sx={{
                    bgcolor:
                      message.sender === "USER"
                        ? "primary.main"
                        : "secondary.main",
                    width: 36,
                    height: 36,
                    mr: message.sender === "USER" ? 0 : 1,
                    ml: message.sender === "USER" ? 1 : 0
                  }}
                >
                  {message.sender === "USER"
                    ? userInfo?.username?.charAt(0).toUpperCase() || "U"
                    : "AI"}
                </Avatar>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor:
                      message.sender === "USER" ? "#e3f2fd" : "white",
                    borderRadius: 2
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                    {message.content}
                  </Typography>
                  {message.timestamp && (
                    <Typography
                      variant="caption"
                      sx={{ display: "block", mt: 1, color: "text.secondary" }}
                    >
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </Typography>
                  )}
                </Paper>
              </Box>
            </Box>
          ))}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
            <Paper sx={{ p: 2, backgroundColor: "white", borderRadius: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="body1">AI is thinking...</Typography>
              </Box>
            </Paper>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Paper>

      <Grid container spacing={1}>
        <Grid item xs={10}>
          <TextField
            fullWidth
            multiline
            className="message-input"
            maxRows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            variant="outlined"
            disabled={loading}
          />
        </Grid>
        <Grid item xs={2}>
          <Button
            fullWidth
            className="send-button"
            variant="contained"
            color="secondary"
            onClick={handleSendMessage}
            disabled={!input.trim() || loading}
            sx={{ height: "100%", borderRadius: "10px" }}
          >
            Send
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AssistantAI;
