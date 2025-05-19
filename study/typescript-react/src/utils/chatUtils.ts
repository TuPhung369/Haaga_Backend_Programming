// Utility functions for chat functionality

/**
 * Resets the persistMessages setting to true in localStorage
 * This should be called when a user logs in to ensure messages are saved by default
 */
export const resetPersistMessagesOnLogin = (): void => {
  console.log("[ChatUtils] Resetting persistMessages to true on login");
  localStorage.setItem("persistMessages", "true");
};