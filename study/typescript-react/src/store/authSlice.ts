// src/store/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState } from "../type/types";

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
  },
});

export const { setAuthData, clearAuthData } = authSlice.actions;
export default authSlice.reducer;

