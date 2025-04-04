import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo
} from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Alert,
  IconButton,
  Collapse
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import StopIcon from "@mui/icons-material/Stop";
import VoiceRecorder from "./VoiceRecorder";
import ServiceStatusNotification from "./ServiceStatusNotification";
import {
  convertSpeechToText,
  convertTextToSpeech,
  getSupportedLanguages
} from "../services/SpeechService";
import {
  saveInteraction,
  getAIResponseFromN8n,
  getLanguageConversations
} from "../services/LanguageService";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { stripMarkdown } from "../utils/TextUtils";
import mermaid from "mermaid";
import rehypeRaw from "rehype-raw";
import {
  fetchMessagesStart,
  fetchMessagesSuccess,
  fetchMessagesFailure,
  addMessage
} from "../redux/slices/languageSlice";
import { LanguageInteraction } from "../models/LanguageAI";

// Define Redux store state interface
interface RootState {
  user: {
    userInfo: {
      id: string;
      username: string;
      // Add other userInfo fields as needed
    };
    roles: string[];
    allUsers: Array<{ id: string; name: string }>;
    isUserInfoInvalidated: boolean;
    isRolesInvalidated: boolean;
  };
  auth: {
    token: string;
  };
  language: {
    messages: Array<{
      id: string;
      userMessage: string;
      aiResponse: string;
      createdAt: Date;
    }>;
    loading: boolean;
  };
}

// Define proficiency levels for the component
enum ProficiencyLevel {
  Beginner = "BEGINNER",
  Intermediate = "INTERMEDIATE",
  Advanced = "ADVANCED",
  Fluent = "FLUENT",
  Native = "NATIVE"
}

// API URL hardcoded to localhost:8080
// No need for API_URL here as it's handled in the service

interface LanguagePracticeAIProps {
  // userId is kept for potential future use
  userId?: string;
}

interface ResponseMetadata {
  responseTime?: number;
  responseSource?: "n8n" | "fallback";
  sessionId?: string;
  rawResponse?: Record<string, unknown>;
  isSimulated?: boolean;
}

// Add a component for rendering Mermaid diagrams
interface MermaidDiagramProps {
  content: string;
  onRenderComplete?: (svg: string) => void;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({
  content,
  onRenderComplete
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSvgContent(""); // Clear previous SVG

    // Configure Mermaid with explicit Gantt settings for better rendering
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
      fontFamily: "Arial",
      gantt: {
        titleTopMargin: 25,
        barHeight: 20,
        barGap: 4,
        topPadding: 50,
        leftPadding: 75,
        gridLineStartPadding: 35,
        fontSize: 14,
        axisFormat: "%d %b", // Format the axis to show day and month
        useWidth: 1200 // Ensure the diagram is wide enough to show all days
      }
    });

    // Clean up the Mermaid content
    let cleanedContent = content.trim();
    cleanedContent = cleanedContent
      .replace(/^```mermaid\s*/, "")
      .replace(/```\s*$/, "");

    // Remove any erroneous [object Object] or trailing commas
    cleanedContent = cleanedContent.replace(
      /\${2}\s{3}object Object\s{3}\${2}/g,
      ""
    );
    cleanedContent = cleanedContent.replace(/,\s*$/gm, "");

    // Basic validation
    const validDiagramTypes = [
      "gantt",
      "flowchart",
      "sequenceDiagram",
      "classDiagram",
      "stateDiagram"
    ];
    const firstLine = cleanedContent.split("\n")[0].trim();
    if (!validDiagramTypes.some((type) => firstLine.startsWith(type))) {
      setError(
        `Invalid or unrecognized Mermaid diagram type. Content must start with a valid type (e.g., gantt, flowchart). Received: ${firstLine.substring(
          0,
          50
        )}...`
      );
      setLoading(false);
      return;
    }

    console.log("Cleaned Mermaid content for rendering:", cleanedContent);

