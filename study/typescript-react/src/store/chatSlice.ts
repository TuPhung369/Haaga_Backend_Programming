import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  getContacts,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  addContactByEmail,
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
  };
};

// Initial state
const initialState: ChatState = {
  messages: [],
  contacts: [],
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
      state.messages = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    clearMessages: (state) => {
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
  clearMessages,

  // Common actions
  setLoading,
  setError,
  clearError,
} = chatSlice.actions;

export default chatSlice.reducer;

