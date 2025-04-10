import { createSlice, PayloadAction } from "@reduxjs/toolkit";
// Import types from new structure
import {
  ChatMessageData,
  LanguageInteraction,
  LanguageState,
} from "../types/LanguageAITypes";
// Helper function to normalize language codes
function normalizeLanguageCode(language: string): string {
  return language.toLowerCase().includes("fi")
    ? "fi-FI"
    : language.toLowerCase().includes("vi")
    ? "vi-VN"
    : "en-US";
}

const initialState: LanguageState = {
  currentMessagesByLanguage: {},
  historyMessagesByLanguage: {},
  currentLanguage: "en-US", // Default language
  loading: false,
  error: null,
};

export const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    fetchMessagesStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchMessagesSuccess: (
      state,
      action: PayloadAction<{
        messages: ChatMessageData[];
        language: string;
        isHistory?: boolean;
      }>
    ) => {
      state.loading = false;
      const { messages, language, isHistory = false } = action.payload;
      const normalizedLanguage = language.toLowerCase().includes("fi")
        ? "fi-FI"
        : language.toLowerCase().includes("vi")
        ? "vi-VN"
        : "en-US";

      console.log("Redux reducer: fetchMessagesSuccess called with:", {
        messagesCount: messages.length,
        language,
        normalizedLanguage,
        isHistory,
        currentState: { ...state },
      });

      // Store messages in the appropriate collection based on isHistory flag
      if (isHistory) {
        // Store history messages
        state.historyMessagesByLanguage[normalizedLanguage] = messages;
      } else {
        // Store current session messages
        // Check if we're adding a single message (user or AI message)
        const isSingleMessage = messages.length === 1;

        if (
          isSingleMessage &&
          state.currentMessagesByLanguage[normalizedLanguage]
        ) {
          // If we're adding a single message and we already have messages for this language,
          // append the new message to the existing array
          state.currentMessagesByLanguage[normalizedLanguage].push(messages[0]);
        } else {
          // Otherwise, replace the entire array
          state.currentMessagesByLanguage[normalizedLanguage] = messages;
        }
      }

      state.currentLanguage = normalizedLanguage;

      console.log("Redux reducer: After update, state is:", {
        currentMessagesKeys: Object.keys(state.currentMessagesByLanguage),
        historyMessagesKeys: Object.keys(state.historyMessagesByLanguage),
        currentMessagesCount:
          state.currentMessagesByLanguage[normalizedLanguage]?.length || 0,
        historyMessagesCount:
          state.historyMessagesByLanguage[normalizedLanguage]?.length || 0,
      });
    },
    fetchMessagesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // FIX: Transform LanguageInteraction into ChatMessageData
    addInteractionMessages: (
      state,
      action: PayloadAction<LanguageInteraction & { isHistory?: boolean }>
    ) => {
      const interaction = action.payload;
      const isHistory = interaction.isHistory || false;

      // Ensure required fields exist (optional safety check)
      if (
        !interaction.id ||
        !interaction.userMessage ||
        !interaction.aiResponse
      ) {
        console.error(
          "Attempted to add interaction with missing data:",
          interaction
        );
        return;
      }

      // Ensure createdAt is a valid ISO string (it should be from your type)
      const timestamp =
        typeof interaction.createdAt === "string"
          ? interaction.createdAt
          : new Date().toISOString(); // Fallback, but ideally createdAt is always valid

      // Get the language from the interaction or use current language
      const rawLanguage = interaction.language || state.currentLanguage;
      const language = normalizeLanguageCode(rawLanguage);

      console.log("Adding interaction with language:", {
        rawLanguage,
        normalizedLanguage: language,
        isHistory,
      });

      // Create User Message object
      const userMessageData: ChatMessageData = {
        id: interaction.id, // Use interaction ID for the user part
        sender: "User",
        content: interaction.userMessage,
        timestamp: timestamp,
        isHistoryMessage: isHistory,
      };

      // Create AI Message object
      const aiMessageData: ChatMessageData = {
        id: `${interaction.id}-ai`, // Create a unique ID for the AI part
        sender: "AI",
        content: interaction.aiResponse,
        timestamp: timestamp, // Use the same timestamp as the interaction
        isHistoryMessage: isHistory,
      };

      // Determine which collection to use based on isHistory flag
      if (isHistory) {
        // Initialize the history language array if it doesn't exist
        if (!state.historyMessagesByLanguage[language]) {
          state.historyMessagesByLanguage[language] = [];
        }

        // Add both messages to the beginning of the history language-specific array
        state.historyMessagesByLanguage[language].unshift(aiMessageData);
        state.historyMessagesByLanguage[language].unshift(userMessageData);
      } else {
        // Initialize the current language array if it doesn't exist
        if (!state.currentMessagesByLanguage[language]) {
          state.currentMessagesByLanguage[language] = [];
        }

        // Add both messages to the beginning of the current language-specific array
        state.currentMessagesByLanguage[language].unshift(aiMessageData);
        state.currentMessagesByLanguage[language].unshift(userMessageData);
      }

      // Update current language
      state.currentLanguage = language;
    },
    clearMessages: (state) => {
      // Clear both current and history messages
      state.currentMessagesByLanguage = {};
      state.historyMessagesByLanguage = {};
    },
    clearLanguageMessages: (
      state,
      action: PayloadAction<{ language: string; clearHistory?: boolean }>
    ) => {
      const { language: rawLanguage, clearHistory = false } = action.payload;
      // Normalize language code for consistency
      const language = normalizeLanguageCode(rawLanguage);

      console.log("Clearing messages for language:", {
        rawLanguage,
        normalizedLanguage: language,
        clearHistory,
      });

      // Clear current messages for the language
      if (state.currentMessagesByLanguage[language]) {
        state.currentMessagesByLanguage[language] = [];
      }

      // Clear history messages if requested
      if (clearHistory && state.historyMessagesByLanguage[language]) {
        state.historyMessagesByLanguage[language] = [];
      }
    },
    setCurrentLanguage: (state, action: PayloadAction<string>) => {
      const rawLanguage = action.payload;
      const normalizedLanguage = normalizeLanguageCode(rawLanguage);

      console.log("Setting current language:", {
        rawLanguage,
        normalizedLanguage,
      });

      state.currentLanguage = normalizedLanguage;
    },
  },
});

// Export all actions
export const {
  fetchMessagesStart,
  fetchMessagesSuccess,
  fetchMessagesFailure,
  addInteractionMessages,
  clearMessages,
  clearLanguageMessages,
  setCurrentLanguage,
} = languageSlice.actions;

export default languageSlice.reducer;

