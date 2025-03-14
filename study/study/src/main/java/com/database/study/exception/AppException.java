package com.database.study.exception;

import java.util.Map;
import java.util.HashMap;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AppException extends RuntimeException {
    private ErrorCode errorCode;
    private String code;
    private Map<String, Object> extraInfo = new HashMap<>();
    private Map<String, Object> metadata = new HashMap<>();

    public AppException(String message) {
        super(message);
    }

    public AppException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public AppException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public AppException(String message, Throwable cause) {
        super(message, cause);
    }

    public AppException(ErrorCode errorCode, Throwable cause) {
        super(errorCode.getMessage(), cause);
        this.errorCode = errorCode;
    }

    public AppException(ErrorCode errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    /**
     * Adds metadata for more context
     * 
     * @param key   Key for the metadata
     * @param value Value to store
     * @return This exception instance for chaining
     */
    public AppException addMetadata(String key, Object value) {
        this.metadata.put(key, value);
        return this;
    }

    /**
     * Gets all metadata from the exception
     * 
     * @return Map of all metadata
     */
    public Map<String, Object> getMetadata() {
        return metadata;
    }

    /**
     * Adds extra information to the exception
     * 
     * @param key   Key for the information
     * @param value Value to store
     * @return This exception instance for chaining
     */
    public AppException addExtraInfo(String key, Object value) {
        extraInfo.put(key, value);
        return this;
    }

    /**
     * Gets extra information from the exception
     * 
     * @param key Key for the information
     * @return Value stored, or null if not found
     */
    public Object getExtraInfo(String key) {
        return extraInfo.get(key);
    }

    /**
     * Gets all extra information from the exception
     * 
     * @return Map of all extra information
     */
    public Map<String, Object> getAllExtraInfo() {
        return extraInfo;
    }
}