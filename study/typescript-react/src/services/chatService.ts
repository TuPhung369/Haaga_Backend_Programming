import axios from "axios";
import { handleServiceError } from "./baseService";
import store from "../store/store";
import { InternalAxiosRequestConfig } from "axios";

const API_BASE_URI = import.meta.env.VITE_API_BASE_URI;

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
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  status: "online" | "offline" | "away";
  unreadCount: number;
  lastMessage?: string;
  group?: string;
}

// Get all contacts
export const getContacts = async (): Promise<Contact[]> => {
  try {
    const response = await apiClient.get(`/api/chat/contacts`);
    return response.data;
  } catch (error) {
    console.error("Error fetching contacts:", error);
    throw handleServiceError(error);
  }
};

// Get messages with a specific contact
export const getMessages = async (contactId: string): Promise<Message[]> => {
  try {
    const response = await apiClient.get(`/api/chat/messages/${contactId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw handleServiceError(error);
  }
};

// Send a message
export const sendMessage = async (
  content: string,
  receiverId: string
): Promise<Message> => {
  try {
    const response = await apiClient.post(`/api/chat/messages`, {
      content,
      receiverId,
    });
    return response.data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw handleServiceError(error);
  }
};

// Mark messages as read
export const markMessagesAsRead = async (contactId: string): Promise<void> => {
  try {
    await apiClient.post(`/api/chat/messages/read/${contactId}`, {});
  } catch (error) {
    console.error("Error marking messages as read:", error);
    throw handleServiceError(error);
  }
};

// Add a contact by email
export const addContactByEmail = async (email: string): Promise<Contact> => {
  try {
    const response = await apiClient.post(`/api/chat/contacts`, {
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
    const response = await apiClient.get(`/api/chat/messages/unread/count`);
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
    const response = await apiClient.post(
      `/api/chat/contacts/${contactId}/group`,
      {
        group,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating contact group:", error);
    throw handleServiceError(error);
  }
};

