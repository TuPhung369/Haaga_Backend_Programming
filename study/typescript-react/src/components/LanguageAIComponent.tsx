import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
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
  getAIResponseFromN8n
} from "../services/LanguageService";
import ReactMarkdown from "react-markdown";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeRaw from "rehype-raw";
import { stripMarkdown } from "../utils/TextUtils";

// Define Redux store state interface
interface RootState {
  user: {
    userInfo: {
      id: string;
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

  // Get the actual user ID from Redux or fall back to the prop value
  const actualUserId = userInfo?.id || userId;

  const [language, setLanguage] = useState<string>("en-US");
  const [userMessage, setUserMessage] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
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

  // Scroll to bottom of chat when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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

  // Process audio recording
  const handleAudioRecorded = async (
    audioBlob: Blob,
    browserTranscript: string
  ) => {
    setIsLoading(true);
    setError("");
    // Reset any previous response metadata
    setResponseMetadata({});

    try {
      // 1. Speech to Text - Use browser transcript if available
      let transcribedText = "";

      if (browserTranscript && browserTranscript.trim() !== "") {
        // Use browser's real-time transcript if available
        transcribedText = browserTranscript;
      } else {
        // Fallback to server-side transcription
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

      // 2. Get AI Response FROM N8N

      // Call N8N with timing
      const startTime = performance.now();
      const aiResponseText = await getAIResponseFromN8n(
        transcribedText,
        language,
        proficiencyLevel,
        actualUserId // Use user ID instead of session ID
      );
      const endTime = performance.now();
      const responseTimeMs = Math.round(endTime - startTime);

      // Update response metadata
      setResponseMetadata({
        responseTime: responseTimeMs,
        responseSource: aiResponseText.includes("[SIMULATION]")
          ? "fallback"
          : "n8n",
        isSimulated: aiResponseText.includes("[SIMULATION]")
      });

      const cleanResponse = aiResponseText.replace("[SIMULATION] ", "");
      setAiResponse(cleanResponse);

      // Add AI response to chat
      const aiResponseObj = {
        sender: "AI",
        content: cleanResponse,
        timestamp: new Date().toISOString()
      };
      setMessages((prevMessages) => [...prevMessages, aiResponseObj]);

      // 3. Save Interaction using user ID

      // Proceed with saving the interaction - simplified to use userId directly
      const interactionToSave = {
        userId: actualUserId, // Use user ID as primary identifier
        userMessage: transcribedText,
        aiResponse: aiResponseText,
        language: language, // Include language for the database
        proficiencyLevel: proficiencyLevel, // Include proficiency level for the database
        token // Pass the token directly to the function
      };

      try {
        const savedInteraction = await saveInteraction(interactionToSave);
        console.log(`Interaction saved with ID: ${savedInteraction.id}`);
      } catch (error) {
        console.error(
          `Error saving interaction: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }

      // 4. Text to Speech
      await speakAiResponse(aiResponseText);
    } catch (error) {
      console.log(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
      setError(
        "An error occurred while processing your recording. Please try again."
      );
    } finally {
      setIsLoading(false);
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

    setIsSpeaking(true);
    setError(""); // Clear previous errors

    try {
      const cleanText = text.replace("[SIMULATION] ", "");
      const clearText = stripMarkdown(cleanText);
      const audioData = await convertTextToSpeech(clearText, language);

      if (!audioData) {
        setError("Could not generate speech audio");
        setIsSpeaking(false);
        return;
      }

      audioRef.current.src = audioData;

      // Play audio
      await audioRef.current.play();
      // The onEnded event handler on the <audio> element will set isSpeaking to false
    } catch (error) {
      console.error("Error in speakAiResponse:", error);
      setError("Failed to generate or play speech. Please check console.");
      setIsSpeaking(false); // Ensure speaking state is reset on error
    }
  };

  // Stop AI speech
  const stopAiSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true
    });
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
                disabled={isLoading || isSpeaking}
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
                disabled={isLoading || isSpeaking}
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
              disabled={isLoading || isSpeaking}
            />

            {isSpeaking && (
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

            {!isSpeaking && aiResponse && (
              <Button
                variant="outlined"
                onClick={() => speakAiResponse(aiResponse)}
                disabled={isSpeaking}
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

        {/* Right side panel with chat */}
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
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              background: "linear-gradient(135deg, #f9fafb 0%, #f0f2f5 100%)"
            }}
          >
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
                    message.sender === "User" ? "flex-end" : "flex-start"
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    background:
                      message.sender === "User"
                        ? "linear-gradient(135deg, #bae6fd 0%, #93c5fd 100%)"
                        : "linear-gradient(45deg, #ffffff 0%, #f5f5f5 100%)",
                    borderRadius:
                      message.sender === "User"
                        ? "18px 18px 0 18px"
                        : "18px 18px 18px 0",
                    color: message.sender === "User" ? "#1e293b" : "#1e293b",
                    border:
                      message.sender === "User"
                        ? "1px solid #1890ff"
                        : "1px solid #e0e0e0"
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: "bold",
                      color: message.sender === "User" ? "#09132e" : "#7c3aed",
                      mb: 1
                    }}
                  >
                    {message.sender}
                  </Typography>

                  <div className="markdown">
                    <ReactMarkdown
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        code: ({ className, children, ...props }) => {
                          const match = /language-(\w+)/.exec(className || "");
                          return match ? (
                            <SyntaxHighlighter
                              language={match[1]}
                              style={dracula}
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
                      {preprocessMarkdown(message.content)}
                    </ReactMarkdown>
                  </div>

                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      textAlign: "right",
                      mt: 1,
                      opacity: 0.7
                    }}
                  >
                    {formatTimestamp(message.timestamp)}
                  </Typography>
                </Paper>
              </Box>
            ))}
            {isLoading && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  alignSelf: "flex-start"
                }}
              >
                <CircularProgress size={20} />
                <Typography>Processing...</Typography>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>
        </Paper>
      </Box>

      <audio
        ref={audioRef}
        style={{ display: "none" }}
        onEnded={() => setIsSpeaking(false)}
        onError={() => {
          setError("Error playing audio");
          setIsSpeaking(false);
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
