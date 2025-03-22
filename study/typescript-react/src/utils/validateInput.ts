// src/utils/validateInput.ts
import { ValidationInput, ValidationErrors } from "../type/types";

export const validationMessages = {
  USERNAME_LENGTH: "Username must be between 5 and 20 characters.",
  PASSWORD_MIN_LENGTH: "Password must be at least 8 characters long.",
  PASSWORD_VALIDATION:
    "Password must contain at least one Uppercase letter, one Lowercase letter, one Number, and one Special character.",
  PASSWORD_MATCH: "Passwords do not match.",
  FIRSTNAME_NOT_BLANK: "First name cannot be blank.",
  LASTNAME_NOT_BLANK: "Last name cannot be blank.",
  DOB_REQUIRED: "Date of birth is required.",
  INVALID_DOB: "You must be at least 6 years old.",
  ROLES_NOT_NULL: "Roles cannot be null.",
  EMAIL_INVALID: "Email must be a valid email address.",
  EMAIL_NOT_BLANK: "Email cannot be blank.",
};

const validateInput = (input: ValidationInput): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Validate username
  if (input.username !== undefined) {
    if (
      !input.username ||
      input.username.length < 5 ||
      input.username.length > 20
    ) {
      errors.username = validationMessages.USERNAME_LENGTH;
    }
  }

  // Validate password
  if (input.password !== undefined) {
    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>])[A-Za-z\d!@#$%^&*()\-_=+{};:,<.>]{8,}$/;
    if (!input.password || input.password.length < 8) {
      errors.password = validationMessages.PASSWORD_MIN_LENGTH;
    } else if (!passwordPattern.test(input.password)) {
      errors.password = validationMessages.PASSWORD_VALIDATION;
    }
  }

  // Validate confirm password
  if (input.confirmPassword !== undefined) {
    if (!input.confirmPassword || input.confirmPassword !== input.password) {
      errors.confirmPassword = validationMessages.PASSWORD_MATCH;
    }
  }

  // Validate first name
  if (input.firstname !== undefined) {
    if (!input.firstname || input.firstname.trim() === "") {
      errors.firstname = validationMessages.FIRSTNAME_NOT_BLANK;
    }
  }

  // Validate last name
  if (input.lastname !== undefined) {
    if (!input.lastname || input.lastname.trim() === "") {
      errors.lastname = validationMessages.LASTNAME_NOT_BLANK;
    }
  }

  // Validate date of birth
  if (input.dob !== undefined) {
    if (!input.dob) {
      errors.dob = validationMessages.DOB_REQUIRED;
    } else {
      const dob = new Date(input.dob);
      const age = new Date().getFullYear() - dob.getFullYear();
      if (age < 6) {
        errors.dob = validationMessages.INVALID_DOB;
      }
    }
  }

  // Validate roles
  if (input.roles !== undefined) {
    if (!input.roles || input.roles.length === 0) {
      errors.roles = validationMessages.ROLES_NOT_NULL;
    }
  }

  // Validate email
  if (input.email !== undefined) {
    const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!input.email || !emailPattern.test(input.email)) {
      errors.email = validationMessages.EMAIL_INVALID;
    }
    if (!input.email || input.email.trim() === "") {
      errors.email = validationMessages.EMAIL_NOT_BLANK;
    }
  }

  return errors;
};

export default validateInput;

