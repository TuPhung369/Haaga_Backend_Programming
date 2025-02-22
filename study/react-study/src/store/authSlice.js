// src/store/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: null,
  isAuthenticated: false,
  loginSocial: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthData: (state, action) => {
      state.token = action.payload.token;
      state.isAuthenticated = action.payload.isAuthenticated;
      state.loginSocial = action.payload.loginSocial;
    },
    clearAuthData: (state) => {
      state.token = null;
      state.isAuthenticated = false;
      state.loginSocial = false;
    },
  },
});

export const { setAuthData, clearAuthData } = authSlice.actions;
export default authSlice.reducer;

