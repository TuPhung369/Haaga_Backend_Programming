// src/components/LanguageAIComponent.tsx
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
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
  setCurrentLanguage,
} from "../store/languageSlice";
import { RootState } from "../types"; // Using the new types structure

// --- Utility Imports ---
import { stripMarkdown } from "../utils/TextUtils";

// --- Child Component Imports ---
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
} from "../types/LanguageAITypes";

// --- Component Definition ---

const LanguageAIComponent: React.FC = () => {
  // --- Component State ---
  // Configuration - Define language first
  const [language, setLanguage] = useState<string>("en-US");
  const [proficiencyLevel, setProficiencyLevel] = useState<string>(
    ProficiencyLevel.Intermediate
  );
  const [selectedVoice, setSelectedVoice] = useState<string>("");

  // --- Redux State ---
  const { userInfo } = useSelector((state: RootState) => state.user);
  // Ensure token is handled as potentially null
  const token = useSelector((state: RootState) => state.auth.token) || null;
  const { loading: isLoadingMessages, messagesByLanguage } = useSelector(
    (state: RootState) => state.language
  );

  // Log the initial state of messagesByLanguage
  useEffect(() => {
    console.log("[DEBUG] Initial messagesByLanguage state:", {
      languages: messagesByLanguage ? Object.keys(messagesByLanguage) : "none",
      currentLanguage: language,
      messagesForCurrentLanguage:
        messagesByLanguage && messagesByLanguage[language]
          ? messagesByLanguage[language].length
          : 0,
    });
  }, [messagesByLanguage, language]);

  // Get messages for current language from Redux store
  const messages = useMemo(() => {
    const result =
      messagesByLanguage && messagesByLanguage[language]
        ? messagesByLanguage[language]
        : [];
    console.log(`[DEBUG] useMemo messages for ${language}:`, {
      count: result.length,
      messagesByLanguage: messagesByLanguage
        ? Object.keys(messagesByLanguage)
        : "none",
      hasCurrentLanguage:
        messagesByLanguage && messagesByLanguage[language] ? "yes" : "no",
    });
    return result;
  }, [messagesByLanguage, language]);

  // Get history messages from API when needed
  const [historyMessages, setHistoryMessages] = useState<ChatMessageData[]>([]);

  const dispatch = useDispatch();
  // Ensure initial state type is explicit
  const [supportedVoices, setSupportedVoices] = useState<
    Array<{ id: string; name: string; description?: string }>
  >([]);
  const [supportedLanguages] = useState(getSupportedLanguages());

  // Chat & Interaction
  const [aiResponse, setAiResponse] = useState<string>("");
  // Always start with history mode OFF
  const [showPreviousMessages, setShowPreviousMessages] =
    useState<boolean>(false);
  // Track if we're in an active conversation to control initial message display
  const [isActiveConversation, setIsActiveConversation] =
    useState<boolean>(false);

  // Log when isActiveConversation changes
  useEffect(() => {
    console.log(
      `[DEBUG] isActiveConversation changed to: ${isActiveConversation}`
    );
  }, [isActiveConversation]);
  // We don't need the timestamp state anymore since we're using isActiveConversation

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
      console.log(
        `Fetching conversations for user ${actualUserId} and language ${language}`
      );

      // Fetch from API
      const conversations = await getLanguageConversations(
        actualUserId,
        20,
        token,
        language // Pass current language to filter conversations
      );

      console.log(
        `Fetched ${
          conversations ? conversations.length : 0
        } conversations from API for language: ${language}`
      );

      // Set loading state for UI feedback
      setIsGeneratingResponse(true);

      // Check if we have valid data
      if (
        conversations &&
        Array.isArray(conversations) &&
        conversations.length > 0
      ) {
        // Log the first conversation to see its structure
        console.log(
          "First conversation structure:",
          JSON.stringify(conversations[0], null, 2)
        );

        const formattedHistory: ChatMessageData[] = conversations.flatMap(
          (convo: LanguageInteraction): ChatMessageData[] => {
            const messages: ChatMessageData[] = [];

            // Check message type and add appropriate message
            if (convo.messageType === "USER_MESSAGE" && convo.userMessage) {
              messages.push({
                sender: "User",
                content: convo.userMessage,
                timestamp: new Date(convo.createdAt).toISOString(),
                id: convo.id,
              });
            }

            if (convo.messageType === "AI_RESPONSE" && convo.aiResponse) {
              messages.push({
                sender: "AI",
                content: convo.aiResponse,
                timestamp: new Date(convo.createdAt).toISOString(),
                id: convo.id ? `${convo.id}-ai` : undefined,
              });
            }

            // If we have both in one object (legacy format)
            if (!convo.messageType && convo.userMessage && convo.aiResponse) {
              messages.push(
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
                }
              );
            }

            return messages;
          }
        );

        console.log(
          `Formatted ${formattedHistory.length} messages for Redux store`
        );

        // Log the first few formatted messages
        if (formattedHistory.length > 0) {
          console.log(
            "Sample of formatted messages:",
            formattedHistory.slice(0, Math.min(4, formattedHistory.length))
          );
        }

        // Log the formatted history before dispatching
        console.log("About to dispatch to Redux store:", {
          formattedHistory,
          language,
          messagesByLanguage,
        });

        // Dispatch with language information
        dispatch(
          fetchMessagesSuccess({ messages: formattedHistory, language })
        );

        // Also update our local history messages state
        // Make sure historyMessages is different from messages by creating a deep copy
        // and adding a special tag to identify them as history messages
        const taggedHistoryMessages = formattedHistory.map((msg) => ({
          ...msg,
          isHistoryMessage: true, // Add a special tag to identify history messages
          id: msg.id ? `history-${msg.id}` : undefined, // Make IDs unique
        }));
        setHistoryMessages(taggedHistoryMessages);
        console.log(
          "Set historyMessages with tagged messages:",
          taggedHistoryMessages.length
        );

        // Log the state after dispatching
        console.log(
          "After dispatch, messagesByLanguage should be updated in next render"
        );
      } else {
        console.log(
          `No valid conversations found for language: ${language}, using empty array`
        );
        // Update Redux store with empty array
        dispatch(fetchMessagesSuccess({ messages: [], language }));

        // Also update our local history messages state
        setHistoryMessages([]);
      }

      // Always turn off loading state when done
      setIsGeneratingResponse(false);
    } catch (fetchError: unknown) {
      console.error("Error fetching previous messages:", fetchError);
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to fetch messages";
      dispatch(fetchMessagesFailure(message));
      setError("Could not load conversation history.");

      // Make sure to turn off loading state
      setIsGeneratingResponse(false);

      // Set empty history messages on error
      setHistoryMessages([]);
    }
  }, [
    actualUserId,
    token,
    dispatch,
    language,
    messagesByLanguage,
    setHistoryMessages,
    setIsGeneratingResponse,
  ]);

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
      // Mark that we're in an active conversation
      setIsActiveConversation(true);
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
      // Add message to Redux store
      const updatedMessages = [...messages, userMessageObj];
      dispatch(fetchMessagesSuccess({ messages: updatedMessages, language }));
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
        // Add message to Redux store
        const updatedMessages = [...messages, aiMessageObj];
        dispatch(fetchMessagesSuccess({ messages: updatedMessages, language }));
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
        // Add error message to Redux store
        const updatedMessages = [...messages, errorMsg];
        dispatch(fetchMessagesSuccess({ messages: updatedMessages, language }));
      } finally {
        setIsGeneratingResponse(false);
      }
    },
    // Dependencies - add speakAiResponse and dispatch
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
      dispatch,
      messages,
    ]
  );

  const handleSpeechRecognized = useCallback(
    (transcript: string) => {
      console.log("Browser speech recognized (interim/final):", transcript);
      // If we have a valid transcript, mark that we're in an active conversation
      if (transcript && transcript.trim().length > 0) {
        setIsActiveConversation(true);
      }
    },
    [setIsActiveConversation]
  );

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
      const newLanguage = event.target.value;
      setLanguage(newLanguage);

      // Update current language in Redux store
      dispatch(setCurrentLanguage(newLanguage));

      // Clear transcript when language changes
      const transcriptContainer = document.getElementById(
        "transcript-container"
      );
      if (transcriptContainer) {
        // Clear previous content
        while (transcriptContainer.firstChild) {
          transcriptContainer.removeChild(transcriptContainer.firstChild);
        }
      }

      // If history is currently being shown, turn it off when language changes
      if (showPreviousMessages) {
        console.log(
          `Language changed while history was showing, hiding history`
        );
        setShowPreviousMessages(false);
        setHistoryMessages([]);
      }

      // We don't automatically fetch messages when language changes anymore
      // Messages will only be fetched when the user clicks the "Show History" button
      console.log(`Language changed to ${newLanguage}`);
    },
    [dispatch, showPreviousMessages, setHistoryMessages]
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
    // Get the current state value
    const turningOnHistory = !showPreviousMessages;

    console.log(
      `Toggle history called, current state: ${showPreviousMessages}, changing to: ${turningOnHistory}`
    );

    // Update state with the new value
    setShowPreviousMessages(turningOnHistory);

    // Only fetch messages when turning history ON
    if (turningOnHistory) {
      console.log(`Toggling history ON, fetching latest messages...`);
      // Set loading state to true to show loading indicator
      setIsGeneratingResponse(true);
      // Fetch messages from the API
      fetchPreviousMessages();
    } else {
      console.log(`Toggling history OFF`);
      // When turning off history, clear the history messages
      // The ChatWindow component will automatically switch to showing current messages
      setHistoryMessages([]);
    }
  }, [
    showPreviousMessages,
    fetchPreviousMessages,
    setIsGeneratingResponse,
    setHistoryMessages,
  ]);

  // --- Effects ---

  // Track languages we've already fetched messages for
  const [fetchedLanguages, setFetchedLanguages] = useState<Set<string>>(
    new Set()
  );

  // Initialize messagesByLanguage if needed and set current language
  useEffect(() => {
    // Set current language in Redux store
    dispatch(setCurrentLanguage(language));

    // Only initialize if messagesByLanguage is undefined or the language doesn't exist
    // AND we haven't already fetched for this language
    if (
      (!messagesByLanguage || !messagesByLanguage[language]) &&
      !fetchedLanguages.has(language)
    ) {
      console.log(
        `Initializing empty messages array for language: ${language}`
      );
      dispatch(fetchMessagesSuccess({ messages: [], language }));
    }
  }, [dispatch, language, messagesByLanguage, fetchedLanguages]);

  // Fetch messages for current language when component mounts or language changes
  useEffect(() => {
    // Only fetch if we have a user ID and token
    if (actualUserId && token) {
      // Check if we already have messages for this language in the store
      const hasMessages =
        messagesByLanguage &&
        messagesByLanguage[language] &&
        messagesByLanguage[language].length > 0;

      // Check if we've already fetched for this language in this session
      const alreadyFetched = fetchedLanguages.has(language);

      console.log(
        `Language: ${language}, hasMessages: ${hasMessages}, alreadyFetched: ${alreadyFetched}`
      );

      // Mark this language as tracked in our fetchedLanguages set
      if (!alreadyFetched) {
        setFetchedLanguages((prev) => {
          const newSet = new Set(prev);
          newSet.add(language);
          return newSet;
        });

        // Fetch messages in the background to have them ready
        // This ensures we have the data when the user clicks "Show History"
        // But we won't display them until the user explicitly requests them
        console.log(`Fetching messages for ${language} in the background`);
        fetchPreviousMessages();
      }

      // Initialize empty messages array in Redux store if needed
      if (!messagesByLanguage || !messagesByLanguage[language]) {
        dispatch(fetchMessagesSuccess({ messages: [], language }));
      }
    }
  }, [
    actualUserId,
    token,
    language,
    fetchPreviousMessages,
    fetchedLanguages,
    messagesByLanguage,
    dispatch,
  ]);

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
      // Create welcome message based on selected language
      let welcomeContent = "";

      if (language === "fi-FI") {
        // Finnish welcome messages
        welcomeContent =
          (languageChanged || levelChanged) && messages.length > 0
            ? `Okei, nyt harjoitellaan suomea ${proficiencyLevel} tasolla. Jatketaan!`
            : `Tervetuloa! Olen valmis auttamaan sinua harjoittelemaan suomea ${proficiencyLevel} tasolla. Sano jotain aloittaaksesi.`;
      } else {
        // English (default) welcome messages
        welcomeContent =
          (languageChanged || levelChanged) && messages.length > 0
            ? `Okay, now practicing ${getLanguageName(
                language
              )} at the ${proficiencyLevel} level. Let's continue!`
            : `Welcome! I'm ready to help you practice ${getLanguageName(
                language
              )} at the ${proficiencyLevel} level. Say something to begin.`;
      }

      const welcomeMessage: ChatMessageData = {
        sender: "AI",
        content: welcomeContent,
        timestamp: new Date().toISOString(),
      };
      // Set welcome message in Redux store
      dispatch(fetchMessagesSuccess({ messages: [welcomeMessage], language }));

      prevLangRef.current = language;
      prevLevelRef.current = proficiencyLevel;
    }
    // Added messages.length dependency
  }, [language, proficiencyLevel, getLanguageName, messages.length, dispatch]);

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

  // We don't need to update historyMessages from messages anymore
  // since fetchPreviousMessages will update historyMessages directly
  // This avoids creating a circular dependency

  // Use lastUpdated to force re-render when needed
  const chatWindowProps: ChatWindowProps = useMemo(
    () => ({
      messages,
      username,
      previousMessages: historyMessages,
      isLoadingHistory: isLoadingMessages,
      isGeneratingResponse,
      showHistory: showPreviousMessages,
      onToggleHistory: handleToggleHistory,
      formatTimestamp,
      fetchPreviousMessages, // Pass fetch function if needed by ChatWindow itself
      isActiveConversation, // Pass the active conversation flag
    }),
    [
      messages,
      username,
      historyMessages,
      isLoadingMessages,
      isGeneratingResponse,
      showPreviousMessages,
      handleToggleHistory,
      formatTimestamp,
      fetchPreviousMessages,
      isActiveConversation, // Add to dependencies
      // lastUpdated removed as it's not needed
    ]
  );

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

