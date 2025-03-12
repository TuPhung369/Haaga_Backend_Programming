package com.database.study.exception;

import java.util.Map;
import java.util.HashMap;

public class AppException extends RuntimeException {
    private final ErrorCode errorCode;
    private final Map<String, Object> metadata;

    // Constructor with just ErrorCode
    public AppException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.metadata = new HashMap<>();
    }

    // Constructor with ErrorCode and custom message
    public AppException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
        this.metadata = new HashMap<>();
    }

    // Constructor with ErrorCode and cause
    public AppException(ErrorCode errorCode, Throwable cause) {
        super(errorCode.getMessage(), cause);
        this.errorCode = errorCode;
        this.metadata = new HashMap<>();
    }

    // Constructor with ErrorCode, message, and cause
    public AppException(ErrorCode errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.metadata = new HashMap<>();
    }

    // Add metadata for more context
    public AppException addMetadata(String key, Object value) {
        this.metadata.put(key, value);
        return this;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }
}