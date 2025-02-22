// src/store/store.js
import { configureStore } from "@reduxjs/toolkit";
import kanbanReducer from "./kanbanSlice";

const loadState = () => {
  try {
    const serializedState = localStorage.getItem("kanbanState");
    console.log("Loading state from localStorage:", serializedState);
    if (serializedState === null) {
      console.log("No state found in localStorage, using initial state");
      return undefined;
    }
    const parsedState = JSON.parse(serializedState);
    // Validate state structure, including isAuthenticated and token
    if (
      !parsedState ||
      !parsedState.columns ||
      !Array.isArray(parsedState.columns) ||
      typeof parsedState.editingTask !== "object" ||
      typeof parsedState.isAuthenticated !== "boolean" ||
      typeof parsedState.token !== "string"
    ) {
      console.warn(
        "Invalid state structure in localStorage, using initial state"
      );
      return undefined;
    }
    return { kanban: parsedState }; // Nest under 'kanban'
  } catch (err) {
    console.error("Could not load state from localStorage:", err);
    return undefined;
  }
};

const saveState = (state) => {
  try {
    console.log("Saving state to localStorage:", state);
    const serializedState = JSON.stringify(state.kanban); // Save only the kanban state
    localStorage.setItem("kanbanState", serializedState);
  } catch (err) {
    console.error("Could not save state to localStorage:", err);
  }
};

const store = configureStore({
  reducer: {
    kanban: kanbanReducer,
  },
  preloadedState: loadState(),
  devTools: process.env.NODE_ENV !== "production",
});

store.subscribe(() => {
  const state = store.getState().kanban;
  console.log("State changed, saving to localStorage:", state);
  saveState(state);
});

export default store;
