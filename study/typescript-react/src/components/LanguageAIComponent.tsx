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
} from "../services/speechService";
import {
  saveInteraction,
  getAIResponseFromN8n,
  getLanguageConversations,
} from "../services/languageService";

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
  const {
    loading: isLoadingMessages,
    currentMessagesByLanguage,
    historyMessagesByLanguage,
  } = useSelector((state: RootState) => state.language);

  // Get current messages for current language from Redux store
  const messages = useMemo(() => {
    const result =
      currentMessagesByLanguage && currentMessagesByLanguage[language]
        ? currentMessagesByLanguage[language]
        : [];
    console.log(`[DEBUG] useMemo current messages for ${language}:`, {
      count: result.length,
      currentLanguages: currentMessagesByLanguage
        ? Object.keys(currentMessagesByLanguage)
        : "none",
      hasCurrentLanguage:
        currentMessagesByLanguage && currentMessagesByLanguage[language]
          ? "yes"
          : "no",
    });
    return result;
  }, [currentMessagesByLanguage, language]);

  // Get history messages from Redux store
  const historyMessages = useMemo(() => {
    const result =
      historyMessagesByLanguage && historyMessagesByLanguage[language]
        ? historyMessagesByLanguage[language]
        : [];
    console.log(`[DEBUG] useMemo history messages for ${language}:`, {
      count: result.length,
      historyLanguages: historyMessagesByLanguage
        ? Object.keys(historyMessagesByLanguage)
        : "none",
      hasHistoryLanguage:
        historyMessagesByLanguage && historyMessagesByLanguage[language]
          ? "yes"
          : "no",
    });
    return result;
  }, [historyMessagesByLanguage, language]);

  const dispatch = useDispatch();

  // For compatibility with existing code, we'll keep the setter function
  // but it will now update the Redux store instead of local state
  const setHistoryMessages = useCallback(
    (messages: ChatMessageData[]) => {
      // Only update the Redux store if we're not toggling history off
      // This way, when we toggle history back on, we can use the cached data from Redux
      // without making another API call
      if (
        messages.length > 0 ||
        !historyMessagesByLanguage ||
        !historyMessagesByLanguage[language]
      ) {
        console.log(
          `Updating Redux store with ${messages.length} history messages`
        );
        // Update the Redux store with the new history messages
        dispatch(fetchMessagesSuccess({ messages, language, isHistory: true }));
      } else {
        console.log(`Not updating Redux store when toggling history off`);
        // When toggling history off, we don't need to clear the Redux store,
        // just hide the history messages in the UI
      }
    },
    [dispatch, language, historyMessagesByLanguage]
  );
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
  // Initialize to false - we'll only set it to true when user interacts
  const [isActiveConversation, setIsActiveConversation] =
    useState<boolean>(false);

  // Log when isActiveConversation changes
  useEffect(() => {
    console.log(
      `[DEBUG] isActiveConversation changed to: ${isActiveConversation}`
    );
  }, [isActiveConversation]);

  // Check if there are current messages in the Redux store and set isActiveConversation accordingly
  useEffect(() => {
    console.log("[DEBUG] Initial message stores state:", {
      currentLanguages: currentMessagesByLanguage
        ? Object.keys(currentMessagesByLanguage)
        : "none",
      historyLanguages: historyMessagesByLanguage
        ? Object.keys(historyMessagesByLanguage)
        : "none",
      currentLanguage: language,
      currentMessagesCount:
        currentMessagesByLanguage && currentMessagesByLanguage[language]
          ? currentMessagesByLanguage[language].length
          : 0,
      historyMessagesCount:
        historyMessagesByLanguage && historyMessagesByLanguage[language]
          ? historyMessagesByLanguage[language].length
          : 0,
    });

    // Set isActiveConversation to true if there are current messages in the Redux store
    const hasCurrentMessages =
      currentMessagesByLanguage &&
      currentMessagesByLanguage[language] &&
      currentMessagesByLanguage[language].length > 0;

    if (hasCurrentMessages) {
      console.log(
        `Setting isActiveConversation to true because there are ${currentMessagesByLanguage[language].length} current messages`
      );
      setIsActiveConversation(true);
    }
  }, [currentMessagesByLanguage, historyMessagesByLanguage, language]);
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

        // Sort messages by timestamp before dispatching to Redux store
        const sortedHistory = [...formattedHistory].sort((a, b) => {
          return (
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        });

        // Log the formatted and sorted history before dispatching
        console.log("About to dispatch to Redux store:", {
          originalCount: formattedHistory.length,
          sortedCount: sortedHistory.length,
          language,
          isHistory: true,
        });

        // Dispatch with language information and isHistory flag
        dispatch(
          fetchMessagesSuccess({
            messages: sortedHistory,
            language,
            isHistory: true,
          })
        );

        // Also update our local history messages state
        // Make sure historyMessages is different from messages by creating a deep copy
        // and adding a special tag to identify them as history messages
        const taggedHistoryMessages = formattedHistory
          .map((msg) => ({
            ...msg,
            isHistoryMessage: true, // Add a special tag to identify history messages
            id: msg.id
              ? `history-${msg.id}`
              : `history-${Date.now()}-${Math.random()
                  .toString(36)
                  .substring(2, 9)}`, // Ensure all messages have unique IDs
          }))
          // Sort by timestamp to ensure chronological order
          .sort((a, b) => {
            return (
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
          });

        // Make sure we're setting a new array reference to trigger re-renders
        setHistoryMessages([...taggedHistoryMessages]);
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

      // If we're in history mode, turn it off when the user records audio
      if (showPreviousMessages) {
        console.log(
          "User recorded audio while in history mode, turning off history mode"
        );
        setShowPreviousMessages(false);
        setHistoryMessages([]);
      }

      let userTranscript = browserTranscript.trim();

      // Debug log for Finnish language
      const isFinnish = language.toLowerCase().includes("fi");
      console.log(
        `Language: ${language}, isFinnish: ${isFinnish}, browserTranscript: "${browserTranscript}"`
      );

      // 1. Get Transcript
      if ((!userTranscript && backendAvailable) || isFinnish) {
        // For Finnish, always use server STT even if browser transcript exists
        console.log(
          `${
            isFinnish ? "Finnish language detected" : "No browser transcript"
          }, requesting server STT...`
        );
        try {
          const result = await convertSpeechToText(audioBlob, language);
          console.log(`Raw server STT result:`, result);
          userTranscript = result.transcript.trim();
          if (!userTranscript) {
            console.error("Server returned empty transcript.");
            if (isFinnish) {
              // For Finnish, handle empty transcript specially
              if (browserTranscript) {
                // If we have browser transcript, use it
                console.log(
                  `Using browser transcript for Finnish: "${browserTranscript}"`
                );
                userTranscript = browserTranscript.trim();
              } else {
                // If no browser transcript either, use a placeholder for Finnish
                console.log(
                  "No transcript available for Finnish, using placeholder"
                );
                // Check if the transcript contains "Äänitiedosto on liian lyhyt" (Audio file is too short)
                if (
                  result.transcript &&
                  result.transcript.includes("Äänitiedosto on liian lyhyt")
                ) {
                  console.log(
                    "Audio file is too short, asking user to speak longer"
                  );
                  userTranscript =
                    "Äänitiedosto on liian lyhyt. Ole hyvä ja puhu pidempään."; // "Audio file is too short. Please speak longer."
                } else {
                  userTranscript = "mitä k hi päivä känsä ala kue";
                }
              }
            } else {
              throw new Error("Server returned empty transcript.");
            }
          }
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
      console.log(`Adding user message to chat: "${userTranscript}"`);
      const userMessageObj: ChatMessageData = {
        sender: "User",
        content: userTranscript,
        timestamp: new Date().toISOString(),
      };
      // Add user message to Redux store
      // Send just the single message to be appended to the existing messages
      dispatch(
        fetchMessagesSuccess({
          messages: [userMessageObj],
          language,
          isHistory: false,
        })
      );

      // Mark that we're in an active conversation when a user message is added
      setIsActiveConversation(true);

      setIsProcessingAudio(false); // STT finished

      // For Finnish, update the transcript display in the UI
      if (isFinnish) {
        console.log(`Updating Finnish transcript in UI: "${userTranscript}"`);
      }

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
        // Add AI message to Redux store
        // Send just the single message to be appended to the existing messages
        dispatch(
          fetchMessagesSuccess({
            messages: [aiMessageObj],
            language,
            isHistory: false,
          })
        );
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
    // Dependencies - add speakAiResponse, dispatch, and setIsActiveConversation
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
      showPreviousMessages,
      setShowPreviousMessages,
      setHistoryMessages,
      setIsActiveConversation, // Add setIsActiveConversation for setting active conversation state
    ]
  );

  const handleSpeechRecognized = useCallback(
    (transcript: string) => {
      console.log("Browser speech recognized (interim/final):", transcript);
      // If we have a valid transcript, mark that we're in an active conversation
      if (transcript && transcript.trim().length > 0) {
        // Mark that we're in an active conversation
        setIsActiveConversation(true);

        // If we're in history mode, turn it off when the user starts speaking
        if (showPreviousMessages) {
          console.log(
            "User started speaking while in history mode, turning off history mode"
          );
          setShowPreviousMessages(false);
          setHistoryMessages([]);
        }
      }
    },
    [
      setIsActiveConversation,
      showPreviousMessages,
      setShowPreviousMessages,
      setHistoryMessages,
    ]
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
        // Don't clear the history messages from Redux store, just hide them in the UI
        // This way, when the user clicks "Show History" again, we can use the cached data
      }

      // Check if we already have current messages in the Redux store for the new language
      const hasCurrentMessages =
        currentMessagesByLanguage &&
        currentMessagesByLanguage[newLanguage] &&
        currentMessagesByLanguage[newLanguage].length > 0;

      console.log(
        `Language changed to ${newLanguage}, hasCurrentMessages=${hasCurrentMessages}`
      );

      // We don't automatically fetch messages when language changes anymore
      // Messages will only be fetched when the user clicks the "Show History" button
    },
    [dispatch, showPreviousMessages, currentMessagesByLanguage]
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

    // Only load history messages when turning history ON
    if (turningOnHistory) {
      // Check if we already have history messages in Redux
      const hasHistoryInRedux =
        historyMessagesByLanguage &&
        historyMessagesByLanguage[language] &&
        historyMessagesByLanguage[language].length > 0;

      console.log(
        `Toggling history ON, hasHistoryInRedux: ${hasHistoryInRedux}`
      );

      if (hasHistoryInRedux) {
        // Use the history messages from Redux if available
        console.log(
          `Using history from Redux store, ${historyMessagesByLanguage[language].length} messages`
        );
        // Use the history messages from Redux
        setHistoryMessages(historyMessagesByLanguage[language]);
      } else {
        // Only as a fallback, fetch from API if we don't have history in Redux
        // This should rarely happen since we should have loaded history during initialization
        console.log(`No history in Redux, fetching from API as fallback...`);
        // Set loading state to true to show loading indicator
        setIsGeneratingResponse(true);
        // Fetch messages from the API
        fetchPreviousMessages();
      }
    } else {
      console.log(`Toggling history OFF`);
      // When turning off history, we don't need to clear the Redux store,
      // just hide the history messages in the UI

      // Instead of clearing the Redux store, we'll just use a local state variable
      // to track whether we should show history messages
      // This way, when we toggle history back on, we can use the cached data from Redux
      // without making another API call

      // Make sure we're showing current messages
      // Get current messages from Redux store
      const currentMessages = currentMessagesByLanguage[language] || [];
      console.log(
        `Restoring ${currentMessages.length} current messages for language ${language}`
      );

      // Set isActiveConversation based on whether we have current messages
      // If we have messages, we should be in an active conversation
      setIsActiveConversation(currentMessages.length > 0);
    }
  }, [
    showPreviousMessages,
    fetchPreviousMessages,
    setIsGeneratingResponse,
    setHistoryMessages,
    setIsActiveConversation,
    historyMessagesByLanguage,
    currentMessagesByLanguage, // Add currentMessagesByLanguage to dependencies
    language,
  ]);

  // --- Effects ---

  // Track languages we've already fetched messages for
  const [fetchedLanguages, setFetchedLanguages] = useState<Set<string>>(
    new Set()
  );

  // Initialize message stores if needed and set current language
  useEffect(() => {
    // Set current language in Redux store
    dispatch(setCurrentLanguage(language));

    // Only initialize current messages if they don't exist for this language
    // AND we haven't already fetched for this language
    if (
      (!currentMessagesByLanguage || !currentMessagesByLanguage[language]) &&
      !fetchedLanguages.has(language)
    ) {
      console.log(
        `Initializing empty current messages array for language: ${language}`
      );
      dispatch(
        fetchMessagesSuccess({ messages: [], language, isHistory: false })
      );
    }

    // Also initialize empty history messages array if needed
    if (!historyMessagesByLanguage || !historyMessagesByLanguage[language]) {
      console.log(
        `Initializing empty history messages array for language: ${language}`
      );
      dispatch(
        fetchMessagesSuccess({ messages: [], language, isHistory: true })
      );
    }
  }, [
    dispatch,
    language,
    currentMessagesByLanguage,
    historyMessagesByLanguage,
    fetchedLanguages,
  ]);

  // Fetch messages for current language when component mounts or language changes
  useEffect(() => {
    // Only fetch if we have a user ID and token
    if (actualUserId && token) {
      // Check if we already have history messages for this language in the store
      const hasHistoryMessages =
        historyMessagesByLanguage &&
        historyMessagesByLanguage[language] &&
        historyMessagesByLanguage[language].length > 0;

      // Check if we've already fetched for this language in this session
      const alreadyFetched = fetchedLanguages.has(language);

      console.log(
        `Language: ${language}, hasHistoryMessages: ${hasHistoryMessages}, alreadyFetched: ${alreadyFetched}`
      );

      // Mark this language as tracked in our fetchedLanguages set
      if (!alreadyFetched) {
        setFetchedLanguages((prev) => {
          const newSet = new Set(prev);
          newSet.add(language);
          return newSet;
        });

        // Only fetch messages if we don't already have them in the Redux store
        if (!hasHistoryMessages) {
          // Fetch messages in the background to have them ready
          // This ensures we have the data when the user clicks "Show History"
          // But we won't display them until the user explicitly requests them
          console.log(`Fetching messages for ${language} in the background`);
          fetchPreviousMessages();
        } else {
          console.log(
            `Already have history messages for ${language} in Redux store, skipping API call`
          );
        }
      }

      // Initialize empty current messages array in Redux store if needed
      if (!currentMessagesByLanguage || !currentMessagesByLanguage[language]) {
        dispatch(
          fetchMessagesSuccess({ messages: [], language, isHistory: false })
        );
      }

      // Initialize empty history messages array in Redux store if needed
      if (!historyMessagesByLanguage || !historyMessagesByLanguage[language]) {
        dispatch(
          fetchMessagesSuccess({ messages: [], language, isHistory: true })
        );
      }
    }
  }, [
    actualUserId,
    token,
    language,
    fetchPreviousMessages,
    fetchedLanguages,
    currentMessagesByLanguage,
    historyMessagesByLanguage,
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

    // Check if we already have current messages in the Redux store
    const hasCurrentMessages =
      currentMessagesByLanguage &&
      currentMessagesByLanguage[language] &&
      currentMessagesByLanguage[language].length > 0;

    console.log(
      `Welcome message check: languageChanged=${languageChanged}, levelChanged=${levelChanged}, hasCurrentMessages=${hasCurrentMessages}`
    );

    // Handle language/level changes separately if we have current messages
    if (hasCurrentMessages && (languageChanged || levelChanged)) {
      console.log(
        `Language or level changed with existing messages, updating refs only`
      );
      // Just update the refs without creating a new message
      prevLangRef.current = language;
      prevLevelRef.current = proficiencyLevel;
      return;
    }

    // Only create a welcome message if we don't have any messages for this language
    if (!hasCurrentMessages) {
      // Create welcome message based on selected language
      let welcomeContent = "";

      if (language === "fi-FI") {
        // Finnish welcome messages
        welcomeContent = `Tervetuloa! Olen valmis auttamaan sinua harjoittelemaan suomea ${proficiencyLevel} tasolla. Sano jotain aloittaaksesi.`;
      } else if (language === "vi-VN") {
        // Vietnamese welcome messages
        welcomeContent = `Chào mừng! Tôi sẵn sàng giúp bạn luyện tập ${getLanguageName(
          language
        )} ở cấp độ ${proficiencyLevel}. Nói gì đó để bắt đầu.`;
      } else {
        // English (default) welcome messages
        welcomeContent = `Welcome! I'm ready to help you practice ${getLanguageName(
          language
        )} at the ${proficiencyLevel} level. Say something to begin.`;
      }

      // Log the current messages in the Redux store
      console.log(
        `Current messages in Redux store for ${language}:`,
        currentMessagesByLanguage && currentMessagesByLanguage[language]
          ? currentMessagesByLanguage[language].map((msg) =>
              msg.content.substring(0, 30)
            )
          : "none"
      );

      // Only create and dispatch a welcome message if we don't already have messages
      // or if the language/level changed, but not both
      if (!hasCurrentMessages) {
        console.log(
          `Creating welcome message for ${language} at ${proficiencyLevel} level`
        );
        const welcomeMessage: ChatMessageData = {
          sender: "AI",
          content: welcomeContent,
          timestamp: new Date().toISOString(),
        };
        // Set welcome message in Redux store
        dispatch(
          fetchMessagesSuccess({ messages: [welcomeMessage], language })
        );
      }

      prevLangRef.current = language;
      prevLevelRef.current = proficiencyLevel;
    }
  }, [
    language,
    proficiencyLevel,
    getLanguageName,
    currentMessagesByLanguage,
    dispatch,
  ]);

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
      language, // Pass the current language for welcome message
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
      language, // Add language to dependencies
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

