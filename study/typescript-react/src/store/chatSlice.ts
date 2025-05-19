import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  getContacts,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  addContactByEmail,
  updateContactGroup,
  updateContactDisplayName,
  removeContact as removeContactService,
  updateGroupTag,
  getPendingContactRequests,
  respondToContactRequest,
  editMessage,
  deleteMessage,
  forwardMessage,
  getGroups,
  createGroup,
  getGroupDetails,
  updateGroup,
  addGroupMembers,
  removeGroupMember,
  leaveGroup,
  deleteGroup,
  sendGroupMessage,
  getGroupMessages,
  Message,
  Contact,
  Group,
} from "../services/chatService";
import { ChatState, ChatMessage, ChatContact } from "../types/ChatTypes";
import type { RootState } from "../types";
import { handleServiceError } from "../services/baseService";

// Helper functions to convert between service types and state types
const convertServiceMessageToChatMessage = (message: Message): ChatMessage => {
  return {
    id: message.id,
    content: message.content,
    sender: message.sender,
    receiver: message.receiver,
    timestamp: message.timestamp,
    read: message.read,
    persistent: message.persistent,
    metadata: message.metadata,
  };
};

const convertServiceContactToChatContact = (contact: Contact): ChatContact => {
  return {
    id: contact.id,
    name: contact.name,
    email: contact.email,
    status: contact.status,
    unreadCount: contact.unreadCount,
    lastMessage: contact.lastMessage,
    group: contact.group,
    contactStatus: contact.contactStatus,
  };
};

// Initial state
const initialState: ChatState = {
  messages: [],
  contacts: [],
  pendingRequests: [],
  groups: [],
  selectedContact: null,
  loading: false,
  error: null,
  messageDeleted: false,
};

// Group-related thunks
export const fetchGroupsThunk = createAsyncThunk(
  "chat/fetchGroups",
  async (_, { rejectWithValue }) => {
    try {
      const groups = await getGroups();
      return groups;
    } catch (error) {
      return rejectWithValue(handleServiceError(error));
    }
  }
);

export const createGroupThunk = createAsyncThunk(
  "chat/createGroup",
  async (
    {
      name,
      memberIds,
      avatar,
    }: { name: string; memberIds: string[]; avatar?: string },
    { rejectWithValue }
  ) => {
    try {
      const group = await createGroup(name, memberIds, avatar);
      return group;
    } catch (error) {
      return rejectWithValue(handleServiceError(error));
    }
  }
);

export const fetchGroupDetailsThunk = createAsyncThunk(
  "chat/fetchGroupDetails",
  async (groupId: string, { rejectWithValue }) => {
    try {
      const group = await getGroupDetails(groupId);
      return group;
    } catch (error) {
      return rejectWithValue(handleServiceError(error));
    }
  }
);

export const updateGroupThunk = createAsyncThunk(
  "chat/updateGroup",
  async (
    {
      groupId,
      updates,
    }: {
      groupId: string;
      updates: { name?: string; avatar?: string };
    },
    { rejectWithValue }
  ) => {
    try {
      const group = await updateGroup(groupId, updates);
      return group;
    } catch (error) {
      return rejectWithValue(handleServiceError(error));
    }
  }
);

export const addGroupMembersThunk = createAsyncThunk(
  "chat/addGroupMembers",
  async (
    { groupId, memberIds }: { groupId: string; memberIds: string[] },
    { rejectWithValue }
  ) => {
    try {
      const group = await addGroupMembers(groupId, memberIds);
      return group;
    } catch (error) {
      return rejectWithValue(handleServiceError(error));
    }
  }
);

export const removeGroupMemberThunk = createAsyncThunk(
  "chat/removeGroupMember",
  async (
    { groupId, memberId }: { groupId: string; memberId: string },
    { rejectWithValue }
  ) => {
    try {
      const group = await removeGroupMember(groupId, memberId);
      return group;
    } catch (error) {
      return rejectWithValue(handleServiceError(error));
    }
  }
);

export const leaveGroupThunk = createAsyncThunk(
  "chat/leaveGroup",
  async (groupId: string, { rejectWithValue }) => {
    try {
      await leaveGroup(groupId);
      return groupId;
    } catch (error) {
      return rejectWithValue(handleServiceError(error));
    }
  }
);

export const deleteGroupThunk = createAsyncThunk(
  "chat/deleteGroup",
  async (groupId: string, { rejectWithValue }) => {
    try {
      await deleteGroup(groupId);
      return groupId;
    } catch (error) {
      return rejectWithValue(handleServiceError(error));
    }
  }
);

export const sendGroupMessageThunk = createAsyncThunk(
  "chat/sendGroupMessage",
  async (
    {
      content,
      groupId,
      persistent,
    }: { content: string; groupId: string; persistent: boolean },
    { rejectWithValue, dispatch, getState }
  ) => {
    try {
      // Process the group message send request
      console.log(
        "[ChatSlice] DEBUG - sendGroupMessageThunk persistent value:",
        persistent,
        "type:",
        typeof persistent
      );

      // Create a temporary message to display immediately
      const state = getState() as RootState;
      const userInfo = state.user.userInfo;
      const groups = state.chat.groups;

      // Find the group by ID
      const group = groups.find((g) => g.id === groupId);

      if (userInfo) {
        const tempId = `temp-${Date.now()}`;

        const tempMessage: Message = {
          id: tempId,
          content: content,
          sender: {
            id: userInfo.id || "unknown",
            name: userInfo.username || "Me",
          },
          receiver: {
            id: groupId,
            name: group?.name || "Group",
          },
          timestamp: new Date().toISOString(),
          read: false,
          persistent: persistent === true, // Ensure it's a boolean
          metadata: {
            isGroupMessage: true,
            groupId: groupId,
          },
        };

        // Add the temporary message to the Redux store
        dispatch(addMessage(tempMessage));
      }

      // Now make the API call

      try {
        // Use persistent value directly - it's already a boolean from the component

        const message = await sendGroupMessage(content, groupId, persistent);
        // Group message API call successful
        return message;
      } catch (error) {
        console.error("[ChatSlice] Error in sendGroupMessage API call:", error);

        // Check if this is a ServiceError
        if (error instanceof Error) {
          console.error("[ChatSlice] Error details:", {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });
        }

        // Try a direct API call as a fallback
        try {
          console.log("[ChatSlice] Attempting direct API call as fallback");

          // Import axios for direct API call
          const axios = await import("axios");

          // Get the token from the current state
          const state = getState() as RootState;
          const token = state.auth.token;

          // Use persistent value directly for the direct call

          // Make a direct API call to the group endpoint
          const directResponse = await axios.default.post(
            `http://localhost:9095/identify_service/chat/groups/${groupId}/messages`,
            { content, persistent: persistent },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              withCredentials: true,
            }
          );

          console.log(
            "[ChatSlice] Direct API call response:",
            directResponse.data
          );
          return {
            ...directResponse.data,
            metadata: {
              isGroupMessage: true,
              groupId,
            },
          };
        } catch (directError) {
          console.error(
            "[ChatSlice] Direct API call also failed:",
            directError
          );
          return rejectWithValue(
            "Failed to send group message. Please try again."
          );
        }
      }
    } catch (error) {
      console.error("[ChatSlice] Outer error in sendGroupMessageThunk:", error);
      return rejectWithValue(
        "An unexpected error occurred while sending the message."
      );
    }
  }
);

