import { configureStore, Reducer, Action } from "@reduxjs/toolkit"; // Add Reducer and Action
import kanbanReducer from "./kanbanSlice";
import authReducer from "./authSlice";
import userReducer from "./userSlice";
import { RootState, AuthState, KanbanState, UserState } from "../type/types";

// Environment check for development mode
const isDevelopment = import.meta.env.MODE === "development";

// Load state from localStorage
const loadState = (): Partial<RootState> | undefined => {
  try {
    const serializedState = localStorage.getItem("appState");
    if (serializedState === null) {
      console.log("No state found in localStorage, using initial state");
      return undefined;
    }

    const parsedState = JSON.parse(serializedState) as RootState;

    if (!parsedState || typeof parsedState !== "object") {
      console.warn("Invalid state format in localStorage, using initial state");
      return undefined;
    }

    const validState: Partial<RootState> = {};

    if (
      parsedState.auth &&
      typeof parsedState.auth.isAuthenticated === "boolean" &&
      (!parsedState.auth.token || typeof parsedState.auth.token === "string") &&
      typeof parsedState.auth.loginSocial === "boolean"
    ) {
      validState.auth = parsedState.auth;
    } else {
      console.warn(
        "Invalid auth state in localStorage, using initial auth state"
      );
    }

    if (parsedState.kanban && Array.isArray(parsedState.kanban.columns)) {
      validState.kanban = parsedState.kanban;
    } else {
      console.warn(
        "Invalid kanban state in localStorage, using initial kanban state"
      );
    }

    if (parsedState.user) {
      validState.user = parsedState.user;
    }

    return validState;
  } catch (err) {
    console.error("Could not load state from localStorage:", err);
    return undefined;
  }
};

// Save state to localStorage
const saveState = (state: RootState): void => {
  try {
    if (
      state &&
      state.auth &&
      state.kanban &&
      Array.isArray(state.kanban.columns) &&
      state.user
    ) {
      const serializedState = JSON.stringify(state);
      localStorage.setItem("appState", serializedState);
    } else {
      console.warn(
        "Did not save state to localStorage due to invalid structure"
      );
    }
  } catch (err) {
    console.error("Could not save state to localStorage:", err);
  }
};

// Configure the store with explicit typing for reducers
const store = configureStore({
  reducer: {
    auth: authReducer as Reducer<AuthState, Action, AuthState | undefined>,
    kanban: kanbanReducer as Reducer<
      KanbanState,
      Action,
      KanbanState | undefined
    >,
    user: userReducer as Reducer<UserState, Action, UserState | undefined>,
  },
  preloadedState: loadState(),
  devTools: isDevelopment,
});

// Subscribe to state changes with typed state
store.subscribe(() => {
  const state = store.getState() as RootState; // Explicitly type as RootState
  if (state.auth.isAuthenticated) {
    saveState(state);
  } else {
    localStorage.removeItem("appState"); // Clear localStorage on logout
  }
});

// Log initial state to console for debugging
console.log("Initial Redux Store State:", store.getState());

// Export store and types
export default store;
export type AppDispatch = typeof store.dispatch;
export type { RootState } from "../type/types";

