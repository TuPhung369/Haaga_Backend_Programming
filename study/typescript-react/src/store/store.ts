import {
  configureStore,
  Reducer,
  Action,
  combineReducers,
} from "@reduxjs/toolkit";
import kanbanReducer from "./kanbanSlice";
import authReducer from "./authSlice";
import userReducer from "./userSlice";
import assistantAIReducer from "./assistantAISlice";
import languageReducer from "./languageSlice";
import { AuthState } from "../types/AuthTypes";
import { RootState } from "../types/RootStateTypes";
import { KanbanState } from "../types/KanbanTypes";
import { UserState } from "../types/UserTypes";
import { LanguageState } from "../types/LanguageAITypes";
import { ChatMessageData } from "../types/LanguageAITypes";
import { resetAllData } from "./resetActions";

// Define an interface for legacy language state that includes the old messagesByLanguage property
interface LegacyLanguageState extends LanguageState {
  messagesByLanguage?: Record<string, ChatMessageData[]>;
}

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

    if (
      parsedState.assistantAI &&
      Array.isArray(parsedState.assistantAI.messages)
    ) {
      console.log(
        "Found assistantAI state in localStorage with",
        parsedState.assistantAI.messages.length,
        "messages"
      );
      validState.assistantAI = parsedState.assistantAI;
    } else {
      console.warn(
        "Invalid assistantAI state in localStorage, using initial assistantAI state"
      );
    }

    // Add check for language state
    if (
      parsedState.language &&
      (typeof parsedState.language.currentMessagesByLanguage === "object" ||
        typeof parsedState.language.historyMessagesByLanguage === "object" ||
        typeof (parsedState.language as LegacyLanguageState)
          .messagesByLanguage === "object")
    ) {
      // Count total messages across all languages
      let totalMessages = 0;

      // Count current messages if available
      if (parsedState.language.currentMessagesByLanguage) {
        totalMessages += Object.values(
          parsedState.language.currentMessagesByLanguage
        ).reduce(
          (sum, messages) =>
            sum + (Array.isArray(messages) ? messages.length : 0),
          0
        );
      }

      // Count history messages if available
      if (parsedState.language.historyMessagesByLanguage) {
        totalMessages += Object.values(
          parsedState.language.historyMessagesByLanguage
        ).reduce(
          (sum, messages) =>
            sum + (Array.isArray(messages) ? messages.length : 0),
          0
        );
      }

      // Count legacy messages if available
      if ((parsedState.language as LegacyLanguageState).messagesByLanguage) {
        totalMessages += Object.values(
          (parsedState.language as LegacyLanguageState).messagesByLanguage || {}
        ).reduce(
          (sum, messages) =>
            sum + (Array.isArray(messages) ? messages.length : 0),
          0
        );
      }

      console.log(
        "Found language state in localStorage with",
        totalMessages,
        "total messages across all languages"
      );

      // Ensure currentMessagesByLanguage is initialized
      if (!parsedState.language.currentMessagesByLanguage) {
        parsedState.language.currentMessagesByLanguage = {};
      }

      // Ensure historyMessagesByLanguage is initialized
      if (!parsedState.language.historyMessagesByLanguage) {
        parsedState.language.historyMessagesByLanguage = {};
      }

      // Handle migration from old structure if needed
      if ((parsedState.language as LegacyLanguageState).messagesByLanguage) {
        // If we have old structure data, migrate it to current messages
        const legacyMessages =
          (parsedState.language as LegacyLanguageState).messagesByLanguage ||
          {};

        // Type assertion to ensure compatibility
        const typedLegacyMessages: Record<string, ChatMessageData[]> = {};

        // Copy each language's messages with proper typing
        Object.entries(legacyMessages).forEach(([lang, messages]) => {
          if (Array.isArray(messages)) {
            typedLegacyMessages[lang] = messages as ChatMessageData[];
          }
        });

        parsedState.language.currentMessagesByLanguage = {
          ...parsedState.language.currentMessagesByLanguage,
          ...typedLegacyMessages,
        };

        // Remove old structure
        delete (parsedState.language as LegacyLanguageState).messagesByLanguage;
      }

      // Ensure currentLanguage is set
      if (!parsedState.language.currentLanguage) {
        parsedState.language.currentLanguage = "en-US";
      }

      validState.language = parsedState.language;
    } else {
      console.warn(
        "Invalid language state in localStorage, using initial language state"
      );
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
      state.user &&
      state.assistantAI &&
      state.language // Add check for language state
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

// Create the app reducer with proper typing
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
  assistantAI: assistantAIReducer,
  language: languageReducer, // Add language reducer
});

// Root reducer with logout handling and proper state typing
const rootReducer: Reducer<
  RootState,
  Action,
  Partial<RootState> | undefined
> = (
  state: RootState | Partial<RootState> | undefined,
  action: Action
): RootState => {
  // When a logout action is dispatched, reset the state to initial state
  if (action.type === resetAllData.type) {
    localStorage.removeItem("appState");
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
};

// Create store with the root reducer
const store = configureStore({
  reducer: rootReducer,
  preloadedState: loadState(),
  devTools: isDevelopment,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: {
        warnAfter: 128, // Increase from default 32ms to 128ms
      },
    }),
});

// Subscribe to state changes with typed state
store.subscribe(() => {
  const state = store.getState() as RootState;

  // Log language state changes
  if (state.language) {
    const currentLanguageKeys = state.language.currentMessagesByLanguage
      ? Object.keys(state.language.currentMessagesByLanguage)
      : [];
    const historyLanguageKeys = state.language.historyMessagesByLanguage
      ? Object.keys(state.language.historyMessagesByLanguage)
      : [];

    console.log("Store subscription: language state updated", {
      currentLanguage: state.language.currentLanguage,
      currentLanguageKeys,
      historyLanguageKeys,
      currentMessagesCount: currentLanguageKeys.reduce((sum, lang) => {
        return (
          sum + (state.language.currentMessagesByLanguage[lang]?.length || 0)
        );
      }, 0),
      historyMessagesCount: historyLanguageKeys.reduce((sum, lang) => {
        return (
          sum + (state.language.historyMessagesByLanguage[lang]?.length || 0)
        );
      }, 0),
    });
  }

  if (state.auth.isAuthenticated) {
    saveState(state);
  }
});

// Export store and types
export default store;
export type AppDispatch = typeof store.dispatch;
export type { RootState } from "../types/RootStateTypes";