export const fetchGroupMessagesThunk = createAsyncThunk(
  "chat/fetchGroupMessages",
  async (groupId: string, { rejectWithValue }) => {
    try {
      const messages = await getGroupMessages(groupId);
      return { groupId, messages };
    } catch (error) {
      return rejectWithValue(handleServiceError(error));
    }
  }
);

// Contact and message thunks
export const fetchContacts = createAsyncThunk(
  "chat/fetchContacts",
  async (_, { rejectWithValue }) => {
    try {
      return await getContacts();
    } catch (error: unknown) {
      try {
        handleServiceError(error);
      } catch (serviceError: unknown) {
        return rejectWithValue(
          serviceError instanceof Error
            ? serviceError.message
            : "Failed to fetch contacts"
        );
      }
    }
  }
);

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (contactId: string, { rejectWithValue }) => {
    try {
      return await getMessages(contactId);
    } catch (error: unknown) {
      try {
        handleServiceError(error);
      } catch (serviceError: unknown) {
        return rejectWithValue(
          serviceError instanceof Error
            ? serviceError.message
            : "Failed to fetch messages"
        );
      }
    }
  }
);

export const sendMessageThunk = createAsyncThunk(
  "chat/sendMessage",
  async (
    {
      content,
      receiverId,
      persistent,
      isGroup = false,
    }: {
      content: string;
      receiverId: string;
      persistent: boolean;
      isGroup?: boolean;
    },
    { rejectWithValue, dispatch, getState }
  ) => {
    try {
      // Process the message send request
      console.log(
        "[ChatSlice] DEBUG - sendMessageThunk persistent value:",
        persistent,
        "type:",
        typeof persistent
      );

      // Create a temporary message to display immediately
      const state = getState() as RootState;
      const userInfo = state.user.userInfo;
      const contacts = state.chat.contacts;

      // Find the contact by ID
      const contact = contacts.find((c) => c.id === receiverId);

      if (userInfo) {
        const tempId = `temp-${Date.now()}`;
        // Create a temporary message with a unique ID

        const tempMessage: Message = {
          id: tempId,
          content: content,
          sender: {
            id: userInfo.id || "unknown",
            name: userInfo.username || "Me",
          },
          receiver: {
            id: receiverId,
            name: contact?.name || "Contact",
          },
          timestamp: new Date().toISOString(),
          read: false,
          persistent: persistent,
          metadata: {
            isGroupMessage: isGroup,
            groupId: isGroup ? receiverId : undefined,
          },
        };

        // Add the temporary message to the Redux store
        dispatch(addMessage(tempMessage));
      }

      // Use persistent value directly - it's already a boolean from the component

      // Now make the API call
      return await sendMessage(content, receiverId, persistent, isGroup);
    } catch (error: unknown) {
      try {
        // Check if this is an authentication error (401)
        const isAuthError =
          error &&
          typeof error === "object" &&
          ((error as { response?: { status: number } }).response?.status ===
            401 ||
            (error as Error).message?.includes("401"));

        if (isAuthError) {
          console.log(
            "[ChatSlice] Authentication error detected, attempting token refresh"
          );

          try {
            // Import and call refreshToken
            const { refreshToken } = await import("../utils/tokenRefresh");
            const refreshed = await refreshToken(true);

            if (refreshed) {
              console.log(
                "[ChatSlice] Token refreshed successfully, retrying message send"
              );
              // Wait a moment for the token to be properly set in the store
              await new Promise((resolve) => setTimeout(resolve, 500));

              // Retry sending the message
              return await sendMessage(content, receiverId, persistent);
            }
          } catch (refreshError) {
            console.error(
              "[ChatSlice] Error during token refresh:",
              refreshError
            );
            // Continue to error handling below
          }
        }

        // If we get here, either it wasn't an auth error or the refresh/retry failed
        handleServiceError(error);
      } catch (serviceError: unknown) {
        return rejectWithValue(
          serviceError instanceof Error
            ? serviceError.message
            : "Failed to send message"
        );
      }
    }
  }
);

export const markAsRead = createAsyncThunk(
  "chat/markAsRead",
  async (contactId: string, { rejectWithValue, getState }) => {
    try {
      await markMessagesAsRead(contactId);
      // Get the current user ID from the state here, not in the reducer
      const state = getState() as { user: { userInfo: { id: string } } };
      const currentUserId = state.user.userInfo?.id;
      // Return both contactId and currentUserId
      return { contactId, currentUserId };
    } catch (error: unknown) {
      try {
        handleServiceError(error);
      } catch (serviceError: unknown) {
        return rejectWithValue(
          serviceError instanceof Error
            ? serviceError.message
            : "Failed to mark messages as read"
        );
      }
    }
  }
);

export const addContactThunk = createAsyncThunk(
  "chat/addContact",
  async (email: string, { rejectWithValue }) => {
    try {
      return await addContactByEmail(email);
    } catch (error: unknown) {
      // Check if it's a 404 error (user not found)
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "status" in error.response &&
        error.response.status === 404
      ) {
        return rejectWithValue("This email doesn't exist in the system");
      }

      if (error instanceof Error) {
        return rejectWithValue(error.message);
      } else {
        try {
          handleServiceError(error);
        } catch (serviceError: unknown) {
          return rejectWithValue(
            serviceError instanceof Error
              ? serviceError.message
              : "Failed to add contact"
          );
        }
      }
    }
  }
);

export const updateContactGroupThunk = createAsyncThunk(
  "chat/updateContactGroup",
  async (
    {
      contactId,
      group,
      isGroup = false,
    }: { contactId: string; group: string; isGroup?: boolean },
    { rejectWithValue }
  ) => {
    try {
      // Use different service function based on whether this is a group or regular contact
      if (isGroup) {
        return await updateGroupTag(contactId, group);
      } else {
        return await updateContactGroup(contactId, group);
      }
    } catch (error: unknown) {
      try {
        handleServiceError(error);
      } catch (serviceError: unknown) {
        return rejectWithValue(
          serviceError instanceof Error
            ? serviceError.message
            : "Failed to update contact/group tag"
        );
      }
    }
  }
);

