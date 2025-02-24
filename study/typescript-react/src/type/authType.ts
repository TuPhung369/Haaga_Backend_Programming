// src/types/authType.ts

export interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  loginSocial: boolean;
}

