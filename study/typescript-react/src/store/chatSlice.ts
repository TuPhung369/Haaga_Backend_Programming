import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  getContacts,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  addContactByEmail,
  updateContactGroup,
  updateContactDisplayName,
  getPendingContactRequests,
  respondToContactRequest,
  Message,
  Contact,
} from "../services/chatService";
import { ChatState, ChatMessage, ChatContact } from "../types/ChatTypes";
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
  selectedContact: null,
  loading: false,
  error: null,
};

// Async thunks
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
      persistent = true,
    }: {
      content: string;
      receiverId: string;
      persistent?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      return await sendMessage(content, receiverId, persistent);
    } catch (error: unknown) {
      try {
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
);

export const updateContactGroupThunk = createAsyncThunk(
  "chat/updateContactGroup",
  async (
    { contactId, group }: { contactId: string; group: string },
    { rejectWithValue }
  ) => {
    try {
      return await updateContactGroup(contactId, group);
    } catch (error: unknown) {
      try {
        handleServiceError(error);
      } catch (serviceError: unknown) {
        return rejectWithValue(
          serviceError instanceof Error
            ? serviceError.message
            : "Failed to update contact group"
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
      console.log("[Redux] Adding new message to store:", action.payload);

      // Enhanced duplicate detection with more logging
      const isDuplicate = state.messages.some((msg) => {
        // Check if exact same ID (except for temp IDs which should be replaced)
        if (
          msg.id === action.payload.id &&
          !msg.id.toString().startsWith("temp-") &&
          !action.payload.id.toString().startsWith("temp-")
        ) {
          console.log("[Redux] Exact ID match found:", msg.id);
          return true;
        }

        // Check if this is a server response replacing a temp message
        if (
          msg.id.toString().startsWith("temp-") &&
          msg.content === action.payload.content &&
          msg.sender.id === action.payload.sender.id &&
          msg.receiver.id === action.payload.receiver.id
        ) {
          console.log("[Redux] Found matching temp message, will replace it");
          // Instead of skipping, we'll replace the temp message with the server response
          // This is handled below
          return false;
        }

        // Check if same content, same sender/receiver, and timestamp within 5 seconds
        if (
          msg.content === action.payload.content &&
          msg.sender.id === action.payload.sender.id &&
          msg.receiver.id === action.payload.receiver.id
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
        console.log("[Redux] Message appears to be a duplicate, not adding");
      } else {
        // Check if this is a server response that should replace a temp message
        const tempIndex = state.messages.findIndex(
          (msg) =>
            msg.id.toString().startsWith("temp-") &&
            msg.content === action.payload.content &&
            msg.sender.id === action.payload.sender.id &&
            msg.receiver.id === action.payload.receiver.id
        );

        if (tempIndex !== -1) {
          console.log(
            "[Redux] Replacing temp message at index",
            tempIndex,
            "with server response"
          );
          state.messages[tempIndex] = action.payload;
        } else {
          console.log("[Redux] Message is new, adding to store");
          state.messages.push(action.payload);
          // Sort messages by timestamp to ensure correct order
          state.messages.sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        }
        console.log("[Redux] New message count:", state.messages.length);
      }
    },
    updateMessagesReadStatus: (
      state,
      action: PayloadAction<{ contactId: string; currentUserId?: string }>
    ) => {
      console.log(
        "[Redux] Updating read status for messages from contact:",
        action.payload.contactId
      );

      // Use the currentUserId from the action payload
      const currentUserId = action.payload.currentUserId;
      console.log("[Redux] Current user ID from payload:", currentUserId);

      // Check if we need to update anything at all
      const hasUnreadReceivedMessages = state.messages.some(
        (msg) =>
          msg.sender.id === action.payload.contactId &&
          msg.receiver.id === currentUserId &&
          !msg.read
      );

      const hasUnreadSentMessages =
        currentUserId &&
        state.messages.some(
          (msg) =>
            msg.sender.id === currentUserId &&
            msg.receiver.id === action.payload.contactId &&
            !msg.read
        );

      // If there are no unread messages in either direction, skip the update
      if (!hasUnreadReceivedMessages && !hasUnreadSentMessages) {
        console.log(
          "[Redux] No unread messages found, skipping read status update"
        );
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
            console.log(
              "[Redux] *** MARKING SENT MESSAGE AS READ (recipient read it) ***:",
              message.id
            );
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
          state.messages.push(
            convertServiceMessageToChatMessage(action.payload)
          );
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

      // Update contact group
      .addCase(updateContactGroupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateContactGroupThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          const updatedContact = convertServiceContactToChatContact(
            action.payload
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

  // Common actions
  setLoading,
  setError,
  clearError,
} = chatSlice.actions;

export default chatSlice.reducer;

