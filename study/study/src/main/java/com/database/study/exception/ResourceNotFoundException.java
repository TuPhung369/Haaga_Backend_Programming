package com.database.study.exception;

public class ResourceNotFoundException extends AppException {
    
    private final String resourceType;
    private final String resourceId;
    
    public ResourceNotFoundException(String resourceType, String resourceId) {
        super(ErrorCode.RESOURCE_NOT_FOUND);
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        addMetadata("resourceType", resourceType);
        addMetadata("resourceId", resourceId);
    }
    
    @Override
    public String getMessage() {
        return String.format("%s with ID %s not found", resourceType, resourceId);
    }
    
    public String getResourceType() {
        return resourceType;
    }
    
    public String getResourceId() {
        return resourceId;
    }
}