---
sidebar_position: 4
---

# Exception Handling

## Exception Handling Overview

The TuPhung Project implements a comprehensive exception handling strategy.

## Global Exception Handler

The system uses Spring's `@ControllerAdvice` to handle exceptions globally.

## Exception Types

### Application Exceptions

- `ResourceNotFoundException`: When a requested resource doesn't exist
- `UnauthorizedException`: When a user is not authorized to access a resource
- `ValidationException`: When input validation fails
- `DuplicateResourceException`: When attempting to create a duplicate resource

### System Exceptions

- `DatabaseException`: For database-related errors
- `ExternalServiceException`: For errors in external service calls
- `FileProcessingException`: For file upload/download errors

## Error Response Format

All API errors return a consistent JSON format:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid input data",
  "timestamp": "2023-05-15T10:30:45Z",
  "path": "/api/users",
  "details": [
    "Username must be between 3 and 20 characters",
    "Email format is invalid"
  ]
}
```

## Logging

All exceptions are logged with:

- Exception type
- Exception message
- Stack trace
- Request details
- User information (if available)

