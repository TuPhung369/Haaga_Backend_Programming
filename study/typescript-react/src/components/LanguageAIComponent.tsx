// src/components/LanguageAIComponent.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Box, SelectChangeEvent } from "@mui/material"; // Added SelectChangeEvent

// --- Service Imports ---
import {
  convertTextToSpeech,
  getSupportedLanguages,
  getSupportedVoices,
  convertSpeechToText,
} from "../services/SpeechService";
import {
  saveInteraction,
  getAIResponseFromN8n,
  getLanguageConversations,
} from "../services/LanguageService";

// --- Redux Imports ---
import {
  fetchMessagesStart,
  fetchMessagesSuccess,
  fetchMessagesFailure,
} from "../store/languageSlice";
import { RootState } from "../type/types"; // Assuming store exports RootState type

// --- Utility Imports ---
import { stripMarkdown } from "../utils/TextUtils";

// --- Child Component Imports ---
// Removed VoiceRecorder import
import ServiceStatusNotification from "./ServiceStatusNotification";
import { ChatControls } from "./ChatControls";
import { ChatWindow } from "./ChatWindow";

// --- Type Imports ---
import {
  ProficiencyLevel,
  ResponseMetadata,
  ChatMessageData,
  LanguageInteraction,
  ChatControlsProps,
  ChatWindowProps,
} from "../type/languageAI";

// --- Component Definition ---

