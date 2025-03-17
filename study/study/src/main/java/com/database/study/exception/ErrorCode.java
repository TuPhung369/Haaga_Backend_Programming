package com.database.study.exception;

import org.springframework.http.HttpStatus;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import com.database.study.enums.ENUMS;

@Getter
@FieldDefaults(level = AccessLevel.PRIVATE)
public enum ErrorCode {
        // 400 - BAD REQUEST
        EMAIL_INVALID(4002, ENUMS.ErrorMessages.EMAIL_INVALID.getMessage(), HttpStatus.BAD_REQUEST, "400",
                        ENUMS.Severity.MEDIUM.name()),
        EMAIL_NOT_BLANK(4001, ENUMS.ErrorMessages.EMAIL_NOT_BLANK.getMessage(), HttpStatus.BAD_REQUEST, "400",
                        ENUMS.Severity.MEDIUM.name()),
        FIRSTNAME_NOT_BLANK(4004, ENUMS.ErrorMessages.FIRSTNAME_NOT_BLANK.getMessage(), HttpStatus.BAD_REQUEST, "400",
                        ENUMS.Severity.MEDIUM.name()),
        INVALID_DOB(4007, ENUMS.ErrorMessages.INVALID_DOB.getMessage(), HttpStatus.BAD_REQUEST, "400",
                        ENUMS.Severity.MEDIUM.name()),
        INVALID_OPERATION(4045, ENUMS.ErrorMessages.INVALID_OPERATION.getMessage(), HttpStatus.BAD_REQUEST, "400",
                        ENUMS.Severity.MEDIUM.name()),
        INVALID_REQUEST(4000, ENUMS.ErrorMessages.INVALID_REQUEST.getMessage(), HttpStatus.BAD_REQUEST, "400",
                        ENUMS.Severity.MEDIUM.name()),
        INVALID_OTP(4021, ENUMS.ErrorMessages.INVALID_OTP.getMessage(), HttpStatus.BAD_REQUEST, "400",
                        ENUMS.Severity.MEDIUM.name()),
        LASTNAME_NOT_BLANK(4005, ENUMS.ErrorMessages.LASTNAME_NOT_BLANK.getMessage(), HttpStatus.BAD_REQUEST, "400",
                        ENUMS.Severity.MEDIUM.name()),
        OTP_EXPIRED(4020, ENUMS.ErrorMessages.OTP_EXPIRED.getMessage(), HttpStatus.BAD_REQUEST, "400",
                        ENUMS.Severity.MEDIUM.name()),
        PASSWORD_MIN_LENGTH(4002, ENUMS.ErrorMessages.PASSWORD_MIN_LENGTH.getMessage(), HttpStatus.BAD_REQUEST, "400",
                        ENUMS.Severity.MEDIUM.name()),
        PASSWORD_MISMATCH(4009, ENUMS.ErrorMessages.PASSWORD_MISMATCH.getMessage(), HttpStatus.BAD_REQUEST, "400",
                        ENUMS.Severity.MEDIUM.name()),
        PASSWORD_VALIDATION(4003, ENUMS.ErrorMessages.PASSWORD_VALIDATION.getMessage(), HttpStatus.BAD_REQUEST, "400",
                        ENUMS.Severity.MEDIUM.name()),
        ROLES_NOT_NULL(4008, ENUMS.ErrorMessages.ROLES_NOT_NULL.getMessage(), HttpStatus.BAD_REQUEST, "400",
                        ENUMS.Severity.MEDIUM.name()),
        RECAPTCHA_REQUIRED(4033, ENUMS.ErrorMessages.RECAPTCHA_REQUIRED.getMessage(), HttpStatus.BAD_REQUEST, "400",
                        ENUMS.Severity.MEDIUM.name()),
        USERNAME_LENGTH(4001, ENUMS.ErrorMessages.USERNAME_LENGTH.getMessage(), HttpStatus.BAD_REQUEST, "400",
                        ENUMS.Severity.MEDIUM.name()),

        // 401 - UNAUTHORIZED
        ACCOUNT_NOT_VERIFIED(4012, ENUMS.ErrorMessages.ACCOUNT_NOT_VERIFIED.getMessage(), HttpStatus.UNAUTHORIZED,
                        "401", ENUMS.Severity.HIGH.name()),
        INACTIVE_USER(4023, ENUMS.ErrorMessages.INACTIVE_USER.getMessage(), HttpStatus.UNAUTHORIZED, "401",
                        ENUMS.Severity.MEDIUM.name()),
        INVALID_CREDENTIALS(4022, ENUMS.ErrorMessages.INVALID_CREDENTIALS.getMessage(), HttpStatus.UNAUTHORIZED, "401",
                        ENUMS.Severity.MEDIUM.name()),
        INVALID_REFRESH_TOKEN(4013, ENUMS.ErrorMessages.INVALID_REFRESH_TOKEN.getMessage(), HttpStatus.UNAUTHORIZED,
                        "401", ENUMS.Severity.HIGH.name()),
        INVALID_TOKEN(4011, ENUMS.ErrorMessages.INVALID_TOKEN.getMessage(), HttpStatus.UNAUTHORIZED, "401",
                        ENUMS.Severity.HIGH.name()),
        REFRESH_TOKEN_EXPIRED(4014, ENUMS.ErrorMessages.REFRESH_TOKEN_EXPIRED.getMessage(), HttpStatus.UNAUTHORIZED,
                        "401", ENUMS.Severity.HIGH.name()),
        TOTP_INVALID(4016, ENUMS.ErrorMessages.TOTP_INVALID.getMessage(), HttpStatus.UNAUTHORIZED, "401",
                        ENUMS.Severity.HIGH.name()),
        TOTP_REQUIRED(4015, ENUMS.ErrorMessages.TOTP_REQUIRED.getMessage(), HttpStatus.UNAUTHORIZED, "401",
                        ENUMS.Severity.HIGH.name()),
        TOTP_VERIFICATION_REQUIRED(4017, ENUMS.ErrorMessages.TOTP_VERIFICATION_REQUIRED.getMessage(),
                        HttpStatus.UNAUTHORIZED, "401", ENUMS.Severity.HIGH.name()),
        UNAUTHORIZED_ACCESS(4010, ENUMS.ErrorMessages.UNAUTHORIZED_ACCESS.getMessage(), HttpStatus.UNAUTHORIZED, "401",
                        ENUMS.Severity.HIGH.name()),

