export interface ChatMessage {
  id?: number;
  content: string;
  sender: string;
  timestamp?: number[] | string;
  sessionId: string;
}

export enum MessageSender {
  USER = "USER",
  AI = "AI"
} 