import { configureStore } from "@reduxjs/toolkit";
import kanbanReducer from "./kanbanSlice";
import authReducer from "./authSlice";
import userReducer from "./userSlice";
import { RootState } from "../type/types";


// Load state from localStorage
const loadState = (): RootState | undefined => {
  try {
    const serializedState = localStorage.getItem("appState");
    if (serializedState === null) {
      console.log("No state found in localStorage, using initial state");
      return undefined;
    }
    const parsedState = JSON.parse(serializedState) as RootState;
    // Validate state structure
    if (
      !parsedState ||
      !parsedState.auth ||
      typeof parsedState.auth.isAuthenticated !== "boolean" ||
      (parsedState.auth.token && typeof parsedState.auth.token !== "string") ||
      typeof parsedState.auth.loginSocial !== "boolean" ||
      !parsedState.kanban ||
      !Array.isArray(parsedState.kanban.columns) ||
      typeof parsedState.kanban.editingTask !== "object"
    ) {
      console.warn(
        "Invalid state structure in localStorage, using initial state"
      );
      return undefined;
    }
    return parsedState;
  } catch (err) {
    console.error("Could not load state from localStorage:", err);
    return undefined;
  }
};

// Save state to localStorage
const saveState = (state: RootState): void => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("appState", serializedState);
  } catch (err) {
    console.error("Could not save state to localStorage:", err);
  }
};

// Configure the store
const store = configureStore({
  reducer: {
    kanban: kanbanReducer,
    auth: authReducer,
    user: userReducer,
  },
  preloadedState: loadState(),
  devTools: process.env.NODE_ENV !== "production",
});

// Subscribe to state changes
store.subscribe(() => {
  const state = store.getState();
  if (state.auth.isAuthenticated) {
    saveState(state);
  } else {
    localStorage.removeItem("appState"); // Clear localStorage on logout
  }
});

// Export store and types
export default store;
export type AppDispatch = typeof store.dispatch; // Optional: for useDispatch typing



