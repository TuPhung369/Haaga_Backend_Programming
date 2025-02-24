// src/store/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Define AuthState type
export interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  loginSocial: boolean;
}

const initialState: AuthState = {
  token: null,
  isAuthenticated: false,
  loginSocial: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthData: (state, action: PayloadAction<AuthState>) => {
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.loginSocial = action.payload.loginSocial || false;
    },
    clearAuthData: () => initialState, // Reset auth state
    clearAllData: () => undefined, // Clear All Redux store (though this might not work as intended; see note)
  },
});

export const { setAuthData, clearAuthData, clearAllData } = authSlice.actions;
export default authSlice.reducer;

