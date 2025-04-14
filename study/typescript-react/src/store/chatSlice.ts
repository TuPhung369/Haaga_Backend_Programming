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
    { content, receiverId }: { content: string; receiverId: string },
    { rejectWithValue }
  ) => {
    try {
      return await sendMessage(content, receiverId);
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
  async (contactId: string, { rejectWithValue }) => {
    try {
      await markMessagesAsRead(contactId);
      return contactId;
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
    setSelectedContact: (state, action: PayloadAction<Contact | null>) => {
      state.selectedContact = action.payload;
    },

    // Message-related reducers (from messageSlice.ts)
    setMessages: (state, action: PayloadAction<Message[]>) => {
      console.log("[Redux] Setting all messages:", action.payload.length);
      state.messages = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      console.log("[Redux] Adding new message to store:", action.payload);

      // Improved duplicate detection - check by ID or by content + timestamp (within 2 seconds)
      const isDuplicate = state.messages.some((msg) => {
        // Check if exact same ID
        if (msg.id === action.payload.id) {
          return true;
        }

        // Check if same content, same sender/receiver, and timestamp within 2 seconds
        if (
          msg.content === action.payload.content &&
          msg.sender.id === action.payload.sender.id &&
          msg.receiver.id === action.payload.receiver.id
        ) {
          const msgTime = new Date(msg.timestamp).getTime();
          const newMsgTime = new Date(action.payload.timestamp).getTime();
          const timeDiff = Math.abs(msgTime - newMsgTime);

          // If messages are within 2 seconds of each other, consider them duplicates
          if (timeDiff < 2000) {
            console.log(
              "[Redux] Found similar message within 2 seconds, treating as duplicate"
            );
            return true;
          }
        }

        return false;
      });

      if (isDuplicate) {
        console.log("[Redux] Message appears to be a duplicate, not adding");
      } else {
        console.log("[Redux] Message is new, adding to store");
        state.messages.push(action.payload);
        console.log("[Redux] New message count:", state.messages.length);
      }
    },
    updateMessagesReadStatus: (
      state,
      action: PayloadAction<{ contactId: string }>
    ) => {
      console.log(
        "[Redux] Updating read status for messages from contact:",
        action.payload.contactId
      );

      // Update all messages from this contact to be marked as read
      state.messages = state.messages.map((message) => {
        // If the message is from the specified contact, mark it as read
        if (message.sender.id === action.payload.contactId && !message.read) {
          console.log("[Redux] Marking message as read:", message.id);
          return { ...message, read: true };
        }
        return message;
      });

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
        // Convert service messages to chat messages
        state.messages = action.payload
          ? action.payload.map((message) =>
              convertServiceMessageToChatMessage(message)
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
        const contactId = action.payload;
        state.contacts = state.contacts.map((contact) =>
          contact.id === contactId ? { ...contact, unreadCount: 0 } : contact
        );
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

