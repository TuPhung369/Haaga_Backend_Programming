// src/type/loginType.ts

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
