package com.database.study.exception;

public class InvalidTokenException extends AppException {
    
    private final String tokenType;
    
    public InvalidTokenException(String tokenType) {
        super(ErrorCode.INVALID_TOKEN);
        this.tokenType = tokenType;
        addMetadata("tokenType", tokenType);
    }
    
    @Override
    public String getMessage() {
        return String.format("Invalid %s token", tokenType);
    }
}