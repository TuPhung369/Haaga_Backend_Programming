import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
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
    clearAllData: () => undefined, // Xóa toàn bộ Redux store
  },
});

export const { setAuthData, clearAuthData, clearAllData } = authSlice.actions;
export default authSlice.reducer;

