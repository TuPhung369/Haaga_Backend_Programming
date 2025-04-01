package com.database.study.exception;

public class UnauthorizedAccessException extends AppException {

    public UnauthorizedAccessException() {
        super(ErrorCode.UNAUTHORIZED_ACCESS);
    }

    public UnauthorizedAccessException(String message) {
        super(ErrorCode.UNAUTHORIZED_ACCESS, message);
    }
} 