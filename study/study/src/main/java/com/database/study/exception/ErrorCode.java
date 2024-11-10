package com.database.study.exception;

import org.springframework.http.HttpStatus;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import com.database.study.enums.ENUMS;

@Getter
@FieldDefaults(level = AccessLevel.PRIVATE)
public enum ErrorCode {
    GENERAL_EXCEPTION(5000, ENUMS.ErrorMessages.GENERAL_EXCEPTION.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR, "500",
            ENUMS.Severity.HIGH.name()), // Server error
    INVALID_REQUEST(4000, ENUMS.ErrorMessages.INVALID_REQUEST.getMessage(), HttpStatus.BAD_REQUEST, "400",
            ENUMS.Severity.MEDIUM.name()), // Bad request
    USERNAME_LENGTH(4001, ENUMS.ErrorMessages.USERNAME_LENGTH.getMessage(), HttpStatus.BAD_REQUEST, "400",
            ENUMS.Severity.MEDIUM.name()),
    PASSWORD_MIN_LENGTH(4002, ENUMS.ErrorMessages.PASSWORD_MIN_LENGTH.getMessage(), HttpStatus.BAD_REQUEST, "400",
            ENUMS.Severity.MEDIUM.name()),
    PASSWORD_VALIDATION(4003, ENUMS.ErrorMessages.PASSWORD_VALIDATION.getMessage(), HttpStatus.BAD_REQUEST, "400",
            ENUMS.Severity.MEDIUM.name()),
    FIRSTNAME_NOT_BLANK(4004, ENUMS.ErrorMessages.FIRSTNAME_NOT_BLANK.getMessage(), HttpStatus.BAD_REQUEST, "400",
            ENUMS.Severity.MEDIUM.name()),
    LASTNAME_NOT_BLANK(4005, ENUMS.ErrorMessages.LASTNAME_NOT_BLANK.getMessage(), HttpStatus.BAD_REQUEST, "400",
            ENUMS.Severity.MEDIUM.name()),
    DOB_REQUIRED(4006, ENUMS.ErrorMessages.DOB_REQUIRED.getMessage(), HttpStatus.BAD_REQUEST, "400",
            ENUMS.Severity.MEDIUM.name()),
    INVALID_DOB(4007, ENUMS.ErrorMessages.INVALID_DOB.getMessage(), HttpStatus.BAD_REQUEST, "400",
            ENUMS.Severity.MEDIUM.name()),
    ROLES_NOT_NULL(4008, ENUMS.ErrorMessages.ROLES_NOT_NULL.getMessage(), HttpStatus.BAD_REQUEST, "400",
            ENUMS.Severity.MEDIUM.name()),
    PASSWORD_MISMATCH(4009, ENUMS.ErrorMessages.PASSWORD_MISMATCH.getMessage(), HttpStatus.BAD_REQUEST, "400",
            ENUMS.Severity.MEDIUM.name()), // Bad request
    UNAUTHORIZED_ACCESS(4010, ENUMS.ErrorMessages.UNAUTHORIZED_ACCESS.getMessage(), HttpStatus.UNAUTHORIZED, "401",
            ENUMS.Severity.HIGH.name()), // Unauthorized
    INVALID_TOKEN(4011, ENUMS.ErrorMessages.INVALID_TOKEN.getMessage(), HttpStatus.UNAUTHORIZED, "401",
            ENUMS.Severity.HIGH.name()), // Unauthorized
    ACCESS_DENIED(4030, ENUMS.ErrorMessages.ACCESS_DENIED.getMessage(), HttpStatus.FORBIDDEN, "403",
            ENUMS.Severity.HIGH.name()), // Forbidden
    USER_NOT_FOUND(4040, ENUMS.ErrorMessages.USER_NOT_FOUND.getMessage(), HttpStatus.NOT_FOUND, "404",
            ENUMS.Severity.LOW.name()), // Not found
    USER_NOT_EXISTS(4041, ENUMS.ErrorMessages.USER_NOT_EXISTS.getMessage(), HttpStatus.NOT_FOUND, "404",
            ENUMS.Severity.LOW.name()), // Similar to Not found
    USER_EXISTS(4090, ENUMS.ErrorMessages.USER_EXISTS.getMessage(), HttpStatus.CONFLICT, "409",
            ENUMS.Severity.MEDIUM.name()), // Conflict
    ROLE_NOT_FOUND(4042, ENUMS.ErrorMessages.ROLE_NOT_FOUND.getMessage(), HttpStatus.NOT_FOUND, "404",
            ENUMS.Severity.LOW.name()); // Not found

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

    public String getMessage() {
        return message;
    }
}