export const updateContactDisplayNameThunk = createAsyncThunk(
  "chat/updateContactDisplayName",
  async (
    { contactId, displayName }: { contactId: string; displayName: string },
    { rejectWithValue }
  ) => {
    try {
      return await updateContactDisplayName(contactId, displayName);
    } catch (error: unknown) {
      try {
        handleServiceError(error);
      } catch (serviceError: unknown) {
        return rejectWithValue(
          serviceError instanceof Error
            ? serviceError.message
            : "Failed to update contact display name"
        );
      }
    }
  }
);

export const removeContactThunk = createAsyncThunk(
  "chat/removeContact",
  async (contactId: string, { rejectWithValue, dispatch, getState }) => {
    try {
      console.log(
        `[ChatSlice] Starting to remove contact with ID: ${contactId}`
      );

      // Get the current state to check if this is the selected contact
      const state = getState() as RootState;
      const isSelectedContact = state.chat.selectedContact?.id === contactId;
      const contactName =
        state.chat.contacts.find((c) => c.id === contactId)?.name || "Unknown";

      if (isSelectedContact) {
        console.log(
          `[ChatSlice] This is the currently selected contact, will clear selection after removal`
        );
      }

      console.log(
        `[ChatSlice] Attempting to remove contact "${contactName}" (${contactId}) from database`
      );

      // Call the service function to remove the contact
      console.log(
        `[ChatSlice] Calling removeContact service function with contactId: ${contactId}`
      );
      try {
        await removeContactService(contactId);
        console.log(
          `[ChatSlice] removeContact service function completed successfully`
        );
      } catch (serviceError) {
        console.error(
          `[ChatSlice] removeContact service function failed:`,
          serviceError
        );
        throw serviceError; // Re-throw to be caught by the outer catch
      }

      console.log(
        `[ChatSlice] Contact "${contactName}" (${contactId}) successfully removed from backend database`
      );

      // Immediately refresh the contacts list to ensure UI is in sync with the backend
      try {
        console.log(`[ChatSlice] Refreshing contacts list after removal`);

        // Wait a moment to ensure the backend has processed the removal
        console.log(`[ChatSlice] Waiting 1 second for backend processing...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Force a refresh of the contacts list
        console.log(`[ChatSlice] Fetching updated contacts list...`);
        await dispatch(fetchContacts()).unwrap();
        console.log(`[ChatSlice] Contacts list refreshed successfully`);

        // Double-check if the contact was actually removed from the backend
        const updatedState = getState() as RootState;
        const contactStillExists = updatedState.chat.contacts.some(
          (c) => c.id === contactId
        );

        if (contactStillExists) {
          console.warn(
            `[ChatSlice] CRITICAL ERROR: Contact still exists after removal and refresh: ${contactId}`
          );
          console.warn(
            `[ChatSlice] This indicates the backend did not properly remove the contact`
          );

          // Log all contacts for debugging
          console.log(
            `[ChatSlice] Current contacts after refresh:`,
            updatedState.chat.contacts.map((c) => ({ id: c.id, name: c.name }))
          );

          // Try a direct API call as a fallback
          try {
            console.log(
              `[ChatSlice] Attempting direct API call as fallback to remove contact: ${contactId}`
            );

            // Import axios for direct API call
            const axios = await import("axios");

            // Get the token from the current state
            const token = updatedState.auth.token;

            // Make a direct API call to the contact endpoint
            await axios.default.delete(
              `http://localhost:9095/identify_service/chat/contacts/${contactId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                withCredentials: true,
              }
            );

            console.log(
              `[ChatSlice] Direct API call to remove contact successful`
            );

            // Wait a moment and refresh contacts again
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await dispatch(fetchContacts()).unwrap();

            // Check if contact is still there after second attempt
            const finalState = getState() as RootState;
            const stillExists = finalState.chat.contacts.some(
              (c) => c.id === contactId
            );

            if (stillExists) {
              console.warn(
                `[ChatSlice] Contact STILL exists after second removal attempt: ${contactId}`
              );
              // Force remove locally as last resort
              console.log(
                `[ChatSlice] Forcing local removal of contact: ${contactId}`
              );
              dispatch({
                type: "chat/removeContactLocally",
                payload: contactId,
              });
            } else {
              console.log(
                `[ChatSlice] Contact successfully removed after second attempt: ${contactId}`
              );
            }
          } catch (directError) {
            console.error(
              `[ChatSlice] Direct API call to remove contact failed:`,
              directError
            );
            // Force remove the contact from the local state since all backend attempts failed
            console.log(
              `[ChatSlice] Forcing local removal of contact: ${contactId}`
            );
            dispatch({
              type: "chat/removeContactLocally",
              payload: contactId,
            });
          }
        } else {
          console.log(
            `[ChatSlice] Contact successfully removed and verified: ${contactId}`
          );
        }
      } catch (refreshError) {
        console.error(
          `[ChatSlice] Error refreshing contacts after removal:`,
          refreshError
        );
        // We don't throw here because the contact was successfully removed
      }

      // Return the contactId for the reducer to use
      return contactId;
    } catch (error: unknown) {
      console.error(`[ChatSlice] Error removing contact:`, error);

      try {
        handleServiceError(error);
      } catch (serviceError: unknown) {
        const errorMessage =
          serviceError instanceof Error
            ? serviceError.message
            : "Failed to remove contact";

        console.error(`[ChatSlice] Service error:`, errorMessage);
        return rejectWithValue(errorMessage);
      }
    }
  }
);

export const fetchPendingRequests = createAsyncThunk(
  "chat/fetchPendingRequests",
  async (_, { rejectWithValue }) => {
    try {
      return await getPendingContactRequests();
    } catch (error: unknown) {
      try {
        handleServiceError(error);
      } catch (serviceError: unknown) {
        return rejectWithValue(
          serviceError instanceof Error
            ? serviceError.message
            : "Failed to fetch pending requests"
        );
      }
    }
  }
);

export const respondToRequest = createAsyncThunk(
  "chat/respondToRequest",
  async (
    { contactId, action }: { contactId: string; action: "accept" | "reject" },
    { rejectWithValue }
  ) => {
    try {
      return await respondToContactRequest(contactId, action);
    } catch (error: unknown) {
      try {
        handleServiceError(error);
      } catch (serviceError: unknown) {
        return rejectWithValue(
          serviceError instanceof Error
            ? serviceError.message
            : `Failed to ${action} contact request`
        );
      }
    }
  }
);

export const editMessageThunk = createAsyncThunk(
  "chat/editMessage",
  async (
    { messageId, content }: { messageId: string; content: string },
    { rejectWithValue }
  ) => {
    try {
      // Try to send via WebSocket first for real-time updates
      const sentViaWebSocket = await import(
        "../services/websocketService"
      ).then(({ editMessageViaWebSocket }) => {
        return editMessageViaWebSocket(messageId, content);
      });

      console.log(
        "[ChatSlice] WebSocket edit result:",
        sentViaWebSocket ? "Success" : "Failed"
      );

      // Always use HTTP API to ensure persistence, even if WebSocket succeeds
      return await editMessage(messageId, content);
    } catch (error: unknown) {
      try {
        handleServiceError(error);
      } catch (serviceError: unknown) {
        return rejectWithValue(
          serviceError instanceof Error
            ? serviceError.message
            : "Failed to edit message"
        );
      }
    }
  }
);