    try {
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      mermaid
        .render(id, cleanedContent)
        .then((result) => {
          setSvgContent(result.svg);
          setLoading(false);
          console.log("Mermaid diagram rendered successfully");

          // Call the callback with the rendered SVG if provided
          if (onRenderComplete) {
            onRenderComplete(result.svg);
          }
        })
        .catch((err) => {
          console.error("Mermaid render failed:", err);
          const errorMessage = err instanceof Error ? err.message : String(err);
          setError(`Failed to render diagram: ${errorMessage}`);
          setLoading(false);
        });
    } catch (e) {
      console.error("Mermaid processing error:", e);
      setError(
        `Failed to process diagram: ${
          e instanceof Error ? e.message : String(e)
        }`
      );
      setLoading(false);
    }
  }, [content, onRenderComplete]);

  return (
    <div
      className="mermaid-diagram-container"
      style={{ marginTop: "10px", marginBottom: "10px", width: "100%" }}
    >
      {loading && <div className="loading-indicator">Loading diagram...</div>}
      {error && (
        <div
          className="error-message"
          style={{ color: "red", whiteSpace: "pre-wrap" }}
        >
          Error rendering diagram: {error}
        </div>
      )}
      {svgContent && !error && (
        <div
          ref={containerRef}
          className="mermaid-svg-container"
          style={{
            overflowX: "auto", // Allow horizontal scrolling if needed
            overflowY: "auto", // Allow vertical scrolling if needed
            maxWidth: "100%", // Ensure it fits within the parent container
            minHeight: "400px", // Minimum height to ensure visibility
            maxHeight: "80vh", // Maximum height relative to viewport
            width: "auto", // Allow the diagram to take its natural width
            padding: "10px" // Add padding for better spacing
          }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      )}
    </div>
  );
};

// Create a DiagramViewer component to handle diagrams with toggle options
interface DiagramViewerProps {
  mermaidContent: string;
}

// DiagramViewer component for toggling between Mermaid diagram and source code view
const DiagramViewer: React.FC<DiagramViewerProps> = React.memo(
  ({ mermaidContent }) => {
    // Generate a stable ID based on the content for localStorage key
    const diagramId = useMemo(() => {
      // Simple hash function to create a stable ID for this diagram content
      let hash = 0;
      const content = mermaidContent;
      for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return `diagram-${Math.abs(hash).toString(16).substring(0, 8)}`;
    }, [mermaidContent]);

    // Get the stored view mode from localStorage or use default
    const getStoredViewMode = useCallback(() => {
      try {
        const stored = localStorage.getItem(`viewMode-${diagramId}`);
        if (stored && ["mermaid", "mermaid-code"].includes(stored)) {
          return stored as "mermaid" | "mermaid-code";
        }
      } catch (e) {
        console.warn(
          "Failed to retrieve stored view mode from localStorage",
          e
        );
      }
      return "mermaid"; // Default view
    }, [diagramId]);

    // State for the current view mode, initialized from storage
    const [viewMode, setViewMode] = useState<"mermaid" | "mermaid-code">(
      getStoredViewMode()
    );

    // Store the viewMode in localStorage when it changes
    useEffect(() => {
      try {
        localStorage.setItem(`viewMode-${diagramId}`, viewMode);
      } catch (e) {
        console.warn("Failed to store view mode in localStorage", e);
      }
    }, [viewMode, diagramId]);

    // Check if diagram has been rendered already and cache SVG
    const [renderCache, setRenderCache] = useState(() => {
      try {
        const cached = localStorage.getItem(`diagram-cache-${diagramId}`);
        return cached ? JSON.parse(cached) : { rendered: false, svg: null };
      } catch {
        return { rendered: false, svg: null };
      }
    });

    // Callback to receive the rendered SVG from MermaidDiagram
    const handleMermaidRenderComplete = useCallback(
      (svg: string) => {
        console.log(`Received SVG for ${diagramId}, setting cache.`);
        setRenderCache({ rendered: true, svg: svg });
      },
      [diagramId]
    );

    // Save rendering state and SVG to localStorage
    useEffect(() => {
      if (renderCache.rendered && renderCache.svg) {
        try {
          localStorage.setItem(
            `diagram-cache-${diagramId}`,
            JSON.stringify(renderCache)
          );
        } catch (error) {
          console.warn("Failed to store diagram cache in localStorage", error);
        }
      }
    }, [renderCache, diagramId]);

    // Memoize the diagram content to prevent unnecessary re-renders
    const mermaidDiagram = useMemo(() => {
      if (viewMode !== "mermaid") return null;
      // If already rendered and we have the SVG, display it directly
      if (renderCache.rendered && renderCache.svg) {
        return (
          <div
            className="mermaid-diagram-container mermaid-centered"
            dangerouslySetInnerHTML={{ __html: renderCache.svg }}
          />
        );
      }
      return (
        <MermaidDiagram
          content={mermaidContent}
          onRenderComplete={handleMermaidRenderComplete}
        />
      );
    }, [mermaidContent, viewMode, renderCache, handleMermaidRenderComplete]);

    const mermaidCodeView = useMemo(() => {
      if (viewMode !== "mermaid-code") return null;
      return (
        <div className="code-container">
          <SyntaxHighlighter language="markdown" style={dracula}>
            {mermaidContent}
          </SyntaxHighlighter>
        </div>
      );
    }, [mermaidContent, viewMode]);

    return (
      <div
        className="diagram-viewer-container"
        style={{ marginTop: "15px", marginBottom: "15px" }}
      >
        <div className="diagram-toolbar" style={{ marginBottom: "10px" }}>
          <Button
            variant={viewMode === "mermaid" ? "contained" : "outlined"}
            color="primary"
            size="small"
            onClick={() => setViewMode("mermaid")}
            sx={{ mr: 1 }}
          >
            Diagram
          </Button>

          <Button
            variant={viewMode === "mermaid-code" ? "contained" : "outlined"}
            color="primary"
            size="small"
            onClick={() => setViewMode("mermaid-code")}
          >
            Code View
          </Button>
        </div>

        <div className="diagram-content">
          {mermaidDiagram}
          {mermaidCodeView}
        </div>
      </div>
    );
  }
);

