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
      state.isAuthenticated = true;
      state.loginSocial = action.payload.loginSocial || false;
    },
    clearAuthData: () => initialState, // Reset auth state
    clearAllData: () => undefined, // Xóa toàn bộ Redux store
  },
});

export const { setAuthData, clearAuthData, clearAllData } = authSlice.actions;
export default authSlice.reducer;

