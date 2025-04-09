// src/components/ChatWindow.tsx
import React, { useRef, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Stack,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

import { ChatMessage } from "./ChatMessage";
// Import type from parent
import { ChatWindowProps } from "../types/LanguageAITypes"; // From languageAI";

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
    formatTimestamp,
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
          width: { xs: "100%", md: "75%" },
          display: "flex",
          flexDirection: "column",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Typography
          variant="h5"
          sx={{
            py: 2,
            px: 3,
            textAlign: "center",
            fontWeight: 600,
            color: "primary.main",
            borderBottom: "1px solid",
            borderColor: "divider",
            backgroundColor: "rgba(25, 118, 210, 0.05)",
          }}
        >
          Language Practice AI
        </Typography>

        {/* Chat Messages Container */}
        <Box
          ref={chatContainerRef}
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            p: 2,
            gap: 2,
            height: "100%",
            maxHeight: "calc(100vh - 150px)",
            "&::-webkit-scrollbar": {
              width: "8px",
              display: "block",
            },
            "&::-webkit-scrollbar-track": {
              background: "#e9ecef",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "linear-gradient(180deg, #1890ff 0%, #096dd9 100%)",
              borderRadius: "4px",
              transition: "background 0.3s ease",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "linear-gradient(180deg, #40c4ff 0%, #2196f3 100%)",
            },
          }}
        >
          {/* History Toggle Button */}
          <Box
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              display: "flex",
              justifyContent: "flex-end",
              mb: 2,
              pt: 1,
              backgroundColor: "rgba(255, 255, 255, 0)",
            }}
          >
            <Button
              variant="outlined"
              size="small"
              color="primary"
              startIcon={
                showHistory ? (
                  <KeyboardArrowUpIcon fontSize="inherit" />
                ) : (
                  <KeyboardArrowDownIcon fontSize="inherit" />
                )
              }
              onClick={handleHistoryToggleClick}
              sx={{
                borderRadius: "20px",
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                px: 2,
                py: 0.5,
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                  transform: "translateY(-1px)",
                },
              }}
              aria-controls="conversation-history"
              aria-expanded={showHistory}
            >
              {showHistory ? "Hide History" : "Show History"}
            </Button>
          </Box>

          {/* History Loading */}
          {showHistory && isLoadingHistory && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 2,
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
          <Stack spacing={3} sx={{ width: "100%" }}>
            {messagesToDisplay.length > 0
              ? messagesToDisplay.map((msg, index) => {
                  const isUser = msg.sender === "User";
                  const isPreviousUser =
                    index > 0 && messagesToDisplay[index - 1].sender === "User";
                  const isNextUser =
                    index < messagesToDisplay.length - 1 &&
                    messagesToDisplay[index + 1].sender === "User";

                  // Add extra spacing between different sender groups
                  const marginTop =
                    index > 0 && isUser !== isPreviousUser ? 3 : 0;
                  const marginBottom =
                    index < messagesToDisplay.length - 1 &&
                    isUser !== isNextUser
                      ? 3
                      : 0;

                  return (
                    <Box
                      key={msg.id || `msg-${index}`}
                      sx={{
                        width: "100%",
                        display: "flex",
                        justifyContent: isUser ? "flex-end" : "flex-start",
                        mt: marginTop,
                        mb: marginBottom,
                      }}
                    >
                      <ChatMessage
                        message={msg}
                        username={username}
                        formatTimestamp={formatTimestamp}
                      />
                    </Box>
                  );
                })
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
          </Stack>

          {/* AI Thinking Indicator */}
          {isGeneratingResponse && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                alignSelf: "flex-start",
                pl: 2,
                mt: 2,
                mb: 1,
                py: 1,
                px: 2,
                borderRadius: "12px",
                backgroundColor: "rgba(0, 0, 0, 0.03)",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              }}
            >
              <CircularProgress size={16} color="primary" />
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", fontStyle: "italic" }}
              >
                AI is thinking...
              </Typography>
            </Box>
          )}

          {/* Scroll Anchor */}
          <Box ref={messagesEndRef} sx={{ height: 1, mt: 2 }} />
        </Box>
      </Paper>
    );
  }
);