const LanguageAIComponent: React.FC = () => {
  // --- Redux State ---
  const { userInfo } = useSelector((state: RootState) => state.user);
  // Ensure token is handled as potentially null
  const token = useSelector((state: RootState) => state.auth.token) || null;
  const { messages: previousMessages, loading: isLoadingMessages } =
    useSelector((state: RootState) => state.language);
  const dispatch = useDispatch();

  // --- Component State ---
  // Configuration
  const [language, setLanguage] = useState<string>("en-US");
  const [proficiencyLevel, setProficiencyLevel] = useState<string>(
    ProficiencyLevel.Intermediate
  );
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  // Ensure initial state type is explicit
  const [supportedVoices, setSupportedVoices] = useState<
    Array<{ id: string; name: string; description?: string }>
  >([]);
  const [supportedLanguages] = useState(getSupportedLanguages());

  // Chat & Interaction
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [showPreviousMessages, setShowPreviousMessages] =
    useState<boolean>(false);

  // Status & Loading
  const [isProcessingAudio, setIsProcessingAudio] = useState<boolean>(false);
  const [isGeneratingResponse, setIsGeneratingResponse] =
    useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [backendAvailable, setBackendAvailable] = useState<boolean>(true);

  // UI & Misc
  const [error, setError] = useState<string | null>(null);
  const [responseMetadata, setResponseMetadata] = useState<ResponseMetadata>(
    {}
  );
  const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false);
  // Removed unused setAutoSpeak - state not needed if value isn't changed
  const autoSpeak = true; // If it's always true, make it a const

  // --- Refs ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevLangRef = useRef<string>(language);
  const prevLevelRef = useRef<string>(proficiencyLevel);

  // --- Derived State & Constants ---
  const actualUserId = userInfo?.id || "guest";
  const username = userInfo?.username || "User";

  // --- Helper Functions ---
  const getLanguageName = useCallback(
    (code: string): string => {
      return (
        supportedLanguages.find((lang) => lang.code === code)?.name || code
      );
    },
    [supportedLanguages]
  );

  const formatTimestamp = useCallback((timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return isNaN(date.getTime())
        ? "Invalid Date"
        : date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          });
    } catch {
      return "Invalid Date";
    }
  }, []);

  // --- Core Logic Handlers (useCallback) ---

  const fetchPreviousMessages = useCallback(async () => {
    if (!actualUserId || !token) return;

    dispatch(fetchMessagesStart());
    try {
      const conversations = await getLanguageConversations(
        actualUserId,
        20,
        token
      );
      const formattedHistory: ChatMessageData[] = conversations.flatMap(
        (convo: LanguageInteraction): ChatMessageData[] => [
          {
            sender: "User",
            content: convo.userMessage,
            timestamp: new Date(convo.createdAt).toISOString(),
            id: convo.id,
          },
          {
            sender: "AI",
            content: convo.aiResponse,
            timestamp: new Date(convo.createdAt).toISOString(),
            id: convo.id ? `${convo.id}-ai` : undefined,
          },
        ]
      );
      // FIX: Dispatch the formatted history (assuming reducer accepts ChatMessageData[])
      dispatch(fetchMessagesSuccess(formattedHistory));
    } catch (fetchError: unknown) {
      console.error("Error fetching previous messages:", fetchError);
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to fetch messages";
      dispatch(fetchMessagesFailure(message));
      setError("Could not load conversation history.");
    }
  }, [actualUserId, token, dispatch]);

  // Handles Text-to-Speech request - defined before handleAudioRecorded as it's used there
  const speakAiResponse = useCallback(
    async (text: string) => {
      if (!text || isSpeaking || !audioRef.current) return;

      setError(null);
      setIsSpeaking(true);
      const cleanText = stripMarkdown(text.replace("[SIMULATION] ", ""));

      try {
        console.log(
          `🎙️ Requesting TTS for "${cleanText.substring(
            0,
            30
          )}..." (Voice: ${selectedVoice})`
        );
        const audioData = await convertTextToSpeech(
          cleanText,
          language,
          selectedVoice
        );

        if (!audioData) {
          throw new Error("Text-to-speech service returned no audio data.");
        }

        audioRef.current.src = audioData;
        await audioRef.current.play();
        console.log("🎙️ Audio playback started");
      } catch (ttsError: unknown) {
        // Use unknown
        console.error("Error generating or playing speech:", ttsError);
        const message =
          ttsError instanceof Error ? ttsError.message : "Unknown TTS error";
        setError(`Could not speak response: ${message}`);
        setIsSpeaking(false);
      }
    },
    [language, selectedVoice, isSpeaking] // Dependencies
  );

  const handleAudioRecorded = useCallback(
    async (audioBlob: Blob, browserTranscript: string) => {
      setError(null);
      setIsProcessingAudio(true);
      let userTranscript = browserTranscript.trim();

      // 1. Get Transcript
      if (!userTranscript && backendAvailable) {
        console.log("No browser transcript, requesting server STT...");
        try {
          const result = await convertSpeechToText(audioBlob, language);
          userTranscript = result.transcript.trim();
          if (!userTranscript)
            throw new Error("Server returned empty transcript.");
          console.log(`Server STT result: "${userTranscript}"`);
        } catch (speechError: unknown) {
          // Use unknown
          console.error("Server STT failed:", speechError);
          const message =
            speechError instanceof Error
              ? speechError.message
              : "Please try again";
          setError(`Speech recognition failed: ${message}.`);
          setIsProcessingAudio(false);
          return;
        }
      } else if (!userTranscript && !backendAvailable) {
        setError(
          "Cannot process speech: backend unavailable and no browser transcript."
        );
        setIsProcessingAudio(false);
        return;
      }

      if (!userTranscript) {
        setError("I couldn't understand that. Please try speaking again.");
        setIsProcessingAudio(false);
        return;
      }

      // 2. Add User Message
      const userMessageObj: ChatMessageData = {
        sender: "User",
        content: userTranscript,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessageObj]);
      setIsProcessingAudio(false); // STT finished

      // 3. Get AI Response
      setIsGeneratingResponse(true);
      let aiResponseText = "";
      try {
        const startTime = performance.now();
        aiResponseText = await getAIResponseFromN8n(
          userTranscript,
          language,
          proficiencyLevel,
          actualUserId
        );
        const responseTime = Math.round(performance.now() - startTime);
        setResponseMetadata({ responseTime, responseSource: "n8n" });
        console.log(`Received AI response in ${responseTime}ms`);

        // 4. Add AI Message
        const aiMessageObj: ChatMessageData = {
          sender: "AI",
          content: aiResponseText,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessageObj]);
        setAiResponse(aiResponseText);

        // 5. Save Interaction (check token type)
        saveInteraction({
          userMessage: userTranscript,
          aiResponse: aiResponseText,
          userId: actualUserId,
          language,
          proficiencyLevel,
          // Pass token as string | undefined
          token: token || undefined,
        }).catch((saveError) => {
          console.error("Failed to save interaction:", saveError);
        });

        // 6. Speak Response
        if (autoSpeak) {
          speakAiResponse(aiResponseText);
        }
      } catch (aiError: unknown) {
        // Use unknown
        console.error("Error getting AI response:", aiError);
        const message =
          aiError instanceof Error ? aiError.message : "Please try again.";
        setError(`Failed to get AI response: ${message}`);
        const errorMsg: ChatMessageData = {
          sender: "AI",
          content: `Sorry, I encountered an error. (${message})`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsGeneratingResponse(false);
      }
    },
    // Dependencies - add speakAiResponse
    [
      language,
      proficiencyLevel,
      actualUserId,
      token,
      backendAvailable,
      autoSpeak,
      // saveInteraction, // Assume stable or defined outside
      // getAIResponseFromN8n, // Assume stable or defined outside
      speakAiResponse, // Add speakAiResponse
    ]
  );

  const handleSpeechRecognized = useCallback((transcript: string) => {
    console.log("Browser speech recognized (interim/final):", transcript);
  }, []);

  const stopAiSpeech = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
      console.log("🎙️ Audio playback stopped by user");
    }
  }, []);

  // --- UI Control Handlers ---
  const handleLanguageChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      setLanguage(event.target.value);
    },
    []
  );

  const handleProficiencyChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      setProficiencyLevel(event.target.value);
    },
    []
  );

  const handleVoiceChange = useCallback((event: SelectChangeEvent<string>) => {
    setSelectedVoice(event.target.value);
  }, []);

  const handleToggleHistory = useCallback(() => {
    const turningOnHistory = !showPreviousMessages;
    setShowPreviousMessages(turningOnHistory);
    if (turningOnHistory && previousMessages.length === 0) {
      fetchPreviousMessages();
    }
  }, [showPreviousMessages, fetchPreviousMessages, previousMessages.length]);

  // --- Effects ---

  // Initialize/Update Voices based on Language
  useEffect(() => {
    const allVoices = getSupportedVoices();
    const languagePrefix = language.split("-")[0].toLowerCase();
    // Explicitly type filteredVoices
    let filteredVoices: Array<{
      id: string;
      name: string;
      description?: string;
    }> = [];

    if (language === "fi-FI") {
      filteredVoices = allVoices.filter((v) => v.id === "finnish-neutral");
      if (filteredVoices.length === 0) {
        filteredVoices.push({
          id: "finnish-neutral",
          name: "Finnish",
          description: "Google TTS Finnish voice",
        });
      }
    } else if (languagePrefix === "en") {
      filteredVoices = allVoices.filter(
        (v) =>
          v.id.includes("-en-us") || v.id === "neutral" || v.id.includes("en-")
      ); // Broaden English match slightly
    } else {
      filteredVoices = allVoices.filter(
        (v) => v.id.includes(`-${languagePrefix}`) || v.id === "neutral"
      );
    }

    if (filteredVoices.length === 0 && language !== "fi-FI") {
      const neutralVoice = allVoices.find((v) => v.id === "neutral");
      if (neutralVoice) filteredVoices.push(neutralVoice);
    }

    setSupportedVoices(filteredVoices);

    const currentVoiceIsValid = filteredVoices.some(
      (v) => v.id === selectedVoice
    );
    // Add selectedVoice to dependency array and check if it needs update
    if ((!selectedVoice || !currentVoiceIsValid) && filteredVoices.length > 0) {
      setSelectedVoice(filteredVoices[0].id);
    } else if (filteredVoices.length === 0) {
      setSelectedVoice("");
    }
  }, [language, selectedVoice]); // Added selectedVoice dependency

  // Set initial welcome message or update on lang/level change
  useEffect(() => {
    if (!language || !proficiencyLevel) return;
    const languageChanged = prevLangRef.current !== language;
    const levelChanged = prevLevelRef.current !== proficiencyLevel;

    // Start fresh only if language/level changed OR initial load (messages empty)
    if (languageChanged || levelChanged || messages.length === 0) {
      const welcomeContent =
        (languageChanged || levelChanged) && messages.length > 0
          ? `Okay, now practicing ${getLanguageName(
              language
            )} at the ${proficiencyLevel} level. Let's continue!`
          : `Welcome! I'm ready to help you practice ${getLanguageName(
              language
            )} at the ${proficiencyLevel} level. Say something to begin.`;

      const welcomeMessage: ChatMessageData = {
        sender: "AI",
        content: welcomeContent,
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]); // Start fresh

      prevLangRef.current = language;
      prevLevelRef.current = proficiencyLevel;
    }
    // Added messages.length dependency
  }, [language, proficiencyLevel, getLanguageName, messages.length]);

  // --- Prepare Props ---
  const chatControlsProps: ChatControlsProps = {
    language,
    proficiencyLevel,
    selectedVoice,
    supportedLanguages,
    supportedVoices,
    isProcessingAudio: isProcessingAudio,
    isGeneratingResponse: isGeneratingResponse,
    isSpeaking: isSpeaking,
    backendAvailable,
    error,
    aiResponse,
    showDebugInfo,
    responseMetadata,
    onLanguageChange: handleLanguageChange,
    onProficiencyChange: handleProficiencyChange,
    onVoiceChange: handleVoiceChange,
    onAudioRecorded: handleAudioRecorded,
    onSpeechRecognized: handleSpeechRecognized,
    onSpeakLastResponse: () => speakAiResponse(aiResponse),
    onStopSpeaking: stopAiSpeech,
    onToggleDebugInfo: () => setShowDebugInfo((prev) => !prev),
  };

  const chatWindowProps: ChatWindowProps = {
    messages,
    username,
    previousMessages: showPreviousMessages ? previousMessages : [],
    isLoadingHistory: isLoadingMessages,
    isGeneratingResponse,
    showHistory: showPreviousMessages,
    onToggleHistory: handleToggleHistory,
    formatTimestamp,
    fetchPreviousMessages, // Pass fetch function if needed by ChatWindow itself
  };

  // --- Render ---
  return (
    <>
      <ServiceStatusNotification onStatusChange={setBackendAvailable} />
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          width: "100%",
          maxWidth: "100%",
          mx: "auto",
          height: { xs: "auto", md: "calc(100vh - 60px)" },
          maxHeight: "100vh",
          p: { xs: 1, md: 2 },
          gap: 2,
          bgcolor: "grey.100",
          justifyContent: "space-between",
        }}
      >
        <ChatControls {...chatControlsProps} />
        <ChatWindow {...chatWindowProps} />
      </Box>
      <audio
        ref={audioRef}
        style={{ display: "none" }}
        onEnded={() => setIsSpeaking(false)}
        onError={(e) => {
          console.error("Audio playback error:", e);
          setError("Error playing audio response.");
          setIsSpeaking(false);
        }}
        controls
      />
    </>
  );
};

export default LanguageAIComponent;

