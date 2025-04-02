import React, { useState, useRef, useEffect } from "react";
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
  getAIResponseFromN8n
} from "../services/LanguageService";

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

const LanguagePracticeAI: React.FC<LanguagePracticeAIProps> = ({
  userId = "guest"
}) => {
  const [language, setLanguage] = useState<string>("en-US");
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

  const audioRef = useRef<HTMLAudioElement | null>(null);

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
      } catch (err) {
        console.error("Error initializing session:", err);
        setError("Failed to initialize language session. Please try again.");
        setCurrentSessionId(""); // Reset session ID on error
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, [language, proficiencyLevel, userId]);

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

      setAiResponse(aiResponseText);

      // 3. Save Interaction (using fields from LanguageInteraction model)
      console.log(
        `🔍 [STEP 3] Saving interaction with sessionId: ${currentSessionId}`
      );
      const savedInteraction = await saveInteraction({
        sessionId: currentSessionId,
        userMessage: transcribedText,
        aiResponse: aiResponseText
      });
      console.log(
        `✅ [STEP 3] Interaction saved with ID: ${savedInteraction.id}`
      );

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
      const audioData = await convertTextToSpeech(text, language);

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

  return (
    <>
      <ServiceStatusNotification onStatusChange={setBackendAvailable} />

      <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: "auto", mt: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Language Practice AI
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

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="language-select-label">Language</InputLabel>
          <Select
            labelId="language-select-label"
            id="language-select"
            value={language}
            label="Language"
            onChange={handleLanguageChange}
            disabled={isLoading || isSpeaking} // Disable while loading/speaking
          >
            {supportedLanguages.map((lang) => (
              <MenuItem key={lang.code} value={lang.code}>
                {lang.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="proficiency-level-label">
            Proficiency Level
          </InputLabel>
          <Select
            labelId="proficiency-level-label"
            id="proficiency-level"
            value={proficiencyLevel}
            label="Proficiency Level"
            onChange={(e) => setProficiencyLevel(e.target.value)}
            disabled={isLoading || isSpeaking} // Disable while loading/speaking
          >
            {Object.entries(ProficiencyLevel).map(([key, value]) => (
              <MenuItem key={value} value={value}>
                {key}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <VoiceRecorder
          onAudioRecorded={handleAudioRecorded}
          onSpeechRecognized={handleSpeechRecognized}
          language={language}
          disabled={isLoading || isSpeaking}
        />

        {userMessage && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              You said:
            </Typography>
            <Typography paragraph>{userMessage}</Typography>
          </Box>
        )}

        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {aiResponse && !isLoading && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              AI Response:
            </Typography>
            <Typography paragraph>
              {/* Remove [SIMULATION] prefix for cleaner display */}
              {aiResponse.replace("[SIMULATION] ", "")}
            </Typography>

            <Button
              variant="outlined"
              onClick={() => speakAiResponse(aiResponse)}
              disabled={isSpeaking}
              sx={{ mt: 1 }}
            >
              {isSpeaking ? "Speaking..." : "Speak Response"}
            </Button>

            {responseMetadata && (
              <>
                <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
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
              </>
            )}
          </Box>
        )}

        <audio
          ref={audioRef}
          style={{ display: "none" }}
          onEnded={() => setIsSpeaking(false)} // Reset speaking state when audio finishes
          onError={() => {
            setError("Error playing audio");
            setIsSpeaking(false);
          }}
          controls
        />
      </Paper>
    </>
  );
};

export default LanguagePracticeAI;
