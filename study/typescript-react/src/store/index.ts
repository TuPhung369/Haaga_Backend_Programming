// src/store/index.ts
import store, { AppDispatch } from "./store";

// Re-export slices and their actions
export * from "./authSlice";
export * from "./userSlice";
export * from "./kanbanSlice";

// Export store by default
export default store;

// Export types
export type { AppDispatch };
// If you choose to export RootState from store.ts, you can also re-export it here
// export type { RootState } from './store';

