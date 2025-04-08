import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// Import both types
import { ChatMessageData, LanguageInteraction } from '../../type/languageAI';

interface LanguageState {
  messages: ChatMessageData[];
  loading: boolean;
  error: string | null;
}

const initialState: LanguageState = {
  messages: [],
  loading: false,
  error: null,
};

export const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    fetchMessagesStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchMessagesSuccess: (state, action: PayloadAction<ChatMessageData[]>) => {
      state.loading = false;
      // Payload is already ChatMessageData[], assign directly
      state.messages = action.payload;
    },
    fetchMessagesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // FIX: Transform LanguageInteraction into ChatMessageData
    addInteractionMessages: (state, action: PayloadAction<LanguageInteraction>) => {
      const interaction = action.payload;

      // Ensure required fields exist (optional safety check)
      if (!interaction.id || !interaction.userMessage || !interaction.aiResponse) {
        console.error('Attempted to add interaction with missing data:', interaction);
        return;
      }

      // Ensure createdAt is a valid ISO string (it should be from your type)
      const timestamp = typeof interaction.createdAt === 'string'
        ? interaction.createdAt
        : new Date().toISOString(); // Fallback, but ideally createdAt is always valid

      // Create User Message object
      const userMessageData: ChatMessageData = {
        id: interaction.id, // Use interaction ID for the user part
        sender: 'User',
        content: interaction.userMessage,
        timestamp: timestamp,
      };

      // Create AI Message object
      const aiMessageData: ChatMessageData = {
        id: `${interaction.id}-ai`, // Create a unique ID for the AI part
        sender: 'AI',
        content: interaction.aiResponse,
        timestamp: timestamp, // Use the same timestamp as the interaction
      };

      // Add both messages to the beginning (or end, depending on desired order)
      // Unshift adds to beginning (newest first display)
      state.messages.unshift(aiMessageData);
      state.messages.unshift(userMessageData);

      // Or push to add to end (oldest first display)
      // state.messages.push(userMessageData);
      // state.messages.push(aiMessageData);
    },
    clearMessages: (state) => {
      state.messages = [];
    }
  }
});

// Rename the exported action for clarity
export const {
  fetchMessagesStart,
  fetchMessagesSuccess,
  fetchMessagesFailure,
  addInteractionMessages, // Renamed export
  clearMessages
} = languageSlice.actions;

export default languageSlice.reducer;