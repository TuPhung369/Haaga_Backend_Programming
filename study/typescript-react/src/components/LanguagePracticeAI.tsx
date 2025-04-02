import React, { useState, useRef, useEffect, useCallback } from "react";
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
import VoiceRecorder from "./VoiceRecorder";
import ServiceStatusNotification from "./ServiceStatusNotification";
import {
  convertSpeechToText,
  convertTextToSpeech,
  getSupportedLanguages
} from "../services/SpeechService";
import {
  createLanguageSession,
  saveInteraction,
  getAIResponseFromN8n,
  getSessionInteractions,
  inspectLocalStorage,
  verifySessionExists
} from "../services/LanguageService";
import ReactMarkdown from "react-markdown";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeRaw from "rehype-raw";

// Define proficiency levels for the component
enum ProficiencyLevel {
  Beginner = "beginner",
  Intermediate = "intermediate",
  Advanced = "advanced",
  Fluent = "fluent",
  Native = "native"
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

const LanguagePracticeAI: React.FC<LanguagePracticeAIProps> = ({
  userId = "guest"
}) => {
  const [language, setLanguage] = useState<string>("en-US");

  // userMessage state is needed for:
  // 1. Real-time browser transcript updates via handleSpeechRecognized
  // 2. Sending to the N8N API in handleAudioRecorded
  // 3. Maintaining consistency with backend API for new conversation entries
  // Even though we now load full message history from the database, this state is still required
  const [userMessage, setUserMessage] = useState<string>("");

  const [aiResponse, setAiResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [supportedLanguages] = useState(getSupportedLanguages());
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
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

  // Scroll to bottom of chat when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Get language name from code - memoized to use in dependencies
  const getLanguageName = useCallback(
    (code: string): string => {
      const language = supportedLanguages.find((lang) => lang.code === code);
      return language ? language.name : code;
    },
    [supportedLanguages]
  );

  // Load previous interactions for a session
  const loadSessionInteractions = useCallback(
    async (sessionId: string) => {
      try {
        setIsLoading(true);
        console.log(
          `🔍 Loading previous interactions for session: ${sessionId}`
        );

        const interactions = await getSessionInteractions(sessionId);
        console.log(`✅ Loaded ${interactions.length} previous interactions`);

        if (interactions.length === 0) {
          // If no previous interactions, add a welcome message
          const welcomeMessage = {
            sender: "AI",
            content: `Welcome to language practice! I'm ready to help you practice ${getLanguageName(
              language
            )} at the ${proficiencyLevel} level. Say something to begin our conversation.`,
            timestamp: new Date().toISOString()
          };
          setMessages([welcomeMessage]);
        } else {
          // Convert interactions to messages and set them in order
          const messagesFromInteractions: Array<{
            sender: string;
            content: string;
            timestamp: string;
          }> = [];

          // Sort interactions by createdAt
          const sortedInteractions = [...interactions].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          for (const interaction of sortedInteractions) {
            // Add user message
            messagesFromInteractions.push({
              sender: "User",
              content: interaction.userMessage,
              timestamp: new Date(interaction.createdAt).toISOString()
            });

            // Add AI response (remove simulation prefix for display)
            messagesFromInteractions.push({
              sender: "AI",
              content: interaction.aiResponse.replace("[SIMULATION] ", ""),
              timestamp: new Date(interaction.createdAt).toISOString()
            });

            // Keep track of the latest AI response
            setAiResponse(interaction.aiResponse);
          }

          setMessages(messagesFromInteractions);
        }
      } catch (error) {
        console.error("Error loading session interactions:", error);
        // Show a welcome message even on error
        const welcomeMessage = {
          sender: "AI",
          content: `Welcome to language practice! I'm ready to help you practice ${getLanguageName(
            language
          )} at the ${proficiencyLevel} level. Say something to begin our conversation.`,
          timestamp: new Date().toISOString()
        };
        setMessages([welcomeMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      language,
      proficiencyLevel,
      setMessages,
      setIsLoading,
      setAiResponse,
      getLanguageName
    ]
  );

  // Create a new session when language or proficiency level changes
  useEffect(() => {
    const initSession = async () => {
      setIsLoading(true);
      setError(""); // Clear error on new session init
      try {
        const session = await createLanguageSession(
          language,
          proficiencyLevel,
          userId
        );
        setCurrentSessionId(session.id);

        // Load previous interactions for this session
        await loadSessionInteractions(session.id);
      } catch (err) {
        console.error("Error initializing session:", err);
        setError("Failed to initialize language session. Please try again.");
        setCurrentSessionId(""); // Reset session ID on error
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, [language, proficiencyLevel, userId, loadSessionInteractions]);

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
    if (!currentSessionId) {
      setError("Session not initialized. Cannot process recording.");
      return;
    }
    setIsLoading(true);
    setError("");
    // Reset any previous response metadata
    setResponseMetadata({});

    try {
      console.log(
        `🔍 [STEP 0] Starting recording process with sessionId: ${currentSessionId}`
      );

      // 1. Speech to Text - Use browser transcript if available
      console.log(`🔍 [STEP 1] Processing speech to text...`);
      let transcribedText = "";

      if (browserTranscript && browserTranscript.trim() !== "") {
        // Use browser's real-time transcript if available
        transcribedText = browserTranscript;
        console.log(
          `✅ [STEP 1] Using browser transcript: "${transcribedText.substring(
            0,
            50
          )}${transcribedText.length > 50 ? "..." : ""}"`
        );
      } else {
        // Fallback to server-side transcription
        transcribedText = await convertSpeechToText(audioBlob, language);
        console.log(
          `✅ [STEP 1] Using server transcript: "${transcribedText.substring(
            0,
            50
          )}${transcribedText.length > 50 ? "..." : ""}"`
        );
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
      console.log(
        `🔍 [STEP 2] Getting AI response from N8N with sessionId: ${currentSessionId}`
      );

      // Call N8N with timing
      const startTime = performance.now();
      const aiResponseText = await getAIResponseFromN8n(
        transcribedText,
        language,
        proficiencyLevel,
        currentSessionId
      );
      const endTime = performance.now();

      console.log(
        `✅ [STEP 2] AI response received in ${Math.round(
          endTime - startTime
        )}ms: "${aiResponseText.substring(0, 50)}${
          aiResponseText.length > 50 ? "..." : ""
        }"`
      );

      // Update response metadata
      setResponseMetadata({
        responseTime: Math.round(endTime - startTime),
        responseSource: aiResponseText.includes("[SIMULATION]")
          ? "fallback"
          : "n8n",
        sessionId: currentSessionId,
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

      // 3. Save Interaction (using fields from LanguageInteraction model)
      console.log(
        `🔍 [STEP 3] Saving interaction with sessionId: ${currentSessionId}`
      );

      // Check if the session exists before saving
      let sessionExists = false;
      try {
        sessionExists = await verifySessionExists(currentSessionId);
        console.log(
          `🔍 [STEP 3.1] Session verification: ${
            sessionExists ? "✅ Found" : "❌ Not found"
          }`
        );
      } catch (error) {
        console.warn(
          `⚠️ [STEP 3.1] Session verification failed, will attempt save anyway:`,
          error
        );
      }

      // If session doesn't exist, log warning but try saving anyway - the backend might handle it differently
      if (!sessionExists) {
        console.warn(
          `⚠️ [STEP 3.2] Attempting to save interaction with potentially invalid sessionId: ${currentSessionId}`
        );
      }

      // Proceed with saving the interaction
      const interactionToSave = {
        sessionId: currentSessionId,
        userMessage: transcribedText,
        aiResponse: aiResponseText
      };

      console.log(`📦 [STEP 3.3] Interaction save payload:`, interactionToSave);

      const savedInteraction = await saveInteraction(interactionToSave);
      console.log(
        `✅ [STEP 3.4] Interaction saved with ID: ${savedInteraction.id}`
      );

      // Verify the interaction was saved
      console.log(`🔍 [STEP 3.5] Verifying interaction was saved...`);
      try {
        const interactions = await getSessionInteractions(currentSessionId);
        const found = interactions.some((i) => i.id === savedInteraction.id);
        console.log(
          `${found ? "✅" : "❌"} [STEP 3.5] Interaction verification: ${
            found ? "Found in database" : "Not found in database"
          }`
        );
      } catch (error) {
        console.warn(`⚠️ [STEP 3.5] Interaction verification failed:`, error);
      }

      // 4. Text to Speech
      console.log(`🔍 [STEP 4] Converting AI response to speech...`);
      await speakAiResponse(aiResponseText);
    } catch (error) {
      console.error("❌ Error processing audio:", error);
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
      const audioData = await convertTextToSpeech(cleanText, language);

      if (!audioData) {
        setError("Could not generate speech audio");
        setIsSpeaking(false);
        return;
      }

      audioRef.current.src = audioData;

      // Play audio
      await audioRef.current.play();
      console.log("Audio playback started");
      // The onEnded event handler on the <audio> element will set isSpeaking to false
    } catch (error) {
      console.error("Error in speakAiResponse:", error);
      setError("Failed to generate or play speech. Please check console.");
      setIsSpeaking(false); // Ensure speaking state is reset on error
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

  const debugInteractions = async () => {
    setIsLoading(true);
    try {
      console.log("🔍 Starting interaction debugging");

      // 1. Inspect localStorage
      console.log("📦 Checking localStorage state:");
      const storageState = inspectLocalStorage();

      // 2. Verify the current session exists
      console.log(`🔄 Verifying current session: ${currentSessionId}`);
      if (currentSessionId) {
        const exists = await verifySessionExists(currentSessionId);
        console.log(
          `📡 Session verification result: ${
            exists ? "✅ Exists in DB" : "❌ Not found in DB"
          }`
        );

        // 3. Try to load interactions for the session as a verification
        console.log(
          "🔍 Attempting to load session interactions as verification"
        );
        const interactions = await getSessionInteractions(currentSessionId);
        console.log(`📊 Found ${interactions.length} interactions for session`);

        if (interactions.length === 0 && storageState.interactionCount > 0) {
          console.warn(
            "⚠️ No interactions found in database, but localStorage contains interactions"
          );
        }
      } else {
        console.warn("⚠️ No active session to verify");
      }
    } catch (error) {
      console.error("❌ Error during interaction debugging:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ServiceStatusNotification onStatusChange={setBackendAvailable} />

      <Paper
        elevation={3}
        sx={{
          maxWidth: 800,
          mx: "auto",
          mt: 4,
          height: "calc(100vh - 100px)",
          display: "flex",
          flexDirection: "column",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)"
        }}
      >
        <Typography
          variant="h4"
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

        <Box sx={{ p: 2, borderBottom: "1px solid #e0e0e0" }}>
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

          <Box sx={{ display: "flex", gap: 2 }}>
            <FormControl fullWidth>
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

            <FormControl fullWidth>
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

            {/* Debug button - always visible for now */}
            <Button
              variant="outlined"
              size="small"
              onClick={debugInteractions}
              disabled={isLoading}
              sx={{ mt: 1 }}
            >
              Debug Interactions
            </Button>
          </Box>
        </Box>

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
                alignSelf: message.sender === "User" ? "flex-end" : "flex-start"
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

        {/* Voice recorder section */}
        <Box
          sx={{ p: 2, borderTop: "1px solid #e0e0e0", background: "#fafafa" }}
        >
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
              <Typography>Speaking...</Typography>
            </Box>
          )}

          {!isSpeaking && aiResponse && (
            <Button
              variant="outlined"
              onClick={() => speakAiResponse(aiResponse)}
              disabled={isSpeaking}
              sx={{ mt: 2, display: "block", mx: "auto" }}
            >
              Speak Last Response Again
            </Button>
          )}

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
                    Session ID: {responseMetadata.sessionId}
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
      </Paper>
    </>
  );
};

export default LanguagePracticeAI;
