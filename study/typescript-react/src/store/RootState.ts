// src/store/RootState.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import userReducer from "./userSlice";
import kanbanReducer from "./kanbanSlice";
import { ThunkAction, Action } from "@reduxjs/toolkit";

// Create the store with properly typed reducers
export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    kanban: kanbanReducer,
  },
});

// Define RootState and AppDispatch types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

