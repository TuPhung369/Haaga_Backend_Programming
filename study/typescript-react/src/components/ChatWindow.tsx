// src/components/ChatWindow.tsx
import React, { useRef, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

import { ChatMessage } from "./ChatMessage";
// Import type from parent
import { ChatWindowProps } from "../type/languageAI";

export const ChatWindow: React.FC<ChatWindowProps> = React.memo(
  ({
    messages,
    username,
    previousMessages,
    isLoadingHistory,
    isGeneratingResponse,
    showHistory,
    onToggleHistory,
    fetchPreviousMessages,
    formatTimestamp
  }) => {
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const chatContainerRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = useCallback(
      (behavior: ScrollBehavior = "smooth") => {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior });
        }, 50);
      },
      []
    );

    useEffect(() => {
      scrollToBottom(showHistory ? "instant" : "smooth");
    }, [messages, previousMessages, showHistory, scrollToBottom]);

    const handleHistoryToggleClick = () => {
      onToggleHistory();
      if (!showHistory && previousMessages.length === 0) {
        fetchPreviousMessages(); // Fetch when turning on and empty
      }
    };

    const messagesToDisplay = showHistory ? previousMessages : messages;

    return (
      <Paper
        elevation={3}
        sx={{
          width: { xs: "100%", md: "70%" },
          display: "flex",
          flexDirection: "column",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          height: "100%",
          overflow: "hidden"
        }}
      >
        {/* Header */}
        <Typography
          variant="h5"
          sx={
            {
              /* ... styles ... */
            }
          }
        >
          Language Practice AI
        </Typography>

        {/* Chat Messages Container */}
        <Box
          ref={chatContainerRef}
          sx={
            {
              /* ... styles ... */
            }
          }
        >
          {/* History Toggle Button */}
          <Box
            sx={{
              position: "sticky",
              top: -16,
              zIndex: 10,
              display: "flex",
              justifyContent: "flex-end",
              mb: 1,
              backgroundColor: "transparent"
            }}
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={
                showHistory ? (
                  <KeyboardArrowUpIcon fontSize="inherit" />
                ) : (
                  <KeyboardArrowDownIcon fontSize="inherit" />
                )
              }
              onClick={handleHistoryToggleClick}
              sx={
                {
                  /* ... styles ... */
                }
              }
              aria-controls="conversation-history"
              aria-expanded={showHistory}
            >
              {" "}
              {showHistory ? "Hide History" : "Show History"}{" "}
            </Button>
          </Box>

          {/* History Loading */}
          {showHistory && isLoadingHistory && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 2
              }}
            >
              <CircularProgress size={20} />
              <Typography
                variant="body2"
                sx={{ ml: 1, color: "text.secondary" }}
              >
                Loading history...
              </Typography>
            </Box>
          )}

          {/* Render Messages */}
          {messagesToDisplay.length > 0
            ? messagesToDisplay.map((msg, index) => (
                <ChatMessage
                  key={msg.id || `msg-${index}`}
                  message={msg}
                  username={username}
                  formatTimestamp={formatTimestamp}
                />
              ))
            : showHistory &&
              !isLoadingHistory && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: "center", py: 3 }}
                >
                  No conversation history found.
                </Typography>
              )}

          {/* AI Thinking Indicator */}
          {isGeneratingResponse && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                alignSelf: "flex-start",
                pl: 1.5,
                mt: 1
              }}
            >
              <CircularProgress size={16} />
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", fontStyle: "italic" }}
              >
                AI is thinking...
              </Typography>
            </Box>
          )}

          {/* Scroll Anchor */}
          <div ref={messagesEndRef} />
        </Box>
      </Paper>
    );
  }
);
