// src/store/RootState.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import userReducer from "./userSlice";
import kanbanReducer from "./kanbanSlice";
// Import chatReducer after it's been defined to avoid circular dependency
import type { ThunkAction, Action } from "@reduxjs/toolkit";
import type { RootState } from "../types/RootStateTypes";

// Forward declaration of chatReducer to avoid circular dependency
// We'll import it after the store is created
let chatReducer: any;

// Create the store with properly typed reducers
export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    kanban: kanbanReducer,
    // Use a function to lazily get the chatReducer
    chat: (state = null, action) => {
      // Once chatReducer is imported, use it
      if (chatReducer) {
        return chatReducer(state, action);
      }
      // Return initial state before chatReducer is loaded
      return state;
    },
  },
});

// Import chatReducer after store is created to avoid circular dependency
import chatReducerModule from "./chatSlice";
// Now assign the imported reducer
chatReducer = chatReducerModule;

// Define AppDispatch type
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

