// src/types/AuthTypes.ts
// Types related to authentication and authorization

export interface AuthResponse {
  code: number;
  result: {
    token: string;
    authenticated?: boolean;
    expiresIn?: number; // Add token expiration time in seconds
  };
}

export interface AuthError {
  message?: string;
  response?: { data?: { httpCode?: number; message?: string } };
}

export interface ValidationInput {
  username?: string;
  password?: string;
  confirmPassword?: string;
  firstname?: string;
  lastname?: string;
  dob?: string | Date; // Can be string or Date
  roles?: string[]; // Array of strings for roles
  email?: string;
  recaptchaToken?: string; // reCAPTCHA v3 token
  recaptchaV2Token?: string; // reCAPTCHA v2 token (when needed)
}

export interface ValidationErrors {
  username?: string;
  password?: string;
  confirmPassword?: string;
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

export interface IntrospectResponse {
  code: number;
  result: {
    valid: boolean;
  };
}

export interface RefreshTokenResponse {
  token: string;
  authenticated: boolean;
  refreshed: boolean;
  expiresIn?: number; // Token expiration time in seconds
}

export interface AuthState {
  token: string | null;
  isAuthenticated?: boolean;
  loginSocial?: boolean;
}

export interface EmailChangeRequest {
  userId: string;
  currentEmail: string;
  newEmail: string;
  password: string;
  token: string;
}

export interface EmailVerificationRequest {
  userId: string;
  newEmail: string;
  verificationCode: string;
  token: string;
  useTotp?: boolean;
}

export interface AuthenticationInitResponse {
  requiresTotp: boolean;
  requiresEmailOtp: boolean;
  message: string;
}

export interface EmailOtpAuthenticationRequest {
  username: string;
  password: string;
  otpCode: string;
}
