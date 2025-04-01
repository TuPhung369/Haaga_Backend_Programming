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
  Alert
} from "@mui/material";
import VoiceRecorder from "./VoiceRecorder";
import {
  convertSpeechToText,
  convertTextToSpeech,
  getSupportedLanguages
} from "../services/SpeechService";
import {
  createLanguageSession,
  saveLanguageInteraction,
  getUserLanguageProficiency
} from "../services/LanguageAIService";
import {
  UserLanguageProficiency,
  ProficiencyLevel
} from "../models/LanguageAI";

interface LanguagePracticeAIProps {
  aiEndpoint?: string; // Optional endpoint for the AI service
  userId?: string; // Optional user ID for authenticated users
}

const LanguagePracticeAI: React.FC<LanguagePracticeAIProps> = ({
  aiEndpoint = "/api/ai-response",
  userId = "guest" // Default to guest if no user ID provided
}) => {
  const [language, setLanguage] = useState<string>("en-US");
  const [userMessage, setUserMessage] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [supportedLanguages] = useState(getSupportedLanguages());
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [proficiency, setProficiency] =
    useState<UserLanguageProficiency | null>(null);
  const [error, setError] = useState<string>("");

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create a new session when language changes
  useEffect(() => {
    const initSession = async () => {
      try {
        const session = await createLanguageSession(userId, language);
        setCurrentSessionId(session.id);

        // Get user proficiency in this language
        const userProficiency = await getUserLanguageProficiency(
          userId,
          language
        );
        setProficiency(userProficiency);
      } catch (err) {
        console.error("Error initializing session:", err);
        setError("Failed to initialize language session. Please try again.");
      }
    };

    initSession();
  }, [language, userId]);

  // Handle language change
  const handleLanguageChange = (event: SelectChangeEvent) => {
    setLanguage(event.target.value);
  };

  // Process audio recording
  const handleAudioRecorded = async (audioBlob: Blob) => {
    try {
      setIsLoading(true);
      setError("");

      // Convert speech to text
      const transcribedText = await convertSpeechToText(audioBlob, language);
      setUserMessage(transcribedText);

      // Send text to AI and get response
      const aiResponseText = await getAiResponse(transcribedText);
      setAiResponse(aiResponseText);

      // Save the interaction
      if (currentSessionId) {
        // Create URL for the audio blob for playback
        const audioUrl = URL.createObjectURL(audioBlob);

        await saveLanguageInteraction(
          currentSessionId,
          transcribedText,
          aiResponseText,
          audioUrl
        );
      }

      // Convert AI response to speech
      await speakAiResponse(aiResponseText);

      setIsLoading(false);
    } catch (error) {
      console.error("Error processing audio:", error);
      setIsLoading(false);
      setError(
        "An error occurred while processing your recording. Please try again."
      );
    }
  };

  // Get response from AI
  const getAiResponse = async (message: string): Promise<string> => {
    try {
      // In a real implementation, send the message to your AI endpoint
      const response = await fetch(aiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          language,
          userId,
          proficiencyLevel: proficiency?.level || ProficiencyLevel.Beginner
        })
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error("Error getting AI response:", error);

      // For development, return mock responses
      return "This is a simulated AI response. In a real application, this would come from your AI service. How can I help you practice your language skills today?";
    }
  };

  // Speak the AI response
  const speakAiResponse = async (text: string) => {
    try {
      setIsAiSpeaking(true);
      const audioUrl = await convertTextToSpeech(text, language);

      if (audioUrl) {
        // If we got a URL back, play it
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
        }
      }

      setIsAiSpeaking(false);
    } catch (error) {
      console.error("Error speaking AI response:", error);
      setIsAiSpeaking(false);
    }
  };

  // Display proficiency level if available
  const renderProficiencyInfo = () => {
    if (!proficiency) return null;

    return (
      <Box
        sx={{
          mt: 2,
          mb: 2,
          p: 2,
          bgcolor: "background.paper",
          borderRadius: 1
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold">
          Your {getSupportedLanguages().find((l) => l.code === language)?.name}{" "}
          Level: {proficiency.level}
        </Typography>
        {proficiency.strengths.length > 0 && (
          <Typography variant="body2">
            <strong>Strengths:</strong> {proficiency.strengths.join(", ")}
          </Typography>
        )}
        {proficiency.areasToImprove.length > 0 && (
          <Typography variant="body2">
            <strong>Areas to improve:</strong>{" "}
            {proficiency.areasToImprove.join(", ")}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: "auto", mt: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Language Practice AI
      </Typography>

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
        >
          {supportedLanguages.map((lang) => (
            <MenuItem key={lang.code} value={lang.code}>
              {lang.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {renderProficiencyInfo()}

      <VoiceRecorder
        onAudioRecorded={handleAudioRecorded}
        language={language}
        disabled={isLoading || isAiSpeaking}
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
        <Box display="flex" justifyContent="center" my={3}>
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Processing your message...
          </Typography>
        </Box>
      )}

      {aiResponse && !isLoading && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            AI Response:
          </Typography>
          <Typography paragraph>{aiResponse}</Typography>

          <Button
            variant="outlined"
            onClick={() => speakAiResponse(aiResponse)}
            disabled={isAiSpeaking}
            sx={{ mt: 1 }}
          >
            {isAiSpeaking ? "Speaking..." : "Play Again"}
          </Button>
        </Box>
      )}

      {/* Hidden audio element for playing TTS responses */}
      <audio ref={audioRef} style={{ display: "none" }} />
    </Paper>
  );
};

export default LanguagePracticeAI;
