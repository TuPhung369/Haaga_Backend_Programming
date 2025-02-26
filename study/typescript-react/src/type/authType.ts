// src/types/authType.ts

export interface AuthState {
  token: string | null;
  isAuthenticated?: boolean;
  loginSocial?: boolean;
}

export interface AuthError {
  message?: string;
  response?: { data?: { httpCode?: number; message?: string } };
}
// Input type for validation
export interface ValidationInput {
  username?: string;
  password?: string;
  firstname?: string;
  lastname?: string;
  dob?: string | Date; // Can be string or Date
  roles?: string[]; // Array of strings for roles
  email?: string;
}

// Error type for validation results
export interface ValidationErrors {
  username?: string;
  password?: string;
  firstname?: string;
  lastname?: string;
  dob?: string;
  roles?: string; // Single string for error message
  email?: string;
}

export interface ResetPasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}