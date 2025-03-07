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
    GENERAL_EXCEPTION("General server error"),
    INVALID_REQUEST("Invalid request"),
    EMAIL_NOT_BLANK("Email cannot be blank"),
    EMAIL_INVALID("Invalid email address"),
    USERNAME_LENGTH("Username must be between {min} and {max} characters long"),
    PASSWORD_MIN_LENGTH("Password must be at least {min} characters long"),
    PASSWORD_VALIDATION(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
    FIRSTNAME_NOT_BLANK("Firstname cannot be blank"),
    LASTNAME_NOT_BLANK("Lastname cannot be blank"),
    DOB_REQUIRED("Date of birth is required"),
    INVALID_DOB("You must be at least {min} years old"),
    ROLES_NOT_NULL("Roles cannot be null"),
    PASSWORD_MISMATCH("Password mismatch"),
    UNAUTHORIZED_ACCESS("Unauthorized access"),
    INVALID_TOKEN("Token has been invalidated and cannot be used"),
    ACCESS_DENIED("You do not have permission"),
    USER_NOT_FOUND("User not found"),
    USER_NOT_EXISTS("User does not exist"),
    USER_EXISTS("User already exists"),
    ROLE_NOT_FOUND("Role not found"),
    EVENT_NOT_FOUND("Event not found"),
    RESOURCE_NOT_FOUND("Resource not found"),
    INVALID_OPERATION("Invalid operation"),
    KANBAN_BOARD_NOT_FOUND("Kanban board not found"),
    KANBAN_COLUMN_NOT_FOUND("Kanban column not found"),
    KANBAN_TASK_NOT_FOUND("Kanban task not found"),
    ACCOUNT_NOT_VERIFIED("Account not verified. Please check your email for verification code."),
    INVALID_REFRESH_TOKEN("Invalid refresh token"),
    REFRESH_TOKEN_EXPIRED("Refresh token expired"),
    EMAIL_ALREADY_EXISTS("Email already exists with another account");

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