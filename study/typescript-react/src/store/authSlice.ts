// src/store/authSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { AuthState } from "../type/types";
import {
  authenticateUserWithCookies,
  logoutWithCookies,
  refreshTokenWithCookie,
} from "../services/cookieAuthService";

const initialState: AuthState = {
  token: "",
  isAuthenticated: false,
  loginSocial: false,
};

// Async thunks for authentication actions
export const loginWithCookies = createAsyncThunk(
  "auth/loginWithCookies",
  async (
    { username, password }: { username: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await authenticateUserWithCookies(username, password);
      return response.result;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        err.response?.data?.message || "Authentication failed"
      );
    }
  }
);

export const refreshCookieToken = createAsyncThunk(
  "auth/refreshCookieToken",
  async (_, { rejectWithValue }) => {
    try {
      const response = await refreshTokenWithCookie();
      return response.result;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        err.response?.data?.message || "Token refresh failed"
      );
    }
  }
);

export const logoutWithCookie = createAsyncThunk(
  "auth/logoutWithCookie",
  async (_, { rejectWithValue }) => {
    try {
      await logoutWithCookies();
      return null;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message || "Logout failed");
    }
  }
);

// Create auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthData: (state, action: PayloadAction<AuthState>) => {
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.loginSocial = action.payload.loginSocial || false;
    },
    clearAuthData: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Login with cookies
      .addCase(loginWithCookies.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loginSocial = false;
      })
      .addCase(loginWithCookies.rejected, () => {
        return initialState;
      })

      // Refresh token
      .addCase(refreshCookieToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(refreshCookieToken.rejected, () => {
        return initialState;
      })

      // Logout
      .addCase(logoutWithCookie.fulfilled, () => {
        return initialState;
      });
  },
});

export const { setAuthData, clearAuthData } = authSlice.actions;
export default authSlice.reducer;

