import axios from "axios";
import { handleServiceError } from "./baseService";
import store from "../store/store";
import { InternalAxiosRequestConfig } from "axios";

// Use the same API_URL as in baseService.ts
const API_BASE_URI =
  import.meta.env.VITE_API_BASE_URI || "http://localhost:9095/identify_service";

const apiClient = axios.create({
  baseURL: API_BASE_URI,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add request interceptor to add authorization header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface Message {
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
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  status: "online" | "offline" | "away" | "busy";
  unreadCount: number;
  lastMessage?: string;
  group?: string;
  contactStatus?: "PENDING" | "ACCEPTED" | "BLOCKED" | "REJECTED";
}

// Get all contacts
export const getContacts = async (): Promise<Contact[]> => {
  try {
    const response = await apiClient.get(`/chat/contacts`);
    return response.data;
  } catch (error) {
    console.error("Error fetching contacts:", error);
    throw handleServiceError(error);
  }
};

// Get messages with a specific contact
export const getMessages = async (contactId: string): Promise<Message[]> => {
  try {
    // Use the correct endpoint path that matches the backend controller
    const response = await apiClient.get(`/chat/messages/${contactId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw handleServiceError(error);
  }
};

// Send a message
export const sendMessage = async (
  content: string,
  receiverId: string,
  persistent: boolean = true
): Promise<Message> => {
  try {
    const response = await apiClient.post(`/chat/messages`, {
      content,
      receiverId,
      persistent,
    });
    return response.data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw handleServiceError(error);
  }
};

// Edit a message
export const editMessage = async (
  messageId: string,
  content: string
): Promise<Message> => {
  try {
    const response = await apiClient.put(`/chat/messages/${messageId}`, {
      content,
    });
    return response.data;
  } catch (error) {
    console.error("Error editing message:", error);
    throw handleServiceError(error);
  }
};

// Delete a message
export const deleteMessage = async (messageId: string): Promise<void> => {
  try {
    await apiClient.delete(`/chat/messages/${messageId}`);
  } catch (error) {
    console.error("Error deleting message:", error);
    throw handleServiceError(error);
  }
};

// Mark messages as read
export const markMessagesAsRead = async (contactId: string): Promise<void> => {
  try {
    console.log(
      `[ChatService] STARTING HTTP API CALL to mark messages as read for contact: ${contactId}`
    );
    const response = await apiClient.post(
      `/chat/messages/read/${contactId}`,
      {}
    );
    console.log(
      `[ChatService] DATABASE UPDATED SUCCESSFULLY via HTTP API for contact: ${contactId}`,
      response
    );
    return response.data;
  } catch (error) {
    console.error(
      `[ChatService] ERROR UPDATING DATABASE via HTTP API for contact: ${contactId}`,
      error
    );
    throw handleServiceError(error);
  }
};

// Add a contact by email
export const addContactByEmail = async (email: string): Promise<Contact> => {
  try {
    const response = await apiClient.post(`/chat/contacts`, {
      email,
    });
    return response.data;
  } catch (error) {
    console.error("Error adding contact:", error);
    throw handleServiceError(error);
  }
};

// Get unread message count
export const getUnreadMessageCount = async (): Promise<number> => {
  try {
    const response = await apiClient.get(`/chat/messages/unread/count`);
    return response.data.count;
  } catch (error) {
    console.error("Error fetching unread message count:", error);
    throw handleServiceError(error);
  }
};

// Update contact group
export const updateContactGroup = async (
  contactId: string,
  group: string
): Promise<Contact> => {
  try {
    const response = await apiClient.post(`/chat/contacts/${contactId}/group`, {
      group,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating contact group:", error);
    throw handleServiceError(error);
  }
};

// Update contact display name
export const updateContactDisplayName = async (
  contactId: string,
  displayName: string
): Promise<Contact> => {
  try {
    const response = await apiClient.post(
      `/chat/contacts/${contactId}/displayname`,
      {
        displayName,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating contact display name:", error);
    throw handleServiceError(error);
  }
};

// Get pending contact requests
export const getPendingContactRequests = async (): Promise<Contact[]> => {
  try {
    const response = await apiClient.get(`/chat/contacts/pending`);
    return response.data;
  } catch (error) {
    console.error("Error fetching pending contact requests:", error);
    throw handleServiceError(error);
  }
};

// Respond to a contact request (accept or reject)
export const respondToContactRequest = async (
  contactId: string,
  action: "accept" | "reject"
): Promise<Contact> => {
  try {
    const response = await apiClient.post(
      `/chat/contacts/${contactId}/respond`,
      {
        action,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error responding to contact request:", error);
    throw handleServiceError(error);
  }
};

