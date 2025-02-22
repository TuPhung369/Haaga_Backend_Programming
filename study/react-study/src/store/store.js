import { configureStore } from "@reduxjs/toolkit";
import kanbanReducer from "./kanbanSlice";
import authReducer from "./authSlice";
import userReducer from "./userSlice";

const loadState = () => {
  try {
    const serializedState = localStorage.getItem("appState");
    if (serializedState === null) {
      console.log("No state found in localStorage, using initial state");
      return undefined;
    }
    const parsedState = JSON.parse(serializedState);
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

const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("appState", serializedState);
  } catch (err) {
    console.error("Could not save state to localStorage:", err);
  }
};

const store = configureStore({
  reducer: {
    kanban: kanbanReducer,
    auth: authReducer,
    user: userReducer,
  },
  preloadedState: loadState(),
  devTools: process.env.NODE_ENV !== "production",
});

store.subscribe(() => {
  const state = store.getState();
  saveState(state);
});

export default store;

