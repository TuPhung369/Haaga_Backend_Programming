import axios from "axios";
import { handleServiceError, ServiceError, ErrorType } from "./baseService";
import store from "../store/store";
import { InternalAxiosRequestConfig } from "axios";

// Use the same API_URL as in baseService.ts
const API_BASE_URI =
  import.meta.env.VITE_API_BASE_URI || "http://localhost:9095/identify_service";

const apiClient = axios.create({
  baseURL: API_BASE_URI,
  headers: {
    "Content-Type": "application/json; charset=utf-8", // Thêm charset=utf-8 để đảm bảo xử lý Unicode đúng cách
  },
  withCredentials: true,
  transformRequest: [
    (data) => {
      // Đảm bảo dữ liệu được mã hóa đúng cách trước khi gửi
      if (data && typeof data === "object") {
        return JSON.stringify(data);
      }
      return data;
    },
  ],
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
  metadata?: {
    isForwarded?: boolean;
    originalMessageId?: string;
    forwardedAt?: string;
    originalContactId?: string;
  };
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
    // Ensure content is properly encoded for Unicode characters like emojis
    const response = await apiClient.post(`/chat/messages`, {
      content: content, // Pass content directly without additional encoding
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
    // Check specifically for 404 errors to provide a more descriptive message
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "status" in error.response &&
      error.response.status === 404
    ) {
      throw new ServiceError("This email doesn't exist in the system", {
        errorType: ErrorType.NOT_FOUND,
        httpStatus: 404,
      });
    }
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

// Forward a message to multiple recipients
export const forwardMessage = async (
  messageContent: string,
  recipientIds: string[],
  currentContactId?: string
): Promise<Message[]> => {
  try {
    console.log("[ChatService] ===== FORWARD MESSAGE SERVICE STARTED =====");
    console.log(
      "[ChatService] Message content:",
      messageContent.substring(0, 50) + "..."
    );
    console.log("[ChatService] Recipients for forwarding:", recipientIds);
    console.log("[ChatService] Current contact ID:", currentContactId);

    // If there are no recipients, return an empty array
    if (!recipientIds || recipientIds.length === 0) {
      console.log("[ChatService] No recipients to forward to");
      return [];
    }

    // Filter out the current contact from the recipients list
    // This is the key change - we won't even attempt to send to the current contact
    const filteredRecipients = currentContactId
      ? recipientIds.filter((id) => id !== currentContactId)
      : recipientIds;

    console.log(
      "[ChatService] After filtering out current contact, recipients:",
      filteredRecipients
    );

    // If all recipients were filtered out (only trying to forward to current contact)
    if (filteredRecipients.length === 0) {
      console.log(
        "[ChatService] All recipients were filtered out (only current contact)"
      );
      return [];
    }

    // Send the message to each recipient individually using the existing sendMessage function
    const forwardPromises = filteredRecipients.map((recipientId) => {
      console.log(`[ChatService] Forwarding to ${recipientId}`);
      // Always persist messages for other contacts, but add metadata to indicate this is a forwarded message
      return sendMessage(messageContent, recipientId, true).then((message) => {
        // Add metadata to the message to indicate it's a forwarded message
        // This will be used to filter out forwarded messages in the UI
        console.log(
          `[ChatService] Adding forwarded metadata to message:`,
          message.id
        );

        // We can't modify the message directly, so we'll return it as is
        // The metadata will be added in the Redux store
        return {
          ...message,
          metadata: {
            isForwarded: true,
            forwardedAt: new Date().toISOString(),
            originalContactId: currentContactId,
          },
        };
      });
    });

    // Wait for all messages to be sent
    const results = await Promise.all(forwardPromises);
    console.log("[ChatService] Forward results count:", results.length);
    console.log(
      "[ChatService] Forward results recipients:",
      results.map((r) => r.receiver?.id)
    );

    // Double-check to make sure no messages for current contact slipped through
    const finalResults = currentContactId
      ? results.filter((msg) => msg.receiver?.id !== currentContactId)
      : results;

    console.log(
      "[ChatService] Final filtered results count:",
      finalResults.length
    );
    return finalResults;
  } catch (error) {
    console.error("[ChatService] Error forwarding message:", error);
    throw handleServiceError(error);
  }
};

