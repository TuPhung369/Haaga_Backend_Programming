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
  metadata?: {
    isForwarded?: boolean;
    originalMessageId?: string;
    forwardedAt?: string;
    originalContactId?: string;
    isGroupMessage?: boolean;
    groupId?: string;
  };
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
  isGroup?: boolean; // Flag to indicate if this is a group chat
  members?: string[]; // Array of member IDs for group chats
  avatar?: string; // Avatar URL for the contact or group
}

export interface ChatGroup {
  id: string;
  name: string;
  members: ChatContact[];
  createdBy: string;
  createdAt: string;
  unreadCount: number;
  lastMessage?: string;
  avatar?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  contacts: ChatContact[];
  pendingRequests: ChatContact[];
  groups: ChatGroup[];
  selectedContact: ChatContact | null;
  loading: boolean;
  error: string | null;
  messageDeleted?: boolean; // Flag to indicate a message was deleted
}

export interface AddContactPayload {
  email: string;
}

export interface SendMessagePayload {
  content: string;
  receiverId: string;
  persistent?: boolean;
  isGroupMessage?: boolean;
}

export interface MarkAsReadPayload {
  contactId: string;
}

export interface CreateGroupPayload {
  name: string;
  memberIds: string[];
  avatar?: string;
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

