package com.database.study.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

public class ENUMS {

  @Getter
  @AllArgsConstructor
  public enum Role {
    ADMIN("Administrator - Full access to the system"),
    USER("Regular User - Limited access"),
    MANAGER("Manager - Can oversee and manage user activities");

    private final String description;
  }

  @Getter
  @AllArgsConstructor
  public enum Permission {
    CREATE("Permission to create data"),
    READ("Permission to read data"),
    UPDATE("Permission to update existing data"),
    DELETE("Permission to delete data");

    private final String description;
  }

  @Getter
  @AllArgsConstructor
  public enum ErrorMessages {
    GENERAL_EXCEPTION("General server error"),
    INVALID_REQUEST("Invalid request"),
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
    ROLE_NOT_FOUND("Role not found");

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
