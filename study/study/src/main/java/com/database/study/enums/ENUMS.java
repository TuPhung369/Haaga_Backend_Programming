package com.database.study.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

public class ENUMS {

  @Getter
  @AllArgsConstructor
  public enum Role {
    ADMIN("Administrator - Full access to the system", "green"),
    USER("Regular User - Limited access", "cyan"),
    MANAGER("Manager - Can oversee and manage user activities", "blue");

    private final String description;
    private final String color;
  }

  @Getter
  @AllArgsConstructor
  public enum Permission {
    CREATE("Permission to create data",
        "blue"),
    READ("Permission to read data", "green"),
    UPDATE("Permission to update existing data", "cyan"),
    DELETE("Permission to delete data", "red");

    private final String description;
    private final String color;
  }

  @Getter
  @AllArgsConstructor
  public enum ErrorMessages {
    // 400 - BAD REQUEST
    EMAIL_INVALID("Invalid email address"),
    EMAIL_NOT_BLANK("Email cannot be blank"),
    FIRSTNAME_NOT_BLANK("Firstname cannot be blank"),
    INVALID_DOB("You must be at least {min} years old"),
    INVALID_OPERATION("Invalid operation"),
    INVALID_REQUEST("Invalid request"),
    INVALID_OTP("Invalid email verification code. Please check and try again."),
    LASTNAME_NOT_BLANK("Lastname cannot be blank"),
    OTP_EXPIRED("Email verification code has expired. Please request a new one."),
    PASSWORD_MIN_LENGTH("Password must be at least {min} characters long"),
    PASSWORD_MISMATCH("Password mismatch"),
    PASSWORD_VALIDATION(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
    ROLES_NOT_NULL("Roles cannot be null"),
    RECAPTCHA_REQUIRED("reCAPTCHA verification is required."),
    USERNAME_LENGTH("Username must be between {min} and {max} characters long"),

    // 401 - UNAUTHORIZED
    ACCOUNT_NOT_VERIFIED("Account not verified. Please check your email for verification code."),
    INACTIVE_USER("User account is inactive"),
    INVALID_CREDENTIALS("Invalid username or password"),
    INVALID_REFRESH_TOKEN("Invalid refresh token"),
    INVALID_TOKEN("Token has been invalidated and cannot be used"),
    REFRESH_TOKEN_EXPIRED("Refresh token expired"),
    TOTP_INVALID("Invalid two-factor authentication code"),
    TOTP_REQUIRED("Two-factor authentication code is required"),
    TOTP_VERIFICATION_REQUIRED("Verification with current TOTP device or backup code is required for this operation"),
    UNAUTHORIZED_ACCESS("Unauthorized access"),

    // 403 - FORBIDDEN
    ACCESS_DENIED("You do not have permission"),
    ACCOUNT_BLOCKED("Account blocked for security reasons"),
    FORBIDDEN("Access forbidden"),
    RECAPTCHA_VALIDATION_FAILED("reCAPTCHA verification failed. Please try again."),
    TOTP_ADMIN_RESET_REQUIRED("TOTP reset requires administrator verification. Please contact support"),
    TOTP_CHANGE_DENIED("TOTP device change denied. Verification failed or admin approval required"),
    UNAUTHORIZED_ROLE_ASSIGNMENT("You don't have permission to assign this role"),

    // 404 - NOT FOUND
    EVENT_NOT_FOUND("Event not found"),
    KANBAN_BOARD_NOT_FOUND("Kanban board not found"),
    KANBAN_COLUMN_NOT_FOUND("Kanban column not found"),
    KANBAN_TASK_NOT_FOUND("Kanban task not found"),
    NOT_FOUND("Resource not found"),
    RESOURCE_NOT_FOUND("Resource not found"),
    ROLE_NOT_FOUND("Role not found"),
    USER_NOT_EXISTS("User does not exist"),
    USER_NOT_FOUND("User not found"),

    // 409 - CONFLICT
    EMAIL_ALREADY_EXISTS("Email already exists with another account"),
    TOTP_ALREADY_ENABLED("Two-factor authentication is already enabled for this account"),
    USER_EXISTS("User already exists"),

    // 500 - INTERNAL SERVER ERROR
    GENERAL_EXCEPTION("General server error");

    private final String message;
  }

  @Getter
  @AllArgsConstructor
  public enum Severity {
    HIGH("High severity level"),
    MEDIUM("Medium severity level"),
    LOW("Low severity level");

    private final String description;
  }
}