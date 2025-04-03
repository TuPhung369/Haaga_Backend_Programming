import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LanguageInteraction } from '../../models/LanguageAI';

export interface LanguageState {
  messages: LanguageInteraction[];
  loading: boolean;
  error: string | null;
}

const initialState: LanguageState = {
  messages: [],
  loading: false,
  error: null,
};

// Helper function to serialize dates in the LanguageInteraction objects
const serializeInteraction = (interaction: LanguageInteraction): LanguageInteraction => {
  if (!interaction) return interaction;

  return {
    ...interaction,
    // Convert Date to ISO string if it exists, otherwise use current date string
    createdAt: interaction.createdAt instanceof Date
      ? interaction.createdAt.toISOString()
      : (typeof interaction.createdAt === 'string'
        ? interaction.createdAt
        : new Date().toISOString())
  };
};

export const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    fetchMessagesStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchMessagesSuccess: (state, action: PayloadAction<LanguageInteraction[]>) => {
      // Serialize each message to ensure dates are stored as strings
      state.messages = action.payload.map(serializeInteraction);
      state.loading = false;
      state.error = null;
    },
    fetchMessagesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    addMessage: (state, action: PayloadAction<LanguageInteraction>) => {
      // Ensure the message has required fields
      if (!action.payload.sessionId) {
        console.error('Attempted to add message without sessionId');
        return;
      }
      // Serialize the message before adding to state
      state.messages.unshift(serializeInteraction(action.payload)); // Add to beginning of array for newest messages first
    },
    clearMessages: (state) => {
      state.messages = [];
    }
  }
});

export const {
  fetchMessagesStart,
  fetchMessagesSuccess,
  fetchMessagesFailure,
  addMessage,
  clearMessages
} = languageSlice.actions;

export default languageSlice.reducer; 