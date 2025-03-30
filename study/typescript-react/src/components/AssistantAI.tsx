import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Button,
  TextField,
  Paper,
  Box,
  CircularProgress,
  Typography,
  Fab
} from "@mui/material";
import { PlayCircleOutlined } from "@mui/icons-material";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import { v4 as uuidv4 } from "uuid";
import axios, { AxiosError } from "axios";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../type/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import "../styles/AssistantAI.css";
import store from "../store/store";
import {
  setMessages,
  addMessage,
  addAIResponse,
  setLoading,
  setHasMore,
  incrementPage
} from "../store/assistantAISlice";
import { ChatMessage } from "../types/assistantAI";
import mermaid from "mermaid";

// Initialize mermaid configuration globally
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  flowchart: {
    htmlLabels: true,
    curve: "basis"
  },
  sequence: {
    diagramMarginX: 50,
    diagramMarginY: 10,
    actorMargin: 50,
    width: 150,
    height: 65
  }
});

// Update the RootState type by extending it
declare module "../type/types" {
  interface RootState {
    assistantAI: {
      messages: ChatMessage[];
      loading: boolean;
      hasMore: boolean;
      page: number;
      size: number;
    };
  }
}

// Create a Mermaid component to render diagrams
const MermaidDiagram = React.memo(({ content }: { content: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRendered, setIsRendered] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Create a deterministic ID based on content hash
  const getDiagramId = useCallback(() => {
    // Simple hash function for generating a stable ID
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `mermaid-${Math.abs(hash).toString(16)}`;
  }, [content]);

  const diagramId = useRef(getDiagramId());

  useEffect(() => {
    // Skip if already rendered or no container
    if (isRendered || !containerRef.current) return;

    const renderDiagram = async () => {
      if (!containerRef.current) return;

      try {
        // Clear any previous content
        containerRef.current.innerHTML = "";
        setError(null);

        // Initialize mermaid with larger diagram sizes
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
          flowchart: {
            htmlLabels: true,
            curve: "basis",
            useMaxWidth: false // Prevent width limitation
          },
          sequence: {
            diagramMarginX: 50,
            diagramMarginY: 10,
            actorMargin: 80, // Increased actor margin
            width: 250, // Increased width
            height: 100, // Increased height
            boxMargin: 10,
            boxTextMargin: 5,
            noteMargin: 10,
            messageMargin: 35
          },
          fontSize: 16, // Increase font size
          fontFamily: "Roboto, sans-serif" // Consistent font
        });

        // Use the modern render method instead of deprecated init
        const { svg } = await mermaid.render(diagramId.current, content);

        // Create container and insert SVG
        const container = document.createElement("div");
        container.className = "mermaid-svg-container";

        // Modify SVG for better sizing
        let modifiedSvg = svg;
        if (!modifiedSvg.includes("width=")) {
          modifiedSvg = modifiedSvg.replace("<svg ", '<svg width="100%" ');
        }
        if (!modifiedSvg.includes("height=")) {
          modifiedSvg = modifiedSvg.replace("<svg ", '<svg height="auto" ');
        }

        container.innerHTML = modifiedSvg;

        // Append to DOM
        containerRef.current.appendChild(container);

        // Add event listener to ensure diagram is properly sized
        const svgElement = containerRef.current.querySelector("svg");
        if (svgElement) {
          svgElement.setAttribute(
            "style",
            "width: 100%; min-width: 300px; min-height: 200px;"
          );
          svgElement.setAttribute("preserveAspectRatio", "xMidYMid meet");
        }

        // Mark as rendered to prevent future renders
        setIsRendered(true);
      } catch (err) {
        console.error("Failed to render mermaid diagram:", err);
        setError(
          err instanceof Error ? err.message : "Failed to render diagram"
        );
      }
    };

    // Use a timeout to ensure the DOM is stable before rendering
    timeoutRef.current = setTimeout(() => {
      renderDiagram();
    }, 150);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, isRendered, getDiagramId]); // Include isRendered in dependencies

  // Reset rendered state if content changes
  useEffect(() => {
    setIsRendered(false);
    diagramId.current = getDiagramId();
  }, [content, getDiagramId]);

  return (
    <div className="mermaid-diagram-container">
      <div ref={containerRef} className="mermaid-render-target" />
      {error && (
        <div className="mermaid-error">Diagram rendering failed: {error}</div>
      )}
    </div>
  );
});

const AssistantAI: React.FC = () => {
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const dispatch = useDispatch();
  const { token } = useSelector((state: RootState) => state.auth);
  const { userInfo } = useSelector((state: RootState) => state.user);
  const { messages, loading, hasMore, page, size } = useSelector(
    (state: RootState) => state.assistantAI
  );

  // Check for valid authentication on component mount and token changes
  useEffect(() => {
    if (!token && userInfo?.id) {
      console.warn(
        "Token is missing but user info exists - possible session expiration"
      );
      // You can add a redirect to login page or show a message here
      dispatch(
        addAIResponse({
          content:
            "Your session appears to have expired. Please refresh the page and log in again.",
          sender: "AI",
          sessionId: sessionId || uuidv4(),
          timestamp: new Date().toISOString()
        })
      );
    }
  }, [token, userInfo, sessionId, dispatch]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = useCallback(
    async (pageToLoad = 0) => {
      if (!userInfo?.id || loading || (pageToLoad > 0 && !hasMore)) return;

      try {
        dispatch(setLoading(true));
        const { getRecaptchaToken } = await import("../utils/recaptchaUtils");
        const recaptchaToken = getRecaptchaToken();

        console.log(`Loading chat history: page=${pageToLoad}, size=${size}`);

        const response = await axios.get(
          `/api/assistant/${
            userInfo.id
          }?page=${pageToLoad}&size=${size}&recaptchaToken=${encodeURIComponent(
            recaptchaToken
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        console.log("API Response:", response.data);

        if (
          response.data &&
          Array.isArray(response.data) &&
          response.data.length > 0
        ) {
          if (pageToLoad === 0) {
            // For first page, replace all messages
            console.log("Setting messages from API:", response.data);
            dispatch(setMessages(response.data));
            const lastMessage = response.data[response.data.length - 1];
            if (lastMessage.sessionId) {
              setSessionId(lastMessage.sessionId);
            }
          } else {
            // Prepend older messages when loading more
            console.log("Adding older messages:", response.data);
            // We need to concatenate in the correct order: older messages first, then existing messages
            const currentMessages = store.getState().assistantAI.messages;
            dispatch(setMessages([...response.data, ...currentMessages]));
          }

          dispatch(setHasMore(response.data.length === size));
        } else if (pageToLoad === 0) {
          // If it's the first load and no messages, set default welcome message
          console.log("No messages found, setting welcome message");
          const newSessionId = uuidv4();
          setSessionId(newSessionId);
          dispatch(
            setMessages([
              {
                content:
                  "Hello! I am your AI assistant. How can I help you today?",
                sender: "AI",
                sessionId: newSessionId,
                timestamp: new Date().toISOString()
              }
            ])
          );
          dispatch(setHasMore(false));
        } else {
          console.log("No more messages to load");
          dispatch(setHasMore(false));
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
        if (pageToLoad === 0) {
          // Only set welcome message on first load error
          const newSessionId = uuidv4();
          setSessionId(newSessionId);
          dispatch(
            setMessages([
              {
                content:
                  "Hello! I am your AI assistant. How can I help you today?",
                sender: "AI",
                sessionId: newSessionId,
                timestamp: new Date().toISOString()
              }
            ])
          );
        }
        dispatch(setHasMore(false));
      } finally {
        dispatch(setLoading(false));
      }
    },
    // Remove 'messages' from the dependency array to break the loop
    [token, userInfo?.id, loading, hasMore, size, dispatch]
  );

  // Initial data load - only runs once when component mounts
  useEffect(() => {
    // Force initial data load on component mount only if the messages array is empty
    const currentState = store.getState().assistantAI;

    // Ensure we have a session ID even if there are no messages
    if (!sessionId) {
      const newSessionId = uuidv4();
      console.log("Initializing new session:", newSessionId);
      setSessionId(newSessionId);
    }

    if (
      userInfo?.id &&
      (!currentState.messages || currentState.messages.length === 0)
    ) {
      console.log(
        "Component mounted with empty messages, loading initial chat data"
      );
      loadChatHistory(0);
    } else {
      console.log(
        "Using cached messages from store:",
        currentState.messages?.length || 0
      );

      // If we have messages, make sure we have set the session ID from the last message
      if (currentState.messages && currentState.messages.length > 0) {
        const lastMessage =
          currentState.messages[currentState.messages.length - 1];
        if (lastMessage.sessionId) {
          console.log(
            "Using existing session from last message:",
            lastMessage.sessionId
          );
          setSessionId(lastMessage.sessionId);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  // Handle user changes - runs only when userInfo changes, not on every render
  useEffect(() => {
    // Only load chat history if userInfo changes and there are no messages
    const currentMessages = store.getState().assistantAI.messages;

    if (userInfo?.id && (!currentMessages || currentMessages.length === 0)) {
      console.log("User changed or no messages in store, loading chat data");
      loadChatHistory(0);
    } else if (!userInfo?.id) {
      // Set default welcome message if no user is logged in
      const newSessionId = uuidv4();
      setSessionId(newSessionId);
      dispatch(
        setMessages([
          {
            content: "Hello! I am your AI assistant. How can I help you today?",
            sender: "AI",
            sessionId: newSessionId,
            timestamp: new Date().toISOString()
          }
        ])
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo?.id]); // Only depend on userInfo.id changing

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  const handleScroll = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;

      // Show/hide scroll button based on position
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
      setShowScrollButton(isScrolledUp);

      // Check if user scrolled to top to load more messages
      if (scrollTop < 100 && !loading && hasMore) {
        // Use a debounce technique to avoid multiple rapid calls
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
          console.log("Scroll reached top, loading more messages");
          dispatch(incrementPage());
          loadChatHistory(page + 1);
          debounceTimerRef.current = null;
        }, 300) as unknown as number; // 300ms debounce
      }
    }
  }, [loading, hasMore, page, dispatch, loadChatHistory]);

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener("scroll", handleScroll);
      return () => chatContainer.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const handleSendMessage = async () => {
    if (!input.trim() || !userInfo?.id) return;

    // Verify token exists before proceeding
    if (!token) {
      console.error("Authentication token is missing");
      dispatch(
        addAIResponse({
          content:
            "You are not properly authenticated. Please try logging in again.",
          sender: "AI",
          sessionId: sessionId || uuidv4(),
          timestamp: new Date().toISOString()
        })
      );
      return;
    }

    // Generate new sessionId if it doesn't exist
    if (!sessionId) {
      const newId = uuidv4();
      setSessionId(newId);
      console.log("Created new sessionId:", newId);
    }

    // Use a local variable to ensure consistent sessionId throughout this function call
    const currentSessionId = sessionId || uuidv4();
    console.log("Sending message with sessionId:", currentSessionId);
    console.log("Using auth token:", token ? "Token exists" : "Token missing");

    const currentMessage = input.trim(); // Save current input
    const userMessage: ChatMessage = {
      content: currentMessage,
      sender: "USER",
      sessionId: currentSessionId,
      timestamp: new Date().toISOString()
    };

    dispatch(addMessage(userMessage));
    setInput("");
    dispatch(setLoading(true));
    setAiThinking(true);

    try {
      // Try to refresh token if needed (implement based on your auth system)
      const currentToken = token;
      try {
        // This is a placeholder - implement according to your auth system
        // For example, you might check token expiration and refresh if needed
        // const tokenData = await checkAndRefreshToken(token);
        // if (tokenData.refreshed) currentToken = tokenData.newToken;
      } catch (tokenError) {
        console.error("Error refreshing token:", tokenError);
      }

      const { getRecaptchaToken } = await import("../utils/recaptchaUtils");
      const recaptchaToken = getRecaptchaToken();

      console.log("Sending API request with data:", {
        userId: userInfo.id,
        message: currentMessage,
        sessionId: currentSessionId
      });

      // Ensure authorization header is properly formatted with token
      const authHeader = currentToken.trim()
        ? `Bearer ${currentToken.trim()}`
        : "";

      if (!authHeader) {
        throw new Error("Authentication token is empty");
      }

      const response = await axios.post(
        "/api/assistant/send",
        {
          userId: userInfo.id,
          message: currentMessage,
          sessionId: currentSessionId,
          recaptchaToken
        },
        {
          headers: {
            Authorization: authHeader
          }
        }
      );

      console.log("API Response:", response.data);

      if (response.data) {
        let content = "No response";

        if (typeof response.data.content === "string") {
          content = response.data.content;
        } else if (response.data.content) {
          content = JSON.stringify(response.data.content);
        }

        if (!content || content.trim() === "") {
          content = "I couldn't process your request. Please try again.";
        }

        const aiResponse = {
          content: content,
          sender: "AI",
          sessionId: currentSessionId,
          timestamp: new Date().toISOString()
        };

        console.log("Adding AI response to store:", aiResponse);
        dispatch(addAIResponse(aiResponse));
      } else {
        throw new Error("Empty response from server");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = "Sorry, something went wrong. Please try again.";

      // If we can get a more specific error message, use it
      let detailedError = errorMessage;
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.log("Error response status:", axiosError.response?.status);
        console.log("Error response data:", axiosError.response?.data);

        if (axiosError.response?.data) {
          // Safely access the message property if it exists
          const errorData = axiosError.response.data;
          if (
            typeof errorData === "object" &&
            errorData !== null &&
            "message" in errorData
          ) {
            const message = (errorData as Record<string, unknown>).message;
            if (typeof message === "string") {
              detailedError = message;
            }
          }
        }
      }

      const errorResponse: ChatMessage = {
        content: detailedError,
        sender: "AI",
        sessionId: currentSessionId,
        timestamp: new Date().toISOString()
      };
      dispatch(addAIResponse(errorResponse));
    } finally {
      dispatch(setLoading(false));
      setAiThinking(false);
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
        <Box className="chat-container" ref={chatContainerRef}>
          {loading && page > 0 && (
            <Box ref={loaderRef} className="loading-earlier-messages">
              <CircularProgress size={20} />
              <Typography variant="body2">
                Loading earlier messages...
              </Typography>
            </Box>
          )}

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
                    <ReactMarkdown
                      rehypePlugins={[rehypeRaw]}
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
                          if (match && match[1] === "mermaid") {
                            return (
                              <div className="mermaid-with-code">
                                <MermaidDiagram content={String(children)} />
                                <div className="mermaid-source">
                                  <div className="mermaid-source-header">
                                    <Typography variant="caption">
                                      Mermaid Syntax
                                    </Typography>
                                  </div>
                                  <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language="mermaid"
                                    PreTag="div"
                                    wrapLongLines={true}
                                  >
                                    {String(children).replace(/\n$/, "")}
                                  </SyntaxHighlighter>
                                </div>
                              </div>
                            );
                          }
                          return match ? (
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              wrapLongLines={true}
                              {...props}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                        table: (props) => (
                          <table className="markdown-table" {...props} />
                        ),
                        thead: (props) => (
                          <thead className="markdown-thead" {...props} />
                        ),
                        th: (props) => (
                          <th className="markdown-th" {...props} />
                        ),
                        td: (props) => <td className="markdown-td" {...props} />
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
              {aiThinking && (
                <Box className="loading-message">
                  <CircularProgress size={20} />
                  <Typography variant="body1">AI is thinking...</Typography>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Box>
          )}
        </Box>
        {showScrollButton && (
          <Fab
            className="scroll-down-button"
            color="default"
            size="large"
            onClick={scrollToBottom}
          >
            <KeyboardArrowDown />
          </Fab>
        )}
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
            disabled={aiThinking}
          />

          <Button
            className="send-button"
            variant="contained"
            onClick={handleSendMessage}
            disabled={!input.trim() || aiThinking}
          >
            <PlayCircleOutlined fontSize="large" />
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default AssistantAI;
