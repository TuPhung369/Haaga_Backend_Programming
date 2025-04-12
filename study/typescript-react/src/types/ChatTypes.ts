// src/types/ChatTypes.ts
export interface ChatMessage {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
  };
  receiver: {
    id: string;
    name: string;
  };
  timestamp: string;
  read: boolean;
}

export interface ChatContact {
  id: string;
  name: string;
  email: string;
  status: 'online' | 'offline' | 'away';
  unreadCount: number;
  lastMessage?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  contacts: ChatContact[];
  selectedContact: ChatContact | null;
  loading: boolean;
  error: string | null;
}

export interface AddContactPayload {
  email: string;
}

export interface SendMessagePayload {
  content: string;
  receiverId: string;
}

export interface MarkAsReadPayload {
  contactId: string;
}
