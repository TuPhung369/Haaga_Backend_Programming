import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChatMessageAI, AssistantAIState } from "../types/AssistantAITypes";

const initialState: AssistantAIState = {
  messages: [],
  loading: false,
  hasMore: true,
  page: 0,
  size: 10, // Giảm kích thước mặc định xuống 10 tin nhắn
};

const assistantAISlice = createSlice({
  name: "assistantAI",
  initialState,
  reducers: {
    setMessages: (state, action: PayloadAction<ChatMessageAI[]>) => {
      console.log("Redux: Setting messages", action.payload);
      state.messages = action.payload;
    },
    addMessage: (state, action: PayloadAction<ChatMessageAI>) => {
      console.log("Redux: Adding user message", action.payload);
      state.messages.push(action.payload);
    },
    addAIResponse: (state, action: PayloadAction<ChatMessageAI>) => {
      console.log("Redux: Adding AI response", action.payload);
      state.messages.push(action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setHasMore: (state, action: PayloadAction<boolean>) => {
      state.hasMore = action.payload;
    },
    incrementPage: (state) => {
      state.page += 1;
    },
    clearMessages: (state) => {
      state.messages = [];
      state.page = 0;
      state.hasMore = true;
    },
  },
});

export const {
  setMessages,
  addMessage,
  addAIResponse,
  setLoading,
  setHasMore,
  incrementPage,
  clearMessages,
} = assistantAISlice.actions;

export default assistantAISlice.reducer;

