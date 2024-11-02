package com.database.study.exception;

import org.springframework.http.HttpStatus;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

@Getter
@FieldDefaults(level = AccessLevel.PRIVATE)
public enum ErrorCode {
  GENERAL_EXCEPTION(5000, "General server error", HttpStatus.INTERNAL_SERVER_ERROR, "500", "HIGH"), // Server error
  INVALID_REQUEST(4000, "Invalid request", HttpStatus.BAD_REQUEST, "400", "MEDIUM"), // Bad request
  PASSWORD_MISMATCH(4001, "Password mismatch", HttpStatus.BAD_REQUEST, "400", "MEDIUM"), // Bad request
  UNAUTHORIZED_ACCESS(4010, "Unauthorized access", HttpStatus.UNAUTHORIZED, "401", "HIGH"), // Unauthorized
  ACCESS_DENIED(4030, "You do not have permission", HttpStatus.FORBIDDEN, "403", "HIGH"), // Forbidden
  USER_NOT_FOUND(4040, "User not found", HttpStatus.NOT_FOUND, "404", "LOW"), // Not found
  USER_NOT_EXISTS(4041, "User does not exist", HttpStatus.NOT_FOUND, "404", "LOW"), // Similar to Not found
  USER_EXISTS(4090, "User already exists", HttpStatus.CONFLICT, "409", "MEDIUM"), // Conflict
  ROLE_NOT_FOUND(4042, "Role not found", HttpStatus.NOT_FOUND, "404", "LOW"); // Not found

  ErrorCode(int code, String message, HttpStatus httpStatus, String httpCode, String severity) {
    this.code = code;
    this.message = message;
    this.httpStatus = httpStatus;
    this.httpCode = httpCode;
    this.severity = severity;
  }

  final int code;
  final String message;
  final HttpStatus httpStatus;
  final String httpCode;
  final String severity;
}