        // 403 - FORBIDDEN
        ACCESS_DENIED(4030, ENUMS.ErrorMessages.ACCESS_DENIED.getMessage(), HttpStatus.FORBIDDEN, "403",
                        ENUMS.Severity.HIGH.name()),
        ACCOUNT_BLOCKED(4026, ENUMS.ErrorMessages.ACCOUNT_BLOCKED.getMessage(), HttpStatus.FORBIDDEN, "403",
                        ENUMS.Severity.HIGH.name()),
        FORBIDDEN(4024, ENUMS.ErrorMessages.FORBIDDEN.getMessage(), HttpStatus.FORBIDDEN, "403",
                        ENUMS.Severity.HIGH.name()),
        RECAPTCHA_VALIDATION_FAILED(4032, ENUMS.ErrorMessages.RECAPTCHA_VALIDATION_FAILED.getMessage(),
                        HttpStatus.FORBIDDEN, "403", ENUMS.Severity.MEDIUM.name()),
        TOTP_ADMIN_RESET_REQUIRED(4019, ENUMS.ErrorMessages.TOTP_ADMIN_RESET_REQUIRED.getMessage(),
                        HttpStatus.FORBIDDEN, "403", ENUMS.Severity.HIGH.name()),
        TOTP_CHANGE_DENIED(4018, ENUMS.ErrorMessages.TOTP_CHANGE_DENIED.getMessage(), HttpStatus.FORBIDDEN, "403",
                        ENUMS.Severity.HIGH.name()),
        UNAUTHORIZED_ROLE_ASSIGNMENT(4034, ENUMS.ErrorMessages.UNAUTHORIZED_ROLE_ASSIGNMENT.getMessage(),
                        HttpStatus.FORBIDDEN, "403", ENUMS.Severity.MEDIUM.name()),

        // 404 - NOT FOUND
        EVENT_NOT_FOUND(4043, ENUMS.ErrorMessages.EVENT_NOT_FOUND.getMessage(), HttpStatus.NOT_FOUND, "404",
                        ENUMS.Severity.LOW.name()),
        KANBAN_BOARD_NOT_FOUND(4046, ENUMS.ErrorMessages.KANBAN_BOARD_NOT_FOUND.getMessage(), HttpStatus.NOT_FOUND,
                        "404", ENUMS.Severity.LOW.name()),
        KANBAN_COLUMN_NOT_FOUND(4047, ENUMS.ErrorMessages.KANBAN_COLUMN_NOT_FOUND.getMessage(), HttpStatus.NOT_FOUND,
                        "404", ENUMS.Severity.LOW.name()),
        KANBAN_TASK_NOT_FOUND(4048, ENUMS.ErrorMessages.KANBAN_TASK_NOT_FOUND.getMessage(), HttpStatus.NOT_FOUND, "404",
                        ENUMS.Severity.LOW.name()),
        NOT_FOUND(4025, ENUMS.ErrorMessages.NOT_FOUND.getMessage(), HttpStatus.NOT_FOUND, "404",
                        ENUMS.Severity.LOW.name()),
        RESOURCE_NOT_FOUND(4044, ENUMS.ErrorMessages.RESOURCE_NOT_FOUND.getMessage(), HttpStatus.NOT_FOUND, "404",
                        ENUMS.Severity.LOW.name()),
        ROLE_NOT_FOUND(4042, ENUMS.ErrorMessages.ROLE_NOT_FOUND.getMessage(), HttpStatus.NOT_FOUND, "404",
                        ENUMS.Severity.LOW.name()),
        USER_NOT_EXISTS(4041, ENUMS.ErrorMessages.USER_NOT_EXISTS.getMessage(), HttpStatus.NOT_FOUND, "404",
                        ENUMS.Severity.LOW.name()),
        USER_NOT_FOUND(4040, ENUMS.ErrorMessages.USER_NOT_FOUND.getMessage(), HttpStatus.NOT_FOUND, "404",
                        ENUMS.Severity.LOW.name()),

        // 409 - CONFLICT
        EMAIL_ALREADY_EXISTS(5001, ENUMS.ErrorMessages.EMAIL_ALREADY_EXISTS.getMessage(), HttpStatus.CONFLICT, "409",
                        ENUMS.Severity.MEDIUM.name()),
        TOTP_ALREADY_ENABLED(4091, ENUMS.ErrorMessages.TOTP_ALREADY_ENABLED.getMessage(), HttpStatus.CONFLICT, "409",
                        ENUMS.Severity.MEDIUM.name()),
        USER_EXISTS(4090, ENUMS.ErrorMessages.USER_EXISTS.getMessage(), HttpStatus.CONFLICT, "409",
                        ENUMS.Severity.MEDIUM.name()),

        // 500 - INTERNAL SERVER ERROR
        GENERAL_EXCEPTION(5000, ENUMS.ErrorMessages.GENERAL_EXCEPTION.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR,
                        "500", ENUMS.Severity.HIGH.name());

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