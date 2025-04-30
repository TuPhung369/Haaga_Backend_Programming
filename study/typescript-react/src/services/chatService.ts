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
    isGroupMessage?: boolean;
    groupId?: string;
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
  isGroup?: boolean;
  members?: string[];
  avatar?: string;
}

export interface Group {
  id: string;
  name: string;
  members: Contact[];
  group?: string;
  createdBy: string;
  createdAt: string;
  unreadCount: number;
  lastMessage?: string;
  avatar?: string;
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
  persistent: boolean = true,
  isGroup: boolean = false
): Promise<Message> => {
  try {
    console.log("[ChatService] sendMessage called with params:", {
      content: content.substring(0, 20) + "...",
      receiverId,
      persistent,
      isGroup,
      isGroupType: typeof isGroup,
    });

    // CRITICAL CHECK: Always verify if this is a group message first
    // If isGroup flag is explicitly set, use the group message endpoint
    if (isGroup === true) {
      console.log(
        "[ChatService] isGroup flag is true, redirecting to sendGroupMessage"
      );
      return sendGroupMessage(content, receiverId);
    }

    // ADDITIONAL SAFETY CHECK: Check if this might be a group ID by looking at the store
    const state = store.getState();
    const groups = state.chat.groups || [];

    // CRITICAL: Log all groups for debugging
    console.log(
      "[ChatService] CRITICAL DEBUG - All groups in store:",
      JSON.stringify(
        groups.map((g) => ({ id: g.id, name: g.name })),
        null,
        2
      )
    );
    console.log(
      "[ChatService] CRITICAL DEBUG - Checking if receiverId is a group:",
      receiverId
    );

    // Log all groups for debugging
    console.log(
      "[ChatService] All groups in store:",
      groups.map((g) => ({ id: g.id, name: g.name }))
    );

    // CRITICAL: Check if receiverId matches any group ID - use strict equality and string comparison
    // First convert all IDs to strings to ensure consistent comparison
    const receiverIdStr = String(receiverId);

    // Check using multiple methods to be absolutely sure
    const matchingGroup = groups.find(
      (group) => String(group.id) === receiverIdStr
    );
    const matchingGroupAlt = groups.some(
      (group) => String(group.id) === receiverIdStr
    );
    const matchingGroupIndex = groups.findIndex(
      (group) => String(group.id) === receiverIdStr
    );

    console.log("[ChatService] CRITICAL DEBUG - Group detection results:", {
      matchingGroup: matchingGroup ? matchingGroup.name : null,
      matchingGroupAlt,
      matchingGroupIndex,
      receiverIdStr,
      groupIds: groups.map((g) => String(g.id)),
    });

    // If ANY of our checks indicate this is a group, use the group endpoint
    if (matchingGroup || matchingGroupAlt || matchingGroupIndex >= 0) {
      console.log(
        "[ChatService] CRITICAL OVERRIDE: Detected receiverId as a group ID from store:",
        matchingGroup ? matchingGroup.name : "Unknown Group"
      );
      console.log(
        "[ChatService] Redirecting to sendGroupMessage for group ID:",
        receiverIdStr
      );

      // FORCE use of group message endpoint
      return sendGroupMessage(content, receiverIdStr);
    }

    // ADDITIONAL SAFETY: Check if the selected contact in Redux has isGroup=true
    const selectedContact = state.chat.selectedContact;
    if (
      selectedContact &&
      String(selectedContact.id) === receiverIdStr &&
      selectedContact.isGroup === true
    ) {
      console.log(
        "[ChatService] CRITICAL OVERRIDE: Selected contact has isGroup=true"
      );
      return sendGroupMessage(content, receiverIdStr);
    }

    // This is a direct message
    console.log(
      "[ChatService] Confirmed this is a direct message to user:",
      receiverId
    );
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

// Mark group messages as read
export const markGroupMessagesAsRead = async (
  groupId: string
): Promise<void> => {
  // Validate groupId
  if (!groupId || groupId.trim() === "") {
    console.error("[ChatService] Invalid group ID provided");
    throw new Error("Invalid group ID");
  }

  try {
    console.log(
      `[ChatService] STARTING HTTP API CALL to mark messages as read for group: ${groupId}`
    );

    // Check if the group exists in the store before making the API call
    const state = store.getState();
    const groups = state.chat.groups || [];
    const groupExists = groups.some((group) => group.id === groupId);

    if (!groupExists) {
      console.warn(
        `[ChatService] Group ${groupId} not found in local store. API call may fail.`
      );
    }

    const response = await apiClient.post(
      `/chat/groups/${groupId}/messages/read`,
      {}
    );
    console.log(
      `[ChatService] DATABASE UPDATED SUCCESSFULLY via HTTP API for group: ${groupId}`,
      response
    );
    return response.data;
  } catch (error) {
    console.error(
      `[ChatService] ERROR UPDATING DATABASE via HTTP API for group: ${groupId}`,
      error
    );
    // Handle the error but don't throw it to prevent UI disruption
    handleServiceError(error);
    // Return empty to indicate completion without success
    return;
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

// Remove a contact
export const removeContact = async (contactId: string): Promise<void> => {
  try {
    console.log(`[ChatService] Removing contact with ID: ${contactId}`);
    console.log(
      `[ChatService] API URL: ${API_BASE_URI}/chat/contacts/${contactId}`
    );

    // Get the current token for debugging
    const token = store.getState().auth.token;
    console.log(
      `[ChatService] Using auth token: ${
        token ? token.substring(0, 15) + "..." : "none"
      }`
    );

    // Use the DELETE endpoint we implemented in the backend
    const response = await apiClient.delete(`/chat/contacts/${contactId}`);
    console.log(`[ChatService] Contact removed successfully:`, response.data);
    return;
  } catch (error: unknown) {
    console.error("Error removing contact:", error);
    // Log more details about the error
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response
    ) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const axiosError = error as {
        response: {
          status: number;
          data: Record<string, unknown>;
          headers: Record<string, string>;
        };
      };

      console.error(
        `[ChatService] Error status: ${axiosError.response.status}`
      );
      console.error(`[ChatService] Error data:`, axiosError.response.data);
      console.error(
        `[ChatService] Error headers:`,
        axiosError.response.headers
      );

      // If it's a 500 error, try a direct axios call as a fallback
      if (axiosError.response.status === 500) {
        console.log(
          `[ChatService] Received 500 error, attempting direct axios call as fallback`
        );
        try {
          // Import axios directly
          const axios = await import("axios");

          // Get the token from the store
          const currentToken = store.getState().auth.token;

          // Make a direct API call to the contact endpoint
          const directResponse = await axios.default.delete(
            `${API_BASE_URI}/chat/contacts/${contactId}`,
            {
              headers: {
                Authorization: `Bearer ${currentToken}`,
                "Content-Type": "application/json",
              },
              withCredentials: true,
            }
          );

          console.log(
            `[ChatService] Direct API call successful:`,
            directResponse.data
          );
          return;
        } catch (directError) {
          console.error(
            `[ChatService] Direct API call also failed:`,
            directError
          );
          // Continue to throw the original error
        }
      }
    } else if (error && typeof error === "object" && "request" in error) {
      // The request was made but no response was received
      console.error(
        `[ChatService] No response received:`,
        (error as { request: Record<string, unknown> }).request
      );
    } else if (error && typeof error === "object" && "message" in error) {
      // Something happened in setting up the request that triggered an Error
      console.error(
        `[ChatService] Error message:`,
        (error as { message: string }).message
      );
    } else {
      // Unknown error type
      console.error(`[ChatService] Unknown error type:`, error);
    }

    // For 500 errors, we'll return success anyway since the UI will handle it
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "status" in error.response &&
      error.response.status === 500
    ) {
      console.log(
        `[ChatService] Returning success despite 500 error to allow UI to handle it`
      );
      return;
    }

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

    // Send the message to each recipient individually
    const forwardPromises = filteredRecipients.map((recipientId) => {
      console.log(`[ChatService] Forwarding to ${recipientId}`);

      // Check if the recipient is a group by looking at the store
      const state = store.getState();
      const groups = state.chat.groups || [];
      const isGroup = groups.some((group) => group.id === recipientId);

      console.log(
        `[ChatService] Recipient ${recipientId} is a group: ${isGroup}`
      );

      // Use the appropriate function based on whether this is a group or not
      const sendPromise = isGroup
        ? sendGroupMessage(messageContent, recipientId)
        : sendMessage(messageContent, recipientId, true, false);

      // Always persist messages for other contacts, but add metadata to indicate this is a forwarded message
      return sendPromise.then((message) => {
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

// Group-related API functions

// Get all groups
export const getGroups = async (): Promise<Group[]> => {
  try {
    const response = await apiClient.get(`/chat/groups`);
    return response.data;
  } catch (error) {
    console.error("Error fetching groups:", error);
    throw handleServiceError(error);
  }
};

// Create a new group
export const createGroup = async (
  name: string,
  memberIds: string[],
  avatar?: string
): Promise<Group> => {
  try {
    const response = await apiClient.post(`/chat/groups`, {
      name,
      memberIds,
      avatar,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating group:", error);
    throw handleServiceError(error);
  }
};

// Get group details
export const getGroupDetails = async (groupId: string): Promise<Group> => {
  try {
    const response = await apiClient.get(`/chat/groups/${groupId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching group details:", error);
    throw handleServiceError(error);
  }
};

// Update group details
export const updateGroup = async (
  groupId: string,
  updates: {
    name?: string;
    avatar?: string;
    group?: string;
  }
): Promise<Group> => {
  try {
    const response = await apiClient.put(`/chat/groups/${groupId}`, updates);
    return response.data;
  } catch (error) {
    console.error("Error updating group:", error);
    throw handleServiceError(error);
  }
};

// Update group tag
export const updateGroupTag = async (
  groupId: string,
  group: string
): Promise<Group> => {
  try {
    return await updateGroup(groupId, { group });
  } catch (error) {
    console.error("Error updating group tag:", error);
    throw handleServiceError(error);
  }
};

// Add members to a group
export const addGroupMembers = async (
  groupId: string,
  memberIds: string[]
): Promise<Group> => {
  try {
    const response = await apiClient.post(`/chat/groups/${groupId}/members`, {
      memberIds,
    });
    return response.data;
  } catch (error) {
    console.error("Error adding group members:", error);
    throw handleServiceError(error);
  }
};

// Remove members from a group
export const removeGroupMember = async (
  groupId: string,
  memberId: string
): Promise<Group> => {
  try {
    const response = await apiClient.delete(
      `/chat/groups/${groupId}/members/${memberId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error removing group member:", error);
    throw handleServiceError(error);
  }
};

// Leave a group
export const leaveGroup = async (groupId: string): Promise<void> => {
  try {
    await apiClient.post(`/chat/groups/${groupId}/leave`);
  } catch (error) {
    console.error("Error leaving group:", error);
    throw handleServiceError(error);
  }
};

// Delete a group (admin only)
export const deleteGroup = async (groupId: string): Promise<void> => {
  try {
    await apiClient.delete(`/chat/groups/${groupId}`);
  } catch (error) {
    console.error("Error deleting group:", error);
    throw handleServiceError(error);
  }
};

// Send a message to a group
export const sendGroupMessage = async (
  content: string,
  groupId: string
): Promise<Message> => {
  try {
    console.log("[ChatService] sendGroupMessage called with params:", {
      content: content.substring(0, 20) + "...",
      groupId,
    });

    // Validate inputs
    if (!content || content.trim() === "") {
      console.error("[ChatService] Empty content provided to sendGroupMessage");
      throw new ServiceError("Message content cannot be empty", {
        errorType: ErrorType.VALIDATION,
      });
    }

    if (!groupId || groupId.trim() === "") {
      console.error("[ChatService] Empty groupId provided to sendGroupMessage");
      throw new ServiceError("Group ID cannot be empty", {
        errorType: ErrorType.VALIDATION,
      });
    }

    // Log the endpoint we're using
    const endpoint = `/chat/groups/${groupId}/messages`;
    console.log("[ChatService] Using group-specific endpoint:", endpoint);

    // Get the token for logging purposes
    const token = store.getState().auth.token;
    console.log("[ChatService] Token available:", !!token);

    try {
      // Make the API call with detailed error handling
      const response = await apiClient.post(endpoint, {
        content,
      });

      console.log("[ChatService] Group message sent successfully:", {
        responseStatus: response.status,
        responseId: response.data?.id,
        responseData: response.data,
      });

      // Ensure we have a valid response
      if (!response.data) {
        console.error(
          "[ChatService] Empty response data from group message API"
        );
        throw new ServiceError("Empty response from server", {
          errorType: ErrorType.SERVER_ERROR,
        });
      }

      return {
        ...response.data,
        metadata: {
          isGroupMessage: true,
          groupId,
        },
      };
    } catch (apiError) {
      console.error("[ChatService] API error in sendGroupMessage:", apiError);

      // Try a direct axios call as a fallback
      console.log("[ChatService] Attempting direct axios call as fallback");

      const directResponse = await axios.post(
        `${API_BASE_URI}/chat/groups/${groupId}/messages`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      console.log("[ChatService] Direct axios call successful:", {
        responseStatus: directResponse.status,
        responseData: directResponse.data,
      });

      return {
        ...directResponse.data,
        metadata: {
          isGroupMessage: true,
          groupId,
        },
      };
    }
  } catch (error) {
    console.error("[ChatService] Error sending group message:", error);

    // Log detailed error information
    if (error instanceof Error) {
      console.error("[ChatService] Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    // Throw a more specific error
    if (error instanceof ServiceError) {
      throw error;
    } else {
      throw new ServiceError(
        "Failed to send group message. Please try again.",
        {
          errorType: ErrorType.UNKNOWN,
          originalError: error,
        }
      );
    }
  }
};

// Get messages for a group
export const getGroupMessages = async (groupId: string): Promise<Message[]> => {
  try {
    const response = await apiClient.get(`/chat/groups/${groupId}/messages`);
    return response.data.map((message: Message) => ({
      ...message,
      metadata: {
        ...message.metadata,
        isGroupMessage: true,
        groupId,
      },
    }));
  } catch (error) {
    console.error("Error fetching group messages:", error);
    throw handleServiceError(error);
  }
};

