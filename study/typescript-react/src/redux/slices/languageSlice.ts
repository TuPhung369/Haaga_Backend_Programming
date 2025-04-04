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

// We no longer need these functions as the Service layer now handles all date conversions
// and createdAt is always a Date object

export const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    fetchMessagesStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchMessagesSuccess: (state, action: PayloadAction<LanguageInteraction[]>) => {
      state.loading = false;

      // All dates should already be Date objects now coming from the service layer
      state.messages = action.payload;
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

      // We no longer need serializeInteraction since createdAt is always a Date now
      // Just ensure createdAt is a Date object
      const message = {
        ...action.payload,
        createdAt: action.payload.createdAt instanceof Date
          ? action.payload.createdAt
          : new Date()
      };

      state.messages.unshift(message); // Add to beginning of array for newest messages first
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