// src/store/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState } from "../types/AuthTypes";
import { CustomErrorData } from "../types/ApiTypes";
import { clearTokenRefresh, setupTokenRefresh } from "../utils/tokenRefresh";
import { AppDispatch } from "../store/store";
import { authenticateUser, logoutUser } from "../services/authService";
import { setLoading, setAuthError, clearUserData } from "./userSlice";
import store from "../store/store";

const initialState: AuthState = {
  token: "",
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

export const login =
  (username: string, password: string) =>
    async (dispatch: AppDispatch) => {
      try {
        dispatch(setLoading(true));
        const response = await authenticateUser(username, password);
        dispatch(setAuthData({
          token: response.result.token,
          isAuthenticated: true,
          loginSocial: false
        }));

        // Setup token refresh mechanism with expiration if available
        if (response.result.token) {
          // Get expiresIn from the response if supported by your API
          const expiresIn = response.result.expiresIn;
          const expiresInMs = expiresIn ? expiresIn * 1000 : undefined;
          setupTokenRefresh(response.result.token, expiresInMs);
        }

        return { success: true };
      } catch (error) {
        const customError = error as CustomErrorData;
        dispatch(setAuthError(customError.message || "Login failed"));
        return {
          success: false,
          message: customError.message || "Login failed"
        };
      } finally {
        dispatch(setLoading(false));
      }
    };

export const logout = () => async (dispatch: AppDispatch) => {
  try {
    // Get the current token from the store
    const token = store.getState().auth.token;

    // Only attempt logout if there's a token
    if (token) {
      await logoutUser(token);
    }

    clearTokenRefresh(); // Clear any pending token refresh
    dispatch(clearAuthData());
    dispatch(clearUserData()); // Also clear user data
    return { success: true };
  } catch {
    return { success: false };
  }
};

