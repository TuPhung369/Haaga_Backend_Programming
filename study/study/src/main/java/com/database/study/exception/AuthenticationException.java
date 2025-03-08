package com.database.study.exception;

public class AuthenticationException extends AppException {
    
    public AuthenticationException() {
        super(ErrorCode.UNAUTHORIZED_ACCESS);
    }
    
    public AuthenticationException(String message) {
        super(ErrorCode.UNAUTHORIZED_ACCESS, message);
    }
}