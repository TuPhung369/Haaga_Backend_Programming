import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  getContacts, 
  getMessages, 
  sendMessage, 
  markMessagesAsRead, 
  addContactByEmail,
  Message,
  Contact
} from '../services/chatService';
import { ChatState } from '../types';

// Initial state
const initialState: ChatState = {
  messages: [],
  contacts: [],
  selectedContact: null,
  loading: false,
  error: null
};

// Async thunks
export const fetchContacts = createAsyncThunk(
  'chat/fetchContacts',
  async (_, { rejectWithValue }) => {
    try {
      return await getContacts();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch contacts');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (contactId: string, { rejectWithValue }) => {
    try {
      return await getMessages(contactId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessageThunk = createAsyncThunk(
  'chat/sendMessage',
  async ({ content, receiverId }: { content: string, receiverId: string }, { rejectWithValue }) => {
    try {
      return await sendMessage(content, receiverId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'chat/markAsRead',
  async (contactId: string, { rejectWithValue }) => {
    try {
      await markMessagesAsRead(contactId);
      return contactId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark messages as read');
    }
  }
);

export const addContact = createAsyncThunk(
  'chat/addContact',
  async (email: string, { rejectWithValue }) => {
    try {
      return await addContactByEmail(email);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add contact');
    }
  }
);

// Slice
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setSelectedContact: (state, action: PayloadAction<Contact | null>) => {
      state.selectedContact = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    clearError: (state) => {
      state.error = null;
    }
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
        state.contacts = action.payload;
        // Select first contact if none is selected
        if (!state.selectedContact && action.payload.length > 0) {
          state.selectedContact = action.payload[0];
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
        state.messages = action.payload;
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
        state.messages.push(action.payload);
      })
      .addCase(sendMessageThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const contactId = action.payload;
        state.contacts = state.contacts.map(contact => 
          contact.id === contactId ? { ...contact, unreadCount: 0 } : contact
        );
      })
      
      // Add contact
      .addCase(addContact.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addContact.fulfilled, (state, action) => {
        state.loading = false;
        state.contacts.push(action.payload);
      })
      .addCase(addContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { setSelectedContact, clearMessages, clearError } = chatSlice.actions;
export default chatSlice.reducer;
