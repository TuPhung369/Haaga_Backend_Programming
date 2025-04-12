// src/types/AssistantAITypes.ts
// Types related to the AI Assistant functionality

export interface ChatMessageAI {
  id?: number;
  content: string;
  sender: string;
  timestamp?: number[] | string;
  sessionId: string;
}

export enum MessageSender {
  USER = "USER",
  AI = "AI",
}

export interface AssistantAIState {
  messages: ChatMessageAI[];
  loading: boolean;
  hasMore: boolean;
  page: number;
  size: number;
}

