import { createSlice, PayloadAction } from "@reduxjs/toolkit";
// Import types from new structure
import {
  ChatMessageData,
  LanguageInteraction,
  LanguageState,
} from "../types/LanguageAITypes";
import { normalizeLanguageCode } from "../utils/languageUtils";

const initialState: LanguageState = {
  messagesByLanguage: {},
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
      action: PayloadAction<{ messages: ChatMessageData[]; language: string }>
    ) => {
      state.loading = false;
      const { messages, language } = action.payload;
      const normalizedLanguage = normalizeLanguageCode(language);

      console.log("Redux reducer: fetchMessagesSuccess called with:", {
        messagesCount: messages.length,
        language,
        normalizedLanguage,
        currentState: { ...state },
      });

      // Store messages by normalized language code
      state.messagesByLanguage[normalizedLanguage] = messages;
      state.currentLanguage = normalizedLanguage;

      console.log("Redux reducer: After update, state is:", {
        messagesByLanguageKeys: Object.keys(state.messagesByLanguage),
        messagesForCurrentLang:
          state.messagesByLanguage[normalizedLanguage]?.length || 0,
      });
    },
    fetchMessagesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // FIX: Transform LanguageInteraction into ChatMessageData
    addInteractionMessages: (
      state,
      action: PayloadAction<LanguageInteraction>
    ) => {
      const interaction = action.payload;

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
      });

      // Create User Message object
      const userMessageData: ChatMessageData = {
        id: interaction.id, // Use interaction ID for the user part
        sender: "User",
        content: interaction.userMessage,
        timestamp: timestamp,
      };

      // Create AI Message object
      const aiMessageData: ChatMessageData = {
        id: `${interaction.id}-ai`, // Create a unique ID for the AI part
        sender: "AI",
        content: interaction.aiResponse,
        timestamp: timestamp, // Use the same timestamp as the interaction
      };

      // Initialize the language array if it doesn't exist
      if (!state.messagesByLanguage[language]) {
        state.messagesByLanguage[language] = [];
      }

      // Add both messages to the beginning of the language-specific array
      state.messagesByLanguage[language].unshift(aiMessageData);
      state.messagesByLanguage[language].unshift(userMessageData);

      // Update current language
      state.currentLanguage = language;
    },
    clearMessages: (state) => {
      state.messagesByLanguage = {};
    },
    clearLanguageMessages: (state, action: PayloadAction<string>) => {
      const rawLanguage = action.payload;
      const language = normalizeLanguageCode(rawLanguage);

      console.log("Clearing messages for language:", {
        rawLanguage,
        normalizedLanguage: language,
      });

      if (state.messagesByLanguage[language]) {
        state.messagesByLanguage[language] = [];
      }
      // Note: Removed reference to state.messages which doesn't exist in the state type
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