export const deleteMessageThunk = createAsyncThunk(
  "chat/deleteMessage",
  async (messageId: string, { rejectWithValue }) => {
    try {
      await deleteMessage(messageId);
      return messageId; // Return the ID to remove it from the state
    } catch (error: unknown) {
      try {
        handleServiceError(error);
      } catch (serviceError: unknown) {
        return rejectWithValue(
          serviceError instanceof Error
            ? serviceError.message
            : "Failed to delete message"
        );
      }
    }
  }
);

export const forwardMessageThunk = createAsyncThunk(
  "chat/forwardMessage",
  async (
    {
      content,
      recipientIds,
      currentUserId,
      currentContactId,
    }: {
      content: string;
      recipientIds: string[];
      currentUserId?: string;
      currentContactId?: string;
    },
    { rejectWithValue, getState }
  ) => {
    try {
      console.log("[ChatSlice] ===== FORWARD MESSAGE THUNK STARTED =====");
      console.log(
        "[ChatSlice] Message content:",
        content.substring(0, 50) + "..."
      );
      console.log("[ChatSlice] Recipients:", recipientIds);
      console.log("[ChatSlice] Current user ID:", currentUserId);
      console.log("[ChatSlice] Provided current contact ID:", currentContactId);

      // If currentContactId is not provided, get it from the state
      let contactId = currentContactId;
      if (!contactId) {
        const state = getState() as {
          chat: { selectedContact: { id: string } | null };
        };
        contactId = state.chat.selectedContact?.id;
        console.log("[ChatSlice] Got contact ID from state:", contactId);
      }

      console.log(
        "[ChatSlice] Final currentContactId for forwarding:",
        contactId
      );

      // Pass the current contact ID to forwardMessage to prevent duplicates
      const result = await forwardMessage(content, recipientIds, contactId);
      console.log(
        "[ChatSlice] Forward message service returned results:",
        result.length
      );
      return result;
    } catch (error: unknown) {
      try {
        handleServiceError(error);
      } catch (serviceError: unknown) {
        return rejectWithValue(
          serviceError instanceof Error
            ? serviceError.message
            : "Failed to forward message"
        );
      }
    }
  }
);

// Slice definition follows

