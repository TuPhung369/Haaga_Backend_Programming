// src/types/ChatTypes.ts
// Combined types for Chat, Messages, and Contacts

// ===== Chat Types =====
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
  persistent?: boolean;
  _updateKey?: number; // Added for forcing re-renders
}

export interface ChatContact {
  id: string;
  name: string;
  email: string;
  status: "online" | "offline" | "away" | "busy";
  unreadCount: number;
  lastMessage?: string;
  group?: string; // Group categorization (Friend, College, Family, etc.)
  contactStatus?: "PENDING" | "ACCEPTED" | "BLOCKED" | "REJECTED";
  _updateKey?: number; // Added for forcing re-renders
}

export interface ChatState {
  messages: ChatMessage[];
  contacts: ChatContact[];
  pendingRequests: ChatContact[];
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
  persistent?: boolean;
}

export interface MarkAsReadPayload {
  contactId: string;
}

// ===== Message Types =====
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

// ===== Contact Types =====
export interface Contact {
  id: string;
  name: string;
  email: string;
  status: "online" | "offline" | "away" | "busy";
  lastSeen?: string;
}

export interface ContactState {
  contacts: Contact[];
  selectedContact: Contact | null;
  loading: boolean;
  error: string | null;
}

