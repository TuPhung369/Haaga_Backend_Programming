package com.database.study.exception;

public class EntityNotFoundException extends AppException {

  private final String entityName;
  private final String identifier;

  public EntityNotFoundException(String entityName, String identifier) {
    super(ErrorCode.RESOURCE_NOT_FOUND,
        String.format("%s with identifier %s not found", entityName, identifier));
    this.entityName = entityName;
    this.identifier = identifier;
    addMetadata("entityName", entityName);
    addMetadata("identifier", identifier);
  }

  public EntityNotFoundException(String message) {
    super(ErrorCode.RESOURCE_NOT_FOUND, message);
    this.entityName = "Entity";
    this.identifier = "unknown";
  }

  public String getEntityName() {
    return entityName;
  }

  public String getIdentifier() {
    return identifier;
  }
}