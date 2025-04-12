// src/types/MessageTypes.ts
// Types related to messaging functionality

export interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
}

export interface MessageState {
  messages: Message[];
  loading: boolean;
  error: string | null;
}