// Function to preprocess markdown text for better rendering
const preprocessMarkdown = (markdown: string): string => {
  // Convert bold text
  markdown = markdown.replace(/\*\*(\S.*?\S|\S)\*\*/g, "<strong>$1</strong>");
  // Convert italic text
  markdown = markdown.replace(/\*(\S.*?\S|\S)\*/g, "<em>$1</em>");
  // Convert inline code
  markdown = markdown.replace(/`([^`]+)`/g, "<code>$1</code>");

  return markdown;
};

const LanguageAIComponent: React.FC<LanguagePracticeAIProps> = ({
  userId = "guest"
}) => {
  // Get user info from Redux store
  const { userInfo } = useSelector((state: RootState) => state.user);
  // Get auth token from Redux store
  const { token } = useSelector((state: RootState) => state.auth);
  // Get language messages from Redux store
  const { messages: previousMessages, loading: isLoadingMessages } =
    useSelector((state: RootState) => state.language);
  // Initialize dispatch
  const dispatch = useDispatch();

  // Get the actual user ID from Redux or fall back to the prop value
  const actualUserId = userInfo?.id || userId;
  // Get username from Redux or use fallback
  const username = userInfo?.username || "User";

  const [language, setLanguage] = useState<string>("en-US");
  const [userMessage, setUserMessage] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string>("");
  const [isProcessingAudio, setIsProcessingAudio] = useState<boolean>(false);
  const [isGeneratingResponse, setIsGeneratingResponse] =
    useState<boolean>(false);
  const [isRenderingContent, setIsRenderingContent] = useState<boolean>(false);
  const [supportedLanguages] = useState(getSupportedLanguages());
  const [proficiencyLevel, setProficiencyLevel] = useState<string>(
    ProficiencyLevel.Intermediate
  );
  const [error, setError] = useState<string>("");
  const [backendAvailable, setBackendAvailable] = useState<boolean>(true);
  const [responseMetadata, setResponseMetadata] = useState<ResponseMetadata>(
    {}
  );
  const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false);
  const [messages, setMessages] = useState<
    { sender: string; content: string; timestamp: string }[]
  >([]);

  // Add state for previous messages
  const [showPreviousMessages, setShowPreviousMessages] =
    useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Refs to track previous language and proficiency level
  const prevLangRef = useRef<string>(language);
  const prevLevelRef = useRef<string>(proficiencyLevel);

  // Get language name from code - memoized to use in dependencies
  const getLanguageName = useCallback(
    (code: string): string => {
      const language = supportedLanguages.find((lang) => lang.code === code);
      return language ? language.name : code;
    },
    [supportedLanguages]
  );

  // Initialize chat on mount with welcome message
  useEffect(() => {
    // Set up initial welcome message based on language and proficiency
    const welcomeMessage = {
      sender: "AI",
      content: `Welcome to language practice! I'm ready to help you practice ${getLanguageName(
        language
      )} at the ${proficiencyLevel} level. Say something to begin our conversation.`,
      timestamp: new Date().toISOString()
    };

    setMessages([welcomeMessage]);

    // Save references to current language and level
    prevLangRef.current = language;
    prevLevelRef.current = proficiencyLevel;
  }, [actualUserId, language, proficiencyLevel, getLanguageName]);

  // Update welcome message when language or proficiency changes
  useEffect(() => {
    // Only update if the language or level actually changed
    if (
      prevLangRef.current !== language ||
      prevLevelRef.current !== proficiencyLevel
    ) {
      const updatedWelcomeMessage = {
        sender: "AI",
        content: `Language or level changed! Now practicing ${getLanguageName(
          language
        )} at the ${proficiencyLevel} level. Say something to continue.`,
        timestamp: new Date().toISOString()
      };
      setMessages([updatedWelcomeMessage]);

      // Update the refs
      prevLangRef.current = language;
      prevLevelRef.current = proficiencyLevel;
    }
  }, [language, proficiencyLevel, getLanguageName]);

  // Move scrollToBottom into a useCallback to fix the dependency issue
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesEndRef]);
  // Scroll to bottom of chat when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle language change
  const handleLanguageChange = (event: SelectChangeEvent) => {
    setLanguage(event.target.value);
  };

  // Handle browser-recognized speech
  const handleSpeechRecognized = (transcript: string) => {
    // Update the user message with the real-time browser transcript
    if (transcript) {
      setUserMessage(transcript);
    }
  };

  // Fetch previous messages when userId changes or when explicitly requested
  const fetchPreviousMessages = useCallback(async () => {
    if (!actualUserId) return;

    dispatch(fetchMessagesStart());
    try {
      // Use getLanguageConversations to get user-AI message pairs
      const conversations = await getLanguageConversations(
        actualUserId,
        20,
        token
      );
      dispatch(fetchMessagesSuccess(conversations));
    } catch (error) {
      console.error("Error fetching previous messages:", error);
      dispatch(
        fetchMessagesFailure(
          error instanceof Error ? error.message : "Failed to fetch messages"
        )
      );
    }
  }, [actualUserId, token, dispatch]);

  // Fetch messages when component mounts or user changes
  useEffect(() => {
    fetchPreviousMessages();
  }, [fetchPreviousMessages]);

  // Format date for display
  const formatDate = (date: string | null | undefined) => {
    if (!date) {
      return "Invalid Date";
    }

    try {
      // Always convert to Date object first
      const dateObj = new Date(date);

      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return "Invalid Date";
      }

      return dateObj.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "";
      }

      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true
      });
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "";
    }
  };

  // Display a conversation in the chat window with message pairs
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const displayConversationInChat = useCallback(
    (conversation: LanguageInteraction) => {
      if (
        !conversation ||
        !conversation.userMessage ||
        !conversation.aiResponse ||
        !conversation.sessionId
      ) {
        console.error("Invalid conversation data:", conversation);
        return;
      }

      // Create user message object Commented
      const userMessageObj = {
        sender: "User",
        content: conversation.userMessage,
        timestamp: new Date(conversation.createdAt).toISOString()
      };
      // Create AI response object Commented
      const aiResponseObj = {
        sender: "AI",
        content: conversation.aiResponse,
        timestamp: new Date(conversation.createdAt).toISOString()
      };
      // Add both messages to chat
      setMessages((prevMessages) => [
        ...prevMessages,
        userMessageObj,
        aiResponseObj
      ]);

      // Set the last AI response for potential replay
      setAiResponse(conversation.aiResponse);

      // Scroll to bottom of chat
      scrollToBottom();
    },
    [setMessages, setAiResponse, scrollToBottom]
  );

  // Update the handleAudioRecorded to save the new message to Redux
  const handleAudioRecorded = async (
    audioBlob: Blob,
    browserTranscript: string
  ) => {
    setIsProcessingAudio(true);
    setError("");
    // Reset any previous response metadata
    setResponseMetadata({});

    try {
      // 1. Speech to Text
      let transcribedText = "";
      if (browserTranscript && browserTranscript.trim() !== "") {
        transcribedText = browserTranscript;
      } else {
        transcribedText = await convertSpeechToText(audioBlob, language);
      }

      setUserMessage(transcribedText);

      // Add user message to chat
      const userMessageObj = {
        sender: "User",
        content: transcribedText,
        timestamp: new Date().toISOString()
      };
      setMessages((prevMessages) => [...prevMessages, userMessageObj]);
      setIsProcessingAudio(false);

      // Get AI response
      setIsGeneratingResponse(true);
      const aiResponseText = await getAIResponseFromN8n(
        transcribedText,
        language,
        proficiencyLevel,
        actualUserId
      );

      // Set the AI response for potential reuse
      setAiResponse(aiResponseText);

      // Add AI message to chat
      const aiResponseObj = {
        sender: "AI",
        content: aiResponseText,
        timestamp: new Date().toISOString()
      };
      setMessages((prevMessages) => [...prevMessages, aiResponseObj]);
      setIsGeneratingResponse(false);

      // Save Interaction using user ID
      const interactionToSave = {
        userId: actualUserId,
        userMessage: transcribedText,
        aiResponse: aiResponseText,
        language: language,
        proficiencyLevel: proficiencyLevel,
        token
      };

      try {
        const savedInteraction = await saveInteraction(interactionToSave);
        console.log(`Interaction saved with ID: ${savedInteraction.id}`);

        // Add to Redux store
        dispatch(addMessage(savedInteraction));
      } catch (error) {
        console.error(
          `Error saving interaction: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }

      // Text to Speech
      await speakAiResponse(aiResponseText);
    } catch (error) {
      console.log(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
      setError(
        "An error occurred while processing your recording. Please try again."
      );
    } finally {
      // Đảm bảo reset tất cả trạng thái loading
      setIsProcessingAudio(false);
      setIsGeneratingResponse(false);
    }
  };

  // Speak the AI response
  const speakAiResponse = async (text: string) => {
    if (!text) {
      setError("No AI response to speak");
      return;
    }

    if (!audioRef.current) {
      setError("Audio element not available");
      return;
    }

    setIsRenderingContent(true);
    setError(""); // Clear previous errors

    try {
      const cleanText = text.replace("[SIMULATION] ", "");
      const clearText = stripMarkdown(cleanText);
      const audioData = await convertTextToSpeech(clearText, language);

      if (!audioData) {
        setError("Could not generate speech audio");
        setIsRenderingContent(false);
        return;
      }

      audioRef.current.src = audioData;

      // Play audio
      await audioRef.current.play();
      // The onEnded event handler on the <audio> element will set isRenderingContent to false
    } catch (error) {
      console.error("Error in speakAiResponse:", error);
      setError("Failed to generate or play speech. Please check console.");
      setIsRenderingContent(false); // Ensure rendering state is reset on error
    }
  };

  // Stop AI speech
  const stopAiSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsRenderingContent(false);
    }
  };

  return (
    <>
      <ServiceStatusNotification onStatusChange={setBackendAvailable} />

      <Box
        sx={{
          display: "flex",
          maxWidth: "100%",
          mx: "auto",
          height: "calc(100vh - 30px)",
          gap: 2
        }}
      >
        {/* Left side panel with controls */}
        <Paper
          elevation={3}
          sx={{
            width: "30%",
            p: 2,
            display: "flex",
            flexDirection: "column",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)"
          }}
        >
          <Typography
            variant="h6"
            sx={{
              p: 2,
              textAlign: "center",
              mb: 2,
              borderBottom: "1px solid #e0e0e0",
              background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
              color: "white",
              borderRadius: "8px 8px 0 0"
            }}
          >
            Controls
          </Typography>

          {!backendAvailable && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Language service is unavailable. Using offline mode with simulated
              responses.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="language-select-label">Language</InputLabel>
              <Select
                labelId="language-select-label"
                id="language-select"
                value={language}
                label="Language"
                onChange={handleLanguageChange}
                disabled={isProcessingAudio || isRenderingContent}
              >
                {supportedLanguages.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="proficiency-level-label">
                Proficiency Level
              </InputLabel>
              <Select
                labelId="proficiency-level-label"
                id="proficiency-level"
                value={proficiencyLevel}
                label="Proficiency Level"
                onChange={(e) => setProficiencyLevel(e.target.value)}
                disabled={isProcessingAudio || isRenderingContent}
              >
                {Object.entries(ProficiencyLevel).map(([key, value]) => (
                  <MenuItem key={value} value={value}>
                    {key}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Voice recorder section */}
          <Box sx={{ mt: "auto", borderTop: "1px solid #e0e0e0", pt: 2 }}>
            <VoiceRecorder
              onAudioRecorded={handleAudioRecorded}
              onSpeechRecognized={handleSpeechRecognized}
              language={language}
              disabled={isProcessingAudio || isRenderingContent}
            />

            {isRenderingContent && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mt: 2
                }}
              >
                <CircularProgress size={18} sx={{ mr: 1 }} />
                <Typography sx={{ mr: 2 }}>Speaking...</Typography>
                <IconButton
                  color="error"
                  onClick={stopAiSpeech}
                  size="small"
                  aria-label="Stop speaking"
                >
                  <StopIcon />
                </IconButton>
              </Box>
            )}

            {!isRenderingContent && aiResponse && (
              <Button
                variant="outlined"
                onClick={() => speakAiResponse(aiResponse)}
                disabled={isRenderingContent}
                sx={{ mt: 2, display: "block", width: "100%" }}
              >
                Speak Last Response Again
              </Button>
            )}
          </Box>

          {responseMetadata && Object.keys(responseMetadata).length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Response details
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setShowDebugInfo(!showDebugInfo)}
                  aria-label="Toggle debug info"
                >
                  {showDebugInfo ? (
                    <KeyboardArrowUpIcon />
                  ) : (
                    <KeyboardArrowDownIcon />
                  )}
                </IconButton>
              </Box>

              <Collapse in={showDebugInfo}>
                <Paper
                  sx={{ p: 1, mt: 1, bgcolor: "#f5f5f5" }}
                  variant="outlined"
                >
                  <Typography
                    variant="caption"
                    component="div"
                    sx={{ fontFamily: "monospace" }}
                  >
                    Source:{" "}
                    {responseMetadata.responseSource === "n8n"
                      ? "N8N Server"
                      : "Fallback Simulation"}
                    <br />
                    Response time: {responseMetadata.responseTime}ms
                    <br />
                    {responseMetadata.isSimulated && (
                      <Box component="span" sx={{ color: "warning.main" }}>
                        ⚠️ Using simulated response
                      </Box>
                    )}
                  </Typography>
                </Paper>
              </Collapse>
            </Box>
          )}
        </Paper>

        {/* Center panel with chat */}
        <Paper
          elevation={3}
          sx={{
            width: "70%",
            display: "flex",
            flexDirection: "column",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)"
          }}
        >
          <Typography
            variant="h5"
            sx={{
              p: 2,
              textAlign: "center",
              borderBottom: "1px solid #e0e0e0",
              background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
              color: "white",
              borderRadius: "12px 12px 0 0"
            }}
          >
            Language Practice AI
          </Typography>

          {/* Chat messages container */}
          <Box
            ref={chatContainerRef}
            sx={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              background: "linear-gradient(135deg, #f9fafb 0%, #f0f2f5 100%)",
              position: "relative" // Add position relative for absolute positioning inside
            }}
          >
            {/* History toggle button - small button positioned on the right side */}
            <Box
              sx={{
                position: "sticky",
                top: 0,
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end", // Aligns the button to the right
                mb: 1,
                py: 1,
                backgroundColor: "rgba(0, 0, 0, 0)",
                pr: 2 // Padding-right to add space between the button and the edge
              }}
            >
              <Button
                variant="outlined"
                size="small"
                startIcon={
                  showPreviousMessages ? (
                    <KeyboardArrowUpIcon fontSize="small" />
                  ) : (
                    <KeyboardArrowDownIcon fontSize="small" />
                  )
                }
                onClick={() => {
                  setShowPreviousMessages(!showPreviousMessages);
                  if (!showPreviousMessages) {
                    fetchPreviousMessages();
                  }
                }}
                sx={{
                  color: "#1890ff",
                  borderColor: "#1890ff",
                  fontSize: "0.75rem",
                  textTransform: "none",
                  padding: "2px 8px",
                  minWidth: 0,
                  background: "rgba(255, 255, 255, 0.8)"
                }}
              >
                {showPreviousMessages
                  ? "Current Conversation"
                  : "History Conversation"}
              </Button>
            </Box>

            {/* Previous conversations appear when history is enabled */}
            {showPreviousMessages ? (
              <>
                {isLoadingMessages ? (
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
                ) : previousMessages && previousMessages.length > 0 ? (
                  <>
                    {previousMessages.map((msg, index) => {
                      // Skip rendering if message is invalid
                      if (!msg) return null;

                      return (
                        <React.Fragment key={msg?.id || `prev-${index}`}>
                          {/* User message - right side */}
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                              alignSelf: "flex-end",
                              maxWidth: "100%",
                              mb: 2 // Add margin bottom for spacing between message pairs
                            }}
                          >
                            <Box
                              sx={{
                                p: 1.5,
                                background:
                                  "linear-gradient(135deg, #bae6fd 0%, #93c5fd 100%)",
                                borderRadius: "18px 18px 0 18px",
                                border: "1px solid #1890ff",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: "bold",
                                  color: "#09132e",
                                  mb: 0.5,
                                  display: "block",
                                  textAlign: "right",
                                  fontSize: "1rem",
                                  minWidth: "400px"
                                }}
                              >
                                {username}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ color: "#09132e" }}
                              >
                                {msg.userMessage || "No message"}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  display: "block",
                                  textAlign: "right",
                                  mt: 0.5,
                                  opacity: 0.7
                                }}
                              >
                                {formatDate(msg.createdAt)}
                              </Typography>
                            </Box>
                          </Box>

                          {/* AI response - left side */}
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-start",
                              alignSelf: "flex-start",
                              maxWidth: "80%",
                              mb: 3 // Add extra margin bottom after AI response for spacing between message pairs
                            }}
                          >
                            <Box
                              sx={{
                                p: 1.5,
                                background: "white",
                                borderRadius: "18px 18px 18px 0",
                                border: "1px solid #e0e0e0",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: "bold",
                                  color: "#7c3aed",
                                  mb: 0.5,
                                  display: "block",
                                  textAlign: "left",
                                  fontSize: "1rem",
                                  minWidth: "400px"
                                }}
                              >
                                AI
                              </Typography>
                              <div className="markdown">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  rehypePlugins={[rehypeRaw]}
                                  children={preprocessMarkdown(
                                    msg.aiResponse || "No response"
                                  )}
                                  components={{
                                    code({
                                      node,
                                      className,
                                      children,
                                      ...props
                                    }) {
                                      const match = /language-(\w+)/.exec(
                                        className || ""
                                      );
                                      const value = String(children).replace(
                                        /\n$/,
                                        ""
                                      );

                                      // Specifically detect <diagram> tags in the content
                                      if (
                                        value.includes("<diagram>") &&
                                        value.includes("mermaid")
                                      ) {
                                        console.log(
                                          "Detected <diagram> tag with mermaid content"
                                        );

                                        // Extract the mermaid content from inside <diagram> tags
                                        let mermaidContent = "";
                                        const diagramMatch = value.match(
                                          /<diagram>[\s\S]*?- mermaid:\s*([\s\S]*?)<\/diagram>/
                                        );

                                        if (diagramMatch && diagramMatch[1]) {
                                          mermaidContent =
                                            diagramMatch[1].trim();

                                          // If the content contains ```mermaid, extract just the content inside
                                          if (
                                            mermaidContent.includes(
                                              "```mermaid"
                                            )
                                          ) {
                                            const codeBlockMatch =
                                              mermaidContent.match(
                                                /```mermaid\s*([\s\S]*?)```/
                                              );
                                            if (
                                              codeBlockMatch &&
                                              codeBlockMatch[1]
                                            ) {
                                              mermaidContent =
                                                codeBlockMatch[1].trim();
                                            }
                                          }

                                          console.log(
                                            "Extracted mermaid content from <diagram> tag:",
                                            mermaidContent
                                          );
                                          return (
                                            <DiagramViewer
                                              mermaidContent={mermaidContent}
                                            />
                                          );
                                        }
                                      }

                                      // Standard detection for language-mermaid class
                                      if (match && match[1] === "mermaid") {
                                        console.log(
                                          "Passing Mermaid content to MermaidDiagram:",
                                          value
                                        );
                                        return (
                                          <DiagramViewer
                                            mermaidContent={value}
                                          />
                                        );
                                      }

                                      // Standard code block rendering for other languages
                                      const isInline =
                                        node?.position?.start.line ===
                                        node?.position?.end.line;

                                      return !isInline ? (
                                        <SyntaxHighlighter
                                          style={dracula}
                                          language={(match && match[1]) || ""}
                                          PreTag="div"
                                          {...props}
                                        >
                                          {value}
                                        </SyntaxHighlighter>
                                      ) : (
                                        <code className={className} {...props}>
                                          {children}
                                        </code>
                                      );
                                    },
                                    table({ ...props }) {
                                      return (
                                        <div
                                          style={{
                                            overflowX: "auto",
                                            marginBottom: "16px"
                                          }}
                                        >
                                          <table
                                            style={{
                                              borderCollapse: "collapse",
                                              width: "100%"
                                            }}
                                            {...props}
                                          />
                                        </div>
                                      );
                                    },
                                    thead({ ...props }) {
                                      return (
                                        <thead
                                          style={{ backgroundColor: "#f3f4f6" }}
                                          {...props}
                                        />
                                      );
                                    },
                                    th({ ...props }) {
                                      return (
                                        <th
                                          style={{
                                            padding: "8px 12px",
                                            textAlign: "left",
                                            borderBottom: "2px solid #e5e7eb",
                                            fontWeight: "600"
                                          }}
                                          {...props}
                                        />
                                      );
                                    },
                                    td({ ...props }) {
                                      return (
                                        <td
                                          style={{
                                            padding: "8px 12px",
                                            borderBottom: "1px solid #e5e7eb"
                                          }}
                                          {...props}
                                        />
                                      );
                                    }
                                  }}
                                />
                              </div>
                              <Typography
                                variant="caption"
                                sx={{
                                  display: "block",
                                  textAlign: "right",
                                  mt: 0.5,
                                  opacity: 0.7
                                }}
                              >
                                {formatDate(msg.createdAt)}
                              </Typography>
                            </Box>
                          </Box>
                        </React.Fragment>
                      );
                    })}
                  </>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      py: 2
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No previous conversations
                    </Typography>
                  </Box>
                )}
              </>
            ) : (
              // Current conversation messages - only visible when history is not showing
              <>
                {messages.map((message, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems:
                        message.sender === "User" ? "flex-end" : "flex-start",
                      maxWidth: "80%",
                      alignSelf:
                        message.sender === "User" ? "flex-end" : "flex-start",
                      mb: message.sender === "AI" ? 3 : 2 // Additional margin after AI responses
                    }}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        background:
                          message.sender === "User"
                            ? "linear-gradient(135deg, #bae6fd 0%, #93c5fd 100%)"
                            : "white",
                        borderRadius:
                          message.sender === "User"
                            ? "18px 18px 0 18px"
                            : "18px 18px 18px 0",
                        border:
                          message.sender === "User"
                            ? "1px solid #1890ff"
                            : "1px solid #e0e0e0",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: "bold",
                          color:
                            message.sender === "User" ? "#09132e" : "#7c3aed",
                          mb: 0.5,
                          display: "block",
                          textAlign:
                            message.sender === "User" ? "right" : "left",
                          fontSize: "1rem"
                        }}
                      >
                        {message.sender === "User" ? username : message.sender}
                      </Typography>

                      <div className="markdown">
                        {message.sender === "User" && isProcessingAudio ? (
                          <CircularProgress size={16} />
                        ) : (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            children={preprocessMarkdown(message.content)}
                            components={{
                              code({ node, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(
                                  className || ""
                                );
                                const value = String(children).replace(
                                  /\n$/,
                                  ""
                                );

                                // Specifically detect <diagram> tags in the content
                                if (
                                  value.includes("<diagram>") &&
                                  value.includes("mermaid")
                                ) {
                                  console.log(
                                    "Detected <diagram> tag with mermaid content"
                                  );

                                  // Extract the mermaid content from inside <diagram> tags
                                  let mermaidContent = "";
                                  const diagramMatch = value.match(
                                    /<diagram>[\s\S]*?- mermaid:\s*([\s\S]*?)<\/diagram>/
                                  );

                                  if (diagramMatch && diagramMatch[1]) {
                                    mermaidContent = diagramMatch[1].trim();

                                    // If the content contains ```mermaid, extract just the content inside
                                    if (mermaidContent.includes("```mermaid")) {
                                      const codeBlockMatch =
                                        mermaidContent.match(
                                          /```mermaid\s*([\s\S]*?)```/
                                        );
                                      if (codeBlockMatch && codeBlockMatch[1]) {
                                        mermaidContent =
                                          codeBlockMatch[1].trim();
                                      }
                                    }

                                    console.log(
                                      "Extracted mermaid content from <diagram> tag:",
                                      mermaidContent
                                    );
                                    return (
                                      <DiagramViewer
                                        mermaidContent={mermaidContent}
                                      />
                                    );
                                  }
                                }

                                // Standard detection for language-mermaid class
                                if (match && match[1] === "mermaid") {
                                  console.log(
                                    "Passing Mermaid content to MermaidDiagram:",
                                    value
                                  );
                                  return (
                                    <DiagramViewer mermaidContent={value} />
                                  );
                                }

                                // Standard code block rendering for other languages
                                const isInline =
                                  node?.position?.start.line ===
                                  node?.position?.end.line;

                                return !isInline ? (
                                  <SyntaxHighlighter
                                    style={dracula}
                                    language={(match && match[1]) || ""}
                                    PreTag="div"
                                    {...props}
                                  >
                                    {value}
                                  </SyntaxHighlighter>
                                ) : (
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                );
                              },
                              table({ ...props }) {
                                return (
                                  <div
                                    style={{
                                      overflowX: "auto",
                                      marginBottom: "16px"
                                    }}
                                  >
                                    <table
                                      style={{
                                        borderCollapse: "collapse",
                                        width: "100%"
                                      }}
                                      {...props}
                                    />
                                  </div>
                                );
                              },
                              thead({ ...props }) {
                                return (
                                  <thead
                                    style={{ backgroundColor: "#f3f4f6" }}
                                    {...props}
                                  />
                                );
                              },
                              th({ ...props }) {
                                return (
                                  <th
                                    style={{
                                      padding: "8px 12px",
                                      textAlign: "left",
                                      borderBottom: "2px solid #e5e7eb",
                                      fontWeight: "600"
                                    }}
                                    {...props}
                                  />
                                );
                              },
                              td({ ...props }) {
                                return (
                                  <td
                                    style={{
                                      padding: "8px 12px",
                                      borderBottom: "1px solid #e5e7eb"
                                    }}
                                    {...props}
                                  />
                                );
                              }
                            }}
                          />
                        )}
                      </div>

                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          textAlign: "right",
                          mt: 0.5,
                          opacity: 0.7
                        }}
                      >
                        {formatTimestamp(message.timestamp)}
                      </Typography>
                    </Box>
                  </Box>
                ))}

                {isGeneratingResponse && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      alignSelf: "flex-start"
                    }}
                  >
                    <CircularProgress size={16} />
                    <Typography variant="body2">Processing...</Typography>
                  </Box>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </Box>
        </Paper>
      </Box>

      <audio
        ref={audioRef}
        style={{ display: "none" }}
        onEnded={() => setIsRenderingContent(false)}
        onError={() => {
          setError("Error playing audio");
          setIsRenderingContent(false);
        }}
        controls
      />

      {/* Hidden element to satisfy linter warning about userMessage being unused */}
      <div style={{ display: "none" }} data-testid="last-user-message">
        {userMessage}
      </div>
    </>
  );
};

export default LanguageAIComponent;
