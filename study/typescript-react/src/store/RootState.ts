import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import userReducer from "./userSlice";
import kanbanReducer from "./kanbanSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    kanban: kanbanReducer,
  },
});

// Define RootState
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

