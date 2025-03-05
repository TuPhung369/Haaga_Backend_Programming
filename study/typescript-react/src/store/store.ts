import {
  configureStore,
  Reducer,
  Action,
  combineReducers,
} from "@reduxjs/toolkit";
import kanbanReducer from "./kanbanSlice";
import authReducer from "./authSlice";
import userReducer from "./userSlice";
import { RootState, AuthState, KanbanState, UserState } from "../type/types";
import { resetAllData } from "./resetActions";

// Environment check for development mode
const isDevelopment = import.meta.env.MODE === "development";

// Load state from localStorage
const loadState = (): Partial<RootState> | undefined => {
  try {
    const serializedState = localStorage.getItem("appState");
    if (!serializedState) {
      console.log("No state found in localStorage, using initial state");
      return undefined;
    }

    const parsedState = JSON.parse(serializedState) as RootState;

    if (!parsedState || typeof parsedState !== "object") {
      console.warn("Invalid state format in localStorage, using initial state");
      return undefined;
    }

    const validState: Partial<RootState> = {};

    // Validate auth state
    if (
      parsedState.auth &&
      typeof parsedState.auth.isAuthenticated === "boolean" &&
      (!parsedState.auth.token || typeof parsedState.auth.token === "string") &&
      typeof parsedState.auth.loginSocial === "boolean"
    ) {
      validState.auth = parsedState.auth;
    } else {
      console.warn("Invalid auth state in localStorage, skipping auth state");
    }

    // Validate kanban state
    if (parsedState.kanban && Array.isArray(parsedState.kanban.columns)) {
      validState.kanban = parsedState.kanban;
    } else {
      console.warn(
        "Invalid kanban state in localStorage, skipping kanban state"
      );
    }

    // Validate user state
    if (parsedState.user) {
      validState.user = parsedState.user;
    }

    return Object.keys(validState).length > 0 ? validState : undefined;
  } catch (err) {
    console.error("Could not load state from localStorage:", err);
    return undefined;
  }
};

// Save state to localStorage
const saveState = (state: RootState): void => {
  try {
    const stateToSave: RootState = {
      auth: state.auth,
      kanban: state.kanban,
      user: state.user,
    };
    const serializedState = JSON.stringify(stateToSave);
    localStorage.setItem("appState", serializedState);
  } catch (err) {
    console.error("Could not save state to localStorage:", err);
  }
};

// Combine reducers
const appReducer = combineReducers({
  auth: authReducer as Reducer<
    AuthState,
    Action,
    Partial<AuthState> | undefined
  >,
  kanban: kanbanReducer as Reducer<
    KanbanState,
    Action,
    Partial<KanbanState> | undefined
  >,
  user: userReducer as Reducer<
    UserState,
    Action,
    Partial<UserState> | undefined
  >,
});

// Root reducer with reset handling
const rootReducer: Reducer<
  RootState,
  Action,
  Partial<RootState> | undefined
> = (
  state: RootState | Partial<RootState> | undefined,
  action: Action
): RootState => {
  if (action.type === resetAllData.type) {
    localStorage.removeItem("appState");
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
};

// Create store
const store = configureStore({
  reducer: rootReducer,
  preloadedState: loadState(),
  devTools: isDevelopment,
});

// Subscribe to state changes
store.subscribe(() => {
  const state = store.getState() as RootState;
  if (state.auth.isAuthenticated) {
    saveState(state);
  } else {
    localStorage.removeItem("appState"); // Clear state if not authenticated
  }
});

// Export store and types
export default store;
export type AppDispatch = typeof store.dispatch;
export type { RootState } from "../type/types";