// Slice
const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    // Contact-related reducers (from contactSlice.ts)
    setContacts: (state, action: PayloadAction<Contact[]>) => {
      state.contacts = action.payload;
    },
    addContact: (state, action: PayloadAction<Contact>) => {
      state.contacts.push(action.payload);
    },
    // Client-side only contact removal (for UI purposes)
    removeContactLocally: (state, action: PayloadAction<string>) => {
      const contactId = action.payload;
      console.log(`[Redux] Removing contact locally (UI only): ${contactId}`);

      // Remove the contact from the contacts array
      state.contacts = state.contacts.filter(
        (contact) => contact.id !== contactId
      );

      // If this is the selected contact, clear the selection
      if (state.selectedContact && state.selectedContact.id === contactId) {
        state.selectedContact = null;
        state.messages = [];
      }
    },
    updateContact: (state, action: PayloadAction<Contact>) => {
      const index = state.contacts.findIndex(
        (contact) => contact.id === action.payload.id
      );
      if (index !== -1) {
        state.contacts[index] = action.payload;
      }
    },
    removeContact: (state, action: PayloadAction<string>) => {
      state.contacts = state.contacts.filter(
        (contact) => contact.id !== action.payload
      );
    },
    setSelectedContact: (state, action: PayloadAction<ChatContact | null>) => {
      state.selectedContact = action.payload;
      // Clear messages when switching contacts to prevent showing old messages
      state.messages = [];
    },
    // Group-related reducers
    setGroups: (state, action: PayloadAction<Group[]>) => {
      state.groups = action.payload;
    },
    addGroup: (state, action: PayloadAction<Group>) => {
      state.groups.push(action.payload);
    },
    updateGroup: (state, action: PayloadAction<Group>) => {
      const index = state.groups.findIndex(
        (group) => group.id === action.payload.id
      );
      if (index !== -1) {
        state.groups[index] = action.payload;
      }
    },
    removeGroup: (state, action: PayloadAction<string>) => {
      state.groups = state.groups.filter(
        (group) => group.id !== action.payload
      );
    },
    updateContactStatus: (
      state,
      action: PayloadAction<{
        contactId: string;
        status: "online" | "away" | "busy" | "offline";
      }>
    ) => {
      const { contactId, status } = action.payload;
      console.log(
        "[Redux] Updating status for contact:",
        contactId,
        "to",
        status
      );

      // Update the contact in the contacts array
      state.contacts = state.contacts.map((contact) => {
        if (contact.id === contactId) {
          console.log("[Redux] Found contact to update status:", contact.name);
          return { ...contact, status };
        }
        return contact;
      });

      // If this is the selected contact, update that too
      if (state.selectedContact && state.selectedContact.id === contactId) {
        state.selectedContact = { ...state.selectedContact, status };
      }
    },

    // Message-related reducers (from messageSlice.ts)
    setMessages: (state, action: PayloadAction<Message[]>) => {
      console.log("[Redux] Setting all messages:", action.payload.length);
      state.messages = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      // Process the new message

      // Enhanced duplicate detection with more logging
      const isDuplicate = state.messages.some((msg) => {
        // Check if exact same ID (except for temp IDs which should be replaced)
        if (
          msg.id === action.payload.id &&
          !msg.id.toString().startsWith("temp-") &&
          !action.payload.id.toString().startsWith("temp-")
        ) {
          return true;
        }

        // Check if this is a server response replacing a temp message
        if (
          msg.id.toString().startsWith("temp-") &&
          msg.content === action.payload.content &&
          msg.sender.id === action.payload.sender.id &&
          // Check if both messages have receivers before comparing receiver IDs
          // If both messages are group messages (no receiver)
          ((msg.receiver === null && action.payload.receiver === null) ||
            // If both messages have receivers, compare their IDs
            (msg.receiver &&
              action.payload.receiver &&
              msg.receiver.id === action.payload.receiver.id))
        ) {
          console.log("[Redux] Found matching temp message, will replace it");
          // Instead of skipping, we'll replace the temp message with the server response
          // This is handled below
          return false;
        }

        // Special handling for forwarded messages
        // If we have a message with the same content, sender, and receiver within 10 seconds,
        // consider it a duplicate
        if (
          msg.content === action.payload.content &&
          msg.sender.id === action.payload.sender.id &&
          // Check if both messages have receivers before comparing receiver IDs
          // If both messages are group messages (no receiver)
          ((msg.receiver === null && action.payload.receiver === null) ||
            // If both messages have receivers, compare their IDs
            (msg.receiver &&
              action.payload.receiver &&
              msg.receiver.id === action.payload.receiver.id))
        ) {
          const msgTime = new Date(msg.timestamp).getTime();
          const newMsgTime = new Date(action.payload.timestamp).getTime();
          const timeDiff = Math.abs(msgTime - newMsgTime);

          // For forwarded messages, use a larger time window (10 seconds)
          if (timeDiff < 10000) {
            console.log(
              "[Redux] Found potential forwarded message duplicate. Time diff:",
              timeDiff,
              "ms"
            );
            return true;
          }
        }

        // Special handling for non-persistent messages
        // If we have a non-persistent message with the same content, sender, and receiver,
        // consider it a duplicate regardless of timestamp
        if (
          (msg.persistent === false || action.payload.persistent === false) &&
          msg.content === action.payload.content &&
          msg.sender.id === action.payload.sender.id &&
          // Check if both messages have receivers before comparing receiver IDs
          // If both messages are group messages (no receiver)
          ((msg.receiver === null && action.payload.receiver === null) ||
            // If both messages have receivers, compare their IDs
            (msg.receiver &&
              action.payload.receiver &&
              msg.receiver.id === action.payload.receiver.id))
        ) {
          console.log(
            "[Redux] Found matching non-persistent message, treating as duplicate"
          );
          return true;
        }

        // Check if same content, same sender/receiver, and timestamp within 5 seconds
        if (
          msg.content === action.payload.content &&
          msg.sender.id === action.payload.sender.id &&
          // Check if both messages have receivers before comparing receiver IDs
          // If both messages are group messages (no receiver)
          ((msg.receiver === null && action.payload.receiver === null) ||
            // If both messages have receivers, compare their IDs
            (msg.receiver &&
              action.payload.receiver &&
              msg.receiver.id === action.payload.receiver.id))
        ) {
          const msgTime = new Date(msg.timestamp).getTime();
          const newMsgTime = new Date(action.payload.timestamp).getTime();
          const timeDiff = Math.abs(msgTime - newMsgTime);

          // If messages are within 5 seconds of each other, consider them duplicates
          if (timeDiff < 5000) {
            console.log(
              "[Redux] Found similar message within 5 seconds, treating as duplicate. Time diff:",
              timeDiff,
              "ms"
            );
            return true;
          }
        }

        return false;
      });

      if (isDuplicate) {
        // Skip duplicate messages
      } else {
        // Check if this is a server response that should replace a temp message
        const tempIndex = state.messages.findIndex(
          (msg) =>
            msg.id.toString().startsWith("temp-") &&
            msg.content === action.payload.content &&
            msg.sender.id === action.payload.sender.id &&
            // Check if both messages have receivers before comparing receiver IDs
            // If both messages are group messages (no receiver or null receiver)
            ((msg.receiver === null && action.payload.receiver === null) ||
              // If both messages have receivers, compare their IDs
              (msg.receiver &&
                action.payload.receiver &&
                msg.receiver.id === action.payload.receiver.id))
        );

        if (tempIndex !== -1) {
          // Replace the temporary message with the server response
          state.messages[tempIndex] = action.payload;
        } else {
          // Add the new message to the store
          state.messages.push(action.payload);
          // Sort messages by timestamp to ensure correct order
          state.messages.sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        }
        // Messages updated successfully
      }
    },
    updateMessagesReadStatus: (
      state,
      action: PayloadAction<{ contactId: string; currentUserId?: string }>
    ) => {
      // Use the currentUserId from the action payload
      const currentUserId = action.payload.currentUserId;

      // Check if we need to update anything at all
      const hasUnreadReceivedMessages = state.messages.some(
        (msg) =>
          msg.sender.id === action.payload.contactId &&
          msg.receiver &&
          msg.receiver.id === currentUserId &&
          !msg.read
      );

      const hasUnreadSentMessages =
        currentUserId &&
        state.messages.some(
          (msg) =>
            msg.sender.id === currentUserId &&
            msg.receiver &&
            msg.receiver.id === action.payload.contactId &&
            !msg.read
        );

      // If there are no unread messages in either direction, skip the update
      if (!hasUnreadReceivedMessages && !hasUnreadSentMessages) {
        return;
      }

      // There are two scenarios:
      // 1. We are marking messages as read that we received (when we view them)
      // 2. We are receiving a notification that our sent messages were read by the recipient

      // First, handle case 1: Mark messages we received as read
      let updatedCount = 0;
      let updatedMessages = state.messages.map((message) => {
        // If the message is from the specified contact and sent to current user, mark it as read
        if (
          message.sender.id === action.payload.contactId &&
          message.receiver.id === currentUserId &&
          !message.read
        ) {
          console.log("[Redux] Marking received message as read:", message.id);
          updatedCount++;
          return { ...message, read: true };
        }
        return message;
      });
      console.log(`[Redux] Marked ${updatedCount} received messages as read`);

      // Then, handle case 2: Mark messages we sent as read when notified by the recipient
      let sentUpdatedCount = 0;
      if (currentUserId) {
        updatedMessages = updatedMessages.map((message) => {
          // If this is a message we sent to the contact who just read our messages
          if (
            message.sender.id === currentUserId &&
            message.receiver.id === action.payload.contactId &&
            !message.read
          ) {
            sentUpdatedCount++;
            return { ...message, read: true };
          }
          return message;
        });
        console.log(
          `[Redux] *** MARKED ${sentUpdatedCount} SENT MESSAGES AS READ ***`
        );
      }

      // Only update state if we actually changed something
      if (updatedCount > 0 || sentUpdatedCount > 0) {
        // Update the messages array
        state.messages = updatedMessages;

        // Also update the unread count for this contact in the contacts list
        const contactIndex = state.contacts.findIndex(
          (contact) => contact.id === action.payload.contactId
        );
        if (contactIndex !== -1) {
          console.log(
            "[Redux] Updating unread count for contact:",
            action.payload.contactId
          );
          state.contacts[contactIndex] = {
            ...state.contacts[contactIndex],
            unreadCount: 0,
          };
        }

        // Create completely new references for both arrays
        // This ensures React detects the changes and re-renders
        state.messages = [...state.messages]; // Simple array reference change is enough
        state.contacts = [...state.contacts]; // Simple array reference change is enough

        // Log the read status of messages for debugging
        if (currentUserId) {
          const sentMessages = state.messages.filter(
            (msg) =>
              msg.sender.id === currentUserId &&
              msg.receiver &&
              msg.receiver.id === action.payload.contactId
          );
          console.log(
            `[Redux] Read status of ${sentMessages.length} messages sent to ${action.payload.contactId}:`,
            sentMessages.map((msg) => ({ id: msg.id, read: msg.read }))
          );
        }

        console.log(
          "[Redux] Created new references for messages and contacts arrays to ensure UI updates"
        );
      } else {
        console.log("[Redux] No messages were updated, skipping state update");
      }
    },
    clearMessages: (state) => {
      console.log("[Redux] Clearing all messages");
      state.messages = [];
    },

    // Remove a specific message by ID
    removeMessage: (state, action: PayloadAction<string>) => {
      console.log("[Redux] Removing message with ID:", action.payload);
      state.messages = state.messages.filter(
        (message) => message.id !== action.payload
      );
      console.log("[Redux] Message removed successfully");
    },

    // Update message content for a specific message
    updateMessageContent: (
      state,
      action: PayloadAction<{ messageId: string; content: string }>
    ) => {
      console.log(
        "[Redux] Updating message content for ID:",
        action.payload.messageId
      );
      const messageIndex = state.messages.findIndex(
        (message) => message.id === action.payload.messageId
      );

      if (messageIndex !== -1) {
        state.messages[messageIndex].content = action.payload.content;
        console.log("[Redux] Message content updated successfully");
      } else {
        console.warn(
          "[Redux] Message not found for update:",
          action.payload.messageId
        );
      }
    },

    // Common reducers
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },

    // Reset the messageDeleted flag
    resetMessageDeletedFlag: (state) => {
      state.messageDeleted = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch contacts
      .addCase(fetchContacts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.loading = false;
        // Convert service contacts to chat contacts
        state.contacts = action.payload
          ? action.payload.map((contact) =>
              convertServiceContactToChatContact(contact)
            )
          : [];
        // Select first contact if none is selected
        if (
          !state.selectedContact &&
          action.payload &&
          action.payload.length > 0
        ) {
          state.selectedContact = convertServiceContactToChatContact(
            action.payload[0]
          );
        }
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        // Convert service messages to chat messages and sort by timestamp
        state.messages = action.payload
          ? action.payload
              .map((message) => convertServiceMessageToChatMessage(message))
              .sort(
                (a, b) =>
                  new Date(a.timestamp).getTime() -
                  new Date(b.timestamp).getTime()
              )
          : [];
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Send message
      .addCase(sendMessageThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessageThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          // Check if this message is already in the state
          const isDuplicate = state.messages.some((existingMsg) => {
            if (!action.payload) return false;

            // Exact ID match
            return (
              existingMsg.id === action.payload.id ||
              // Same content, sender, receiver, and timestamp within 10 seconds
              (existingMsg.content === action.payload.content &&
                existingMsg.sender.id === action.payload.sender.id &&
                existingMsg.receiver.id === action.payload.receiver.id &&
                Math.abs(
                  new Date(existingMsg.timestamp).getTime() -
                    new Date(action.payload.timestamp).getTime()
                ) < 10000)
            );
          });

          // Only add the message if it's not already in the state
          if (!isDuplicate) {
            console.log(
              "[Redux] Adding new sent message to store:",
              action.payload.id
            );
            state.messages.push(
              convertServiceMessageToChatMessage(action.payload)
            );
          } else {
            console.log(
              "[Redux] Skipping duplicate sent message:",
              action.payload.id
            );
          }
        }
      })
      .addCase(sendMessageThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        // Check if payload exists and has the expected properties
        if (
          action.payload &&
          "contactId" in action.payload &&
          "currentUserId" in action.payload
        ) {
          const { contactId, currentUserId } = action.payload;
          console.log("[Redux] markAsRead.fulfilled for contact:", contactId);
          console.log("[Redux] Current user ID from payload:", currentUserId);

          // Check if there are any unread messages that need to be updated
          const hasUnreadMessages = state.messages.some(
            (msg) =>
              msg.sender.id === contactId &&
              msg.receiver &&
              msg.receiver.id === currentUserId &&
              !msg.read
          );

          if (!hasUnreadMessages) {
            console.log("[Redux] No unread messages found, skipping update");
            return;
          }

          // Update the unread count for this contact
          const updatedContacts = state.contacts.map((contact) =>
            contact.id === contactId ? { ...contact, unreadCount: 0 } : contact
          );

          // Mark messages from this contact as read
          let updatedCount = 0;
          const updatedMessages = state.messages.map((message) => {
            // If the message is from the specified contact and sent to current user, mark it as read
            if (
              message.sender.id === contactId &&
              message.receiver &&
              message.receiver.id === currentUserId &&
              !message.read
            ) {
              console.log(
                "[Redux] Marking message as read from contact:",
                message.id
              );
              updatedCount++;
              return { ...message, read: true };
            }
            return message;
          });
          console.log(
            `[Redux] Marked ${updatedCount} messages as read from contact:`,
            contactId
          );

          // Only update state if we actually changed something
          if (updatedCount > 0) {
            // Update the state with the new arrays
            state.messages = updatedMessages;
            state.contacts = updatedContacts;

            // Create completely new references for both arrays
            // This ensures React detects the changes and re-renders
            state.messages = [...state.messages]; // Simple array reference change is enough
            state.contacts = [...state.contacts]; // Simple array reference change is enough
            console.log(
              "[Redux] Created new references for messages and contacts arrays to ensure UI updates"
            );
          }
        }
      })

      // Add contact
      .addCase(addContactThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addContactThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.contacts.push(
            convertServiceContactToChatContact(action.payload)
          );
        }
      })
      .addCase(addContactThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update contact or group tag
      .addCase(updateContactGroupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateContactGroupThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          // Check if this is a group update or a contact update
          const isGroupUpdate = "members" in action.payload;

          if (isGroupUpdate) {
            // Handle group update
            const updatedGroup = action.payload as Group;

            // Update the group in the groups array
            state.groups = state.groups.map((group) =>
              group.id === updatedGroup.id ? updatedGroup : group
            );

            // Update the group in the contacts array (groups are also in contacts)
            state.contacts = state.contacts.map((contact) => {
              if (contact.id === updatedGroup.id && contact.isGroup) {
                return {
                  ...contact,
                  group: updatedGroup.group,
                };
              }
              return contact;
            });

            // If this is the selected contact, update that too
            if (
              state.selectedContact &&
              state.selectedContact.id === updatedGroup.id &&
              state.selectedContact.isGroup
            ) {
              state.selectedContact = {
                ...state.selectedContact,
                group: updatedGroup.group,
              };
            }
          } else {
            // Handle regular contact update
            const updatedContact = convertServiceContactToChatContact(
              action.payload as Contact
            );
            // Make sure to include the group property from the response
            updatedContact.group = action.payload.group;

            // Update the contact in the contacts array
            state.contacts = state.contacts.map((contact) =>
              contact.id === updatedContact.id ? updatedContact : contact
            );

            // If this is the selected contact, update that too
            if (
              state.selectedContact &&
              state.selectedContact.id === updatedContact.id
            ) {
              state.selectedContact = updatedContact;
            }
          }
        }
      })
      .addCase(updateContactGroupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update contact display name
      .addCase(updateContactDisplayNameThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateContactDisplayNameThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          const updatedContact = convertServiceContactToChatContact(
            action.payload
          );

          // Update the contact in the contacts array
          state.contacts = state.contacts.map((contact) =>
            contact.id === updatedContact.id ? updatedContact : contact
          );

          // If this is the selected contact, update that too
          if (
            state.selectedContact &&
            state.selectedContact.id === updatedContact.id
          ) {
            state.selectedContact = updatedContact;
          }
        }
      })
      .addCase(updateContactDisplayNameThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Remove contact
      .addCase(removeContactThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeContactThunk.fulfilled, (state, action) => {
        state.loading = false;
        const contactId = action.payload;

        // Remove the contact from the contacts array
        state.contacts = state.contacts.filter(
          (contact) => contact.id !== contactId
        );

        // If this is the selected contact, clear the selection
        if (state.selectedContact && state.selectedContact.id === contactId) {
          state.selectedContact = null;
          state.messages = [];
        }
      })
      .addCase(removeContactThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update group
      .addCase(updateGroupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateGroupThunk.fulfilled, (state, action) => {
        state.loading = false;

        // Update the group in the groups array
        const groupIndex = state.groups.findIndex(
          (group) => group.id === action.payload.id
        );
        if (groupIndex !== -1) {
          state.groups[groupIndex] = action.payload;
        }

        // If this is the currently selected contact, update it too
        if (
          state.selectedContact &&
          state.selectedContact.id === action.payload.id
        ) {
          state.selectedContact = {
            ...state.selectedContact,
            name: action.payload.name,
            avatar: action.payload.avatar || state.selectedContact.avatar,
          };
        }

        // Update the contact in the contacts list if it exists there
        const contactIndex = state.contacts.findIndex(
          (contact) => contact.id === action.payload.id
        );
        if (contactIndex !== -1) {
          state.contacts[contactIndex] = {
            ...state.contacts[contactIndex],
            name: action.payload.name,
            avatar:
              action.payload.avatar || state.contacts[contactIndex].avatar,
          };
        }
      })
      .addCase(updateGroupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch pending requests
      .addCase(fetchPendingRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingRequests = action.payload
          ? action.payload.map((contact) =>
              convertServiceContactToChatContact(contact)
            )
          : [];
      })
      .addCase(fetchPendingRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Respond to contact request
      .addCase(respondToRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(respondToRequest.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          // Remove from pending requests
          state.pendingRequests = state.pendingRequests.filter(
            (request) => request.id !== action.payload?.id
          );

          // If accepted, add to contacts
          if (action.payload.contactStatus === "ACCEPTED") {
            state.contacts.push(
              convertServiceContactToChatContact(action.payload)
            );
          }
        }
      })
      .addCase(respondToRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Edit message
      .addCase(editMessageThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editMessageThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (
          action.payload &&
          typeof action.payload === "object" &&
          "id" in action.payload
        ) {
          // Find and update the message in the state
          const editedMessage = action.payload as Message;
          state.messages = state.messages.map((message) =>
            message.id === editedMessage.id
              ? convertServiceMessageToChatMessage(editedMessage)
              : message
          );
        }
      })
      .addCase(editMessageThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete message
      .addCase(deleteMessageThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMessageThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          // Remove the message from the state
          state.messages = state.messages.filter(
            (message) => message.id !== action.payload
          );

          // Add a flag to indicate a message was deleted (for scroll handling)
          state.messageDeleted = true;
        }
      })
      .addCase(deleteMessageThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Forward message
      .addCase(forwardMessageThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forwardMessageThunk.fulfilled, (state, action) => {
        state.loading = false;
        console.log("[Redux] ===== FORWARD MESSAGE REDUCER STARTED =====");

        if (action.payload && Array.isArray(action.payload)) {
          console.log(
            "[Redux] Forward operation completed successfully, received messages:",
            action.payload.length
          );

          if (action.payload.length === 0) {
            console.log("[Redux] No messages to process, exiting early");
            return;
          }

          // Create a map to track which recipients have already received this message
          // This helps prevent duplicates when forwarding to multiple recipients
          const processedMessages = new Set<string>();

          // Get the current user ID to avoid showing forwarded messages in the current chat
          const currentUserId = action.meta?.arg?.currentUserId || "";
          // Get the current selected contact ID from the action metadata
          // This is more reliable than using state.selectedContact
          const currentContactId = action.meta?.arg?.currentContactId || "";

          // Log the current state for debugging
          console.log("[Redux] Current user ID:", currentUserId);
          console.log(
            "[Redux] Current contact ID from action:",
            currentContactId
          );
          console.log(
            "[Redux] Current selected contact in state:",
            state.selectedContact?.id
          );
          console.log(
            "[Redux] Messages in payload:",
            action.payload.map((m) => ({
              id: m.id,
              sender: m.sender?.id,
              receiver: m.receiver?.id,
            }))
          );

          // Process each forwarded message
          action.payload.forEach((message) => {
            if (message && typeof message === "object" && "id" in message) {
              console.log("[Redux] Processing forwarded message:", message.id);

              // Create a unique identifier for this message
              const messageId = message.id;
              const recipientId = message.receiver?.id || "";
              const senderId = message.sender?.id || "";
              const messageContent = message.content || "";
              const timestamp = message.timestamp || new Date().toISOString();

              // Check if this is a forwarded message with metadata
              const isForwarded = message.metadata?.isForwarded === true;
              const originalContactId = message.metadata?.originalContactId;

              console.log(
                "[Redux] Message metadata check:",
                "isForwarded:",
                isForwarded,
                "originalContactId:",
                originalContactId,
                "currentContactId:",
                currentContactId
              );

              // Skip messages that are forwarded and the original contact matches the current contact
              // This prevents the forwarded message from appearing in the chat where it was forwarded from
              if (isForwarded && originalContactId === currentContactId) {
                console.log(
                  "[Redux] SKIPPING forwarded message with matching originalContactId:",
                  messageId,
                  "originalContactId:",
                  originalContactId,
                  "currentContactId:",
                  currentContactId
                );
                return; // Skip this message
              }

              // Also skip messages that would appear in the current chat window based on sender/receiver
              // This is a fallback in case the metadata approach doesn't work
              if (
                currentContactId &&
                (recipientId === currentContactId ||
                  senderId === currentContactId)
              ) {
                console.log(
                  "[Redux] SKIPPING forwarded message for current contact based on IDs:",
                  messageId,
                  "recipient:",
                  recipientId,
                  "sender:",
                  senderId,
                  "currentContactId:",
                  currentContactId
                );
                return; // Skip this message
              }

              // Create a unique message signature
              const messageSignature = `${senderId}-${recipientId}-${messageContent.substring(
                0,
                50
              )}-${timestamp}`;

              // Check if we've already processed this message
              if (processedMessages.has(messageSignature)) {
                console.log(
                  "[Redux] Already processed this message signature:",
                  messageSignature
                );
                return; // Skip this message
              }

              // Check if this message is already in the state (by ID or by content+timestamp)
              const isDuplicate = state.messages.some(
                (existingMsg) =>
                  // Exact ID match
                  existingMsg.id === messageId ||
                  // Same content, sender, receiver, and timestamp within 5 seconds
                  (existingMsg.content === messageContent &&
                    existingMsg.sender.id === senderId &&
                    existingMsg.receiver.id === recipientId &&
                    Math.abs(
                      new Date(existingMsg.timestamp).getTime() -
                        new Date(timestamp).getTime()
                    ) < 5000)
              );

              // Only add the message if it's not already in the state
              if (!isDuplicate) {
                console.log(
                  "[Redux] Adding forwarded message to store:",
                  messageId
                );
                state.messages.push(
                  convertServiceMessageToChatMessage(message)
                );

                // Mark this message as processed
                processedMessages.add(messageSignature);
              } else {
                console.log(
                  "[Redux] Skipping duplicate forwarded message:",
                  messageId
                );
              }
            }
          });

          // Sort messages by timestamp
          state.messages.sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        }
      })
      .addCase(forwardMessageThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Group-related reducers
      .addCase(fetchGroupsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroupsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload || [];
        console.log("[Redux] Groups fetched successfully:", state.groups);
      })
      .addCase(fetchGroupsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        console.error("[Redux] Failed to fetch groups:", action.payload);
      })

      // Create group reducers
      .addCase(createGroupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGroupThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.groups.push(action.payload);
        }
      })
      .addCase(createGroupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update group reducers are already defined above

      // Add group members reducers
      .addCase(addGroupMembersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addGroupMembersThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          // Update the group in the groups array
          const index = state.groups.findIndex(
            (group) => group.id === action.payload.id
          );
          if (index !== -1) {
            state.groups[index] = action.payload;
          }

          // If this is the selected contact, update it too
          if (
            state.selectedContact &&
            state.selectedContact.id === action.payload.id
          ) {
            state.selectedContact = {
              ...state.selectedContact,
              members: action.payload.members.map((member) => member.id),
            };
          }
        }
      })
      .addCase(addGroupMembersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Remove group member reducers
      .addCase(removeGroupMemberThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeGroupMemberThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          // Update the group in the groups array
          const index = state.groups.findIndex(
            (group) => group.id === action.payload.id
          );
          if (index !== -1) {
            state.groups[index] = action.payload;
          }

          // If this is the selected contact, update it too
          if (
            state.selectedContact &&
            state.selectedContact.id === action.payload.id
          ) {
            state.selectedContact = {
              ...state.selectedContact,
              members: action.payload.members.map((member) => member.id),
            };
          }
        }
      })
      .addCase(removeGroupMemberThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Leave group reducers
      .addCase(leaveGroupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(leaveGroupThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          // Remove the group from the groups array
          state.groups = state.groups.filter(
            (group) => group.id !== action.payload
          );

          // If this was the selected contact, clear it
          if (
            state.selectedContact &&
            state.selectedContact.id === action.payload
          ) {
            state.selectedContact = null;
          }
        }
      })
      .addCase(leaveGroupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete group reducers
      .addCase(deleteGroupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteGroupThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          // Remove the group from the groups array
          state.groups = state.groups.filter(
            (group) => group.id !== action.payload
          );

          // If this was the selected contact, clear it
          if (
            state.selectedContact &&
            state.selectedContact.id === action.payload
          ) {
            state.selectedContact = null;
          }
        }
      })
      .addCase(deleteGroupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch group messages reducers
      .addCase(fetchGroupMessagesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroupMessagesThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          // Convert service messages to chat messages and mark them as group messages
          state.messages = action.payload.messages
            ? action.payload.messages.map((message) => {
                const chatMessage = convertServiceMessageToChatMessage(message);
                // Add metadata to indicate this is a group message
                return {
                  ...chatMessage,
                  metadata: {
                    ...chatMessage.metadata,
                    isGroupMessage: true,
                    groupId: action.payload.groupId,
                  },
                };
              })
            : [];

          console.log(
            "[Redux] Group messages fetched successfully:",
            state.messages.length
          );

          // Sort messages by timestamp
          state.messages.sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        }
      })
      .addCase(fetchGroupMessagesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        console.error(
          "[Redux] Failed to fetch group messages:",
          action.payload
        );
      })

      // Send group message reducers
      .addCase(sendGroupMessageThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendGroupMessageThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          // Convert service message to chat message and mark it as a group message
          const chatMessage = convertServiceMessageToChatMessage(
            action.payload
          );

          // Add metadata to indicate this is a group message
          const messageWithMetadata = {
            ...chatMessage,
            metadata: {
              ...chatMessage.metadata,
              isGroupMessage: true,
              groupId: action.meta.arg.groupId,
            },
          };

          // Check if there's a temporary message to replace
          const tempIndex = state.messages.findIndex(
            (msg) =>
              msg.id.toString().startsWith("temp-") &&
              msg.content === messageWithMetadata.content &&
              msg.sender.id === messageWithMetadata.sender.id &&
              // For group messages, check the groupId in metadata
              msg.metadata?.isGroupMessage === true &&
              msg.metadata?.groupId === messageWithMetadata.metadata?.groupId
          );

          if (tempIndex !== -1) {
            console.log(
              "[Redux] Replacing temp group message at index",
              tempIndex,
              "with server response"
            );
            state.messages[tempIndex] = messageWithMetadata;
          } else {
            // Only add the message if we didn't find a temporary message to replace
            console.log(
              "[Redux] No temp message found, adding new group message to state"
            );
            state.messages.push(messageWithMetadata);
          }

          console.log(
            "[Redux] Group message sent successfully:",
            messageWithMetadata
          );

          // Sort messages by timestamp
          state.messages.sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        }
      })
      .addCase(sendGroupMessageThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        console.error("[Redux] Failed to send group message:", action.payload);
      });
  },
});

export const {
  // Contact actions
  setContacts,
  addContact,
  updateContact,
  removeContact,
  setSelectedContact,
  updateContactStatus,

  // Message actions
  setMessages,
  addMessage,
  updateMessagesReadStatus,
  clearMessages,
  removeMessage,
  updateMessageContent,
  resetMessageDeletedFlag,

  // Common actions
  setLoading,
  setError,
  clearError,
} = chatSlice.actions;

export default chatSlice.reducer;

