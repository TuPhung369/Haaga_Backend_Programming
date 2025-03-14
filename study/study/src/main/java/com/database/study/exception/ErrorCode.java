package com.database.study.exception;

import org.springframework.http.HttpStatus;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import com.database.study.enums.ENUMS;

@Getter
@FieldDefaults(level = AccessLevel.PRIVATE)
public enum ErrorCode {
        GENERAL_EXCEPTION(5000, ENUMS.ErrorMessages.GENERAL_EXCEPTION.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR,
                        "500",
                        ENUMS.Severity.HIGH.name()), // Server error
        INVALID_REQUEST(4000, ENUMS.ErrorMessages.INVALID_REQUEST.getMessage(), HttpStatus.BAD_REQUEST, "400",
                        ENUMS.Severity.MEDIUM.name()), // Bad request
        EMAIL_NOT_BLANK(4001, ENUMS.ErrorMessages.EMAIL_NOT_BLANK.getMessage(), HttpStatus.BAD_REQUEST, "400",
                        ENUMS.Severity.MEDIUM.name()),
        EMAIL_INVALID(4002, ENUMS.ErrorMessages.EMAIL_INVALID.getMessage(), HttpStatus.BAD_REQUEST, "400",
                        ENUMS.Severity.MEDIUM.name()),
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
                        ENUMS.Severity.LOW.name()), // Not found
        EVENT_NOT_FOUND(4043, ENUMS.ErrorMessages.EVENT_NOT_FOUND.getMessage(), HttpStatus.NOT_FOUND, "404",
                        ENUMS.Severity.LOW.name()), // Not found
        RESOURCE_NOT_FOUND(4044, ENUMS.ErrorMessages.RESOURCE_NOT_FOUND.getMessage(), HttpStatus.NOT_FOUND, "404",
                        ENUMS.Severity.LOW.name()), // Not found
        INVALID_OPERATION(4045, ENUMS.ErrorMessages.INVALID_OPERATION.getMessage(), HttpStatus.BAD_REQUEST, "400",
                        ENUMS.Severity.MEDIUM.name()), // Bad request
        KANBAN_BOARD_NOT_FOUND(4046, ENUMS.ErrorMessages.KANBAN_BOARD_NOT_FOUND.getMessage(), HttpStatus.NOT_FOUND,
                        "404",
                        ENUMS.Severity.LOW.name()), // Not found
        KANBAN_COLUMN_NOT_FOUND(4047, ENUMS.ErrorMessages.KANBAN_COLUMN_NOT_FOUND.getMessage(), HttpStatus.NOT_FOUND,
                        "404",
                        ENUMS.Severity.LOW.name()), // Not found
        KANBAN_TASK_NOT_FOUND(4048, ENUMS.ErrorMessages.KANBAN_TASK_NOT_FOUND.getMessage(), HttpStatus.NOT_FOUND, "404",
                        ENUMS.Severity.LOW.name()), // Not found
        ACCOUNT_NOT_VERIFIED(4012, ENUMS.ErrorMessages.ACCOUNT_NOT_VERIFIED.getMessage(), HttpStatus.UNAUTHORIZED,
                        "401", ENUMS.Severity.HIGH.name()), // Unauthorized
        ACCOUNT_LOCKED(4031, "Account locked for security reasons", HttpStatus.FORBIDDEN,
                        "403", ENUMS.Severity.HIGH.name()), // Forbidden
        INVALID_REFRESH_TOKEN(4013, ENUMS.ErrorMessages.INVALID_REFRESH_TOKEN.getMessage(), HttpStatus.UNAUTHORIZED,
                        "401", ENUMS.Severity.HIGH.name()), // Unauthorized
        REFRESH_TOKEN_EXPIRED(4014, ENUMS.ErrorMessages.REFRESH_TOKEN_EXPIRED.getMessage(), HttpStatus.UNAUTHORIZED,
                        "401", ENUMS.Severity.HIGH.name()), // Unauthorized
        EMAIL_ALREADY_EXISTS(5001, ENUMS.ErrorMessages.EMAIL_ALREADY_EXISTS.getMessage(), HttpStatus.CONFLICT,
                        "409", ENUMS.Severity.MEDIUM.name()),
        TOTP_REQUIRED(4015, ENUMS.ErrorMessages.TOTP_REQUIRED.getMessage(), HttpStatus.UNAUTHORIZED, "401",
                        ENUMS.Severity.HIGH.name()),
        TOTP_INVALID(4016, ENUMS.ErrorMessages.TOTP_INVALID.getMessage(), HttpStatus.UNAUTHORIZED, "401",
                        ENUMS.Severity.HIGH.name()),
        TOTP_ALREADY_ENABLED(4091, ENUMS.ErrorMessages.TOTP_ALREADY_ENABLED.getMessage(), HttpStatus.CONFLICT, "409",
                        ENUMS.Severity.MEDIUM.name()),
        TOTP_VERIFICATION_REQUIRED(4017,
                        "Verification with current TOTP device or backup code is required for this operation",
                        HttpStatus.UNAUTHORIZED, "401", ENUMS.Severity.HIGH.name()),
        // TOTP_CHANGE_DENIED
        TOTP_CHANGE_DENIED(4018, "TOTP device change denied. Verification failed or admin approval required",
                        HttpStatus.FORBIDDEN, "403", ENUMS.Severity.HIGH.name()),
        // TOTP_ADMIN_RESET_REQUIRED
        TOTP_ADMIN_RESET_REQUIRED(4019, "TOTP reset requires administrator verification. Please contact support",
                        HttpStatus.FORBIDDEN, "403", ENUMS.Severity.HIGH.name()),
        // Add OTP-related error codes
        OTP_EXPIRED(4020, ENUMS.ErrorMessages.OTP_EXPIRED.getMessage(), HttpStatus.BAD_REQUEST, "400",
                        ENUMS.Severity.MEDIUM.name()),
        INVALID_OTP(4021, ENUMS.ErrorMessages.INVALID_OTP.getMessage(), HttpStatus.BAD_REQUEST, "400",
                        ENUMS.Severity.MEDIUM.name()),
        // Authentication error codes
        INVALID_CREDENTIALS(4022, "Invalid username or password", HttpStatus.UNAUTHORIZED, "401",
                        ENUMS.Severity.MEDIUM.name()),
        INACTIVE_USER(4023, "User account is inactive", HttpStatus.UNAUTHORIZED, "401",
                        ENUMS.Severity.MEDIUM.name()),
        FORBIDDEN(4024, "Access forbidden", HttpStatus.FORBIDDEN, "403",
                        ENUMS.Severity.HIGH.name()),
        NOT_FOUND(4025, "Resource not found", HttpStatus.NOT_FOUND, "404",
                        ENUMS.Severity.LOW.name()),
        ACCOUNT_BLOCKED(4026, "Account blocked for security reasons", HttpStatus.FORBIDDEN, "403",
                        ENUMS.Severity.HIGH.name());

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