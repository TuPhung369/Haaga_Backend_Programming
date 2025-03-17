package com.database.study.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;

import com.database.study.dto.response.ApiResponse;
import com.database.study.enums.ENUMS;

import org.springframework.validation.FieldError;
import jakarta.validation.ConstraintViolation;

import java.util.HashMap;
import java.util.Map;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

  // Utility method to build an error response based on the provided ErrorCode
  private ApiResponse<Object> buildErrorResponse(ErrorCode errorCode, String customMessage) {
    String responseMessage = (customMessage != null && !customMessage.isEmpty()) ? customMessage
        : errorCode.getMessage();
    // log.warn("Error message from Response: {}", responseMessage);
    return ApiResponse.<Object>builder()
        .code(errorCode.getCode())
        .message(responseMessage)
        .httpStatus(errorCode.getHttpStatus())
        .httpCode(errorCode.getHttpCode())
        .severity(errorCode.getSeverity())
        .build();
  }

  // Overloaded method to build an error response without customMessage
  private ApiResponse<Object> buildErrorResponse(ErrorCode errorCode) {
    return buildErrorResponse(errorCode, null);
  }

  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<ApiResponse<Object>> handleResourceNotFoundException(ResourceNotFoundException exception) {
    log.error("Resource not found: {}", exception.getMessage(), exception);
    ApiResponse<Object> apiResponse = buildErrorResponse(exception.getErrorCode(), exception.getMessage());

    // Add metadata to response if needed
    if (!exception.getMetadata().isEmpty()) {
      apiResponse.setMetadata(exception.getMetadata());
    }

    return new ResponseEntity<>(apiResponse, exception.getErrorCode().getHttpStatus());
  }

  // Handle custom AppException and return a structured error response
  @ExceptionHandler(AppException.class)
  public ResponseEntity<ErrorResponse> handleAppException(AppException ex) {
    log.error("Handling AppException: {}", ex.getMessage(), ex);

    ErrorResponse errorResponse = new ErrorResponse(
        ex.getMessage(),
        ex.getErrorCode() != null ? ex.getErrorCode().name() : "APPLICATION_ERROR");

    // Add remaining attempts info if present
    if (ex.getExtraInfo("remainingAttempts") != null) {
      errorResponse.setRemainingAttempts((Integer) ex.getExtraInfo("remainingAttempts"));
    }

    // Add any code information if present
    if (ex.getCode() != null) {
      errorResponse.setCode(ex.getCode());
    }

    // Add all extra info to response
    if (!ex.getAllExtraInfo().isEmpty()) {
      errorResponse.setExtraInfo(ex.getAllExtraInfo());
    }

    HttpStatus status = HttpStatus.BAD_REQUEST;
    if (ex.getErrorCode() == ErrorCode.INVALID_TOKEN || ex.getErrorCode() == ErrorCode.UNAUTHORIZED_ACCESS) {
      status = HttpStatus.UNAUTHORIZED;
    } else if (ex.getErrorCode() == ErrorCode.FORBIDDEN || ex.getErrorCode() == ErrorCode.ACCESS_DENIED) {
      status = HttpStatus.FORBIDDEN;
    } else if (ex.getErrorCode() == ErrorCode.NOT_FOUND || ex.getErrorCode() == ErrorCode.RESOURCE_NOT_FOUND) {
      status = HttpStatus.NOT_FOUND;
    } else if (ex.getErrorCode() == ErrorCode.ACCOUNT_BLOCKED || ex.getErrorCode() == ErrorCode.ACCOUNT_BLOCKED) {
      status = HttpStatus.FORBIDDEN;
    }

    return new ResponseEntity<>(errorResponse, status);
  }

  // Method 2: This one is for backward compatibility with direct calls from your
  // code
  // Remove the @ExceptionHandler annotation so Spring doesn't get confused
  public ResponseEntity<ApiResponse<Object>> handleAppException(AppException exception, String customMessage) {
    log.error("Handling AppException with custom message: {}", customMessage, exception);
    ApiResponse<Object> apiResponse = buildErrorResponse(exception.getErrorCode(), customMessage);
    return new ResponseEntity<>(apiResponse, exception.getErrorCode().getHttpStatus());
  }

  // Handle JwtException and return a structured error response
  @ExceptionHandler(JwtException.class)
  public ResponseEntity<ApiResponse<Object>> handleJwtException(JwtException exception) {
    log.error("JWT validation error: {}", exception.getMessage());
    ApiResponse<Object> apiResponse = buildErrorResponse(ErrorCode.INVALID_TOKEN,
        "JWT validation failed: " + exception.getMessage());
    return new ResponseEntity<>(apiResponse, HttpStatus.UNAUTHORIZED);
  }

  // Handle AccessDeniedException and return a structured error response
  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ApiResponse<Object>> handleAccessDeniedException(AccessDeniedException exception) {
    log.error("Access denied: {}", exception.getMessage(), exception);
    ApiResponse<Object> apiResponse = buildErrorResponse(ErrorCode.ACCESS_DENIED);
    return new ResponseEntity<>(apiResponse, HttpStatus.FORBIDDEN);
  }

  // Handle InsufficientAuthenticationException and roles or authorities, and
  // additional authentication is required but not provided
  @ExceptionHandler(InsufficientAuthenticationException.class)
  public ResponseEntity<ApiResponse<Object>> handleInsufficientAuthenticationException(
      InsufficientAuthenticationException exception) {
    log.error("Authentication failed: {}", exception.getMessage(), exception);
    ApiResponse<Object> apiResponse = buildErrorResponse(ErrorCode.UNAUTHORIZED_ACCESS);
    return new ResponseEntity<>(apiResponse, HttpStatus.UNAUTHORIZED);
  }

  // Handle validation exceptions and return a structured error response
  @ExceptionHandler(MethodArgumentNotValidException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public ResponseEntity<ApiResponse<Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
    String field = ex.getBindingResult().getFieldErrors().get(0).getField();
    String messageCode = ex.getBindingResult().getFieldErrors().get(0).getDefaultMessage();
    ErrorCode errorCode = ErrorCode.INVALID_REQUEST;

    // Attempt to unwrap ConstraintViolation and extract attributes if present
    Map<String, Object> attributes = new HashMap<>();
    try {
      ConstraintViolation<?> violation = ((FieldError) ex.getBindingResult().getFieldErrors().get(0))
          .unwrap(ConstraintViolation.class);
      attributes = violation.getConstraintDescriptor().getAttributes();
    } catch (Exception e) {
      log.warn("Could not extract constraint attributes: {}", e.getMessage());
    }
    log.warn("Attributes: {}", attributes);

    // Map messageCode to ENUMS.ErrorMessages and replace placeholders using
    // attributes
    String detailedMessage = mapToDetailedMessage(messageCode, attributes);

    errorCode = switch (field) {
      case "username" -> ErrorCode.USERNAME_LENGTH;
      case "password" -> ErrorCode.PASSWORD_MIN_LENGTH;
      case "firstname" -> ErrorCode.FIRSTNAME_NOT_BLANK;
      case "lastname" -> ErrorCode.LASTNAME_NOT_BLANK;
      case "dob" -> ErrorCode.INVALID_DOB;
      case "roles" -> ErrorCode.ROLES_NOT_NULL;
      default -> errorCode;
    };

    // log.warn("Validation error for field '{}': {}", field, message);
    ApiResponse<Object> apiResponse = buildErrorResponse(errorCode, detailedMessage);
    return new ResponseEntity<>(apiResponse, HttpStatus.BAD_REQUEST);
  }

  // Handle general exceptions and return a structured error response
  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiResponse<Object>> handleGeneralException(Exception exception) {
    log.error("General exception occurred: {}", exception.getMessage(), exception);
    ApiResponse<Object> apiResponse = buildErrorResponse(ErrorCode.GENERAL_EXCEPTION);
    return new ResponseEntity<>(apiResponse, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  private String mapToDetailedMessage(String messageCode, Map<String, Object> attributes) {
    // Retrieve the message template from ENUMS.ErrorMessages based on the code
    String messageTemplate;
    try {
      ENUMS.ErrorMessages errorMessage = ENUMS.ErrorMessages.valueOf(messageCode);
      messageTemplate = errorMessage.getMessage();
    } catch (IllegalArgumentException e) {
      log.warn("No matching message found for code: {}", messageCode);
      return messageCode;
    }

    // Replace placeholders (e.g., {min}, {max}) with attribute values
    for (Map.Entry<String, Object> entry : attributes.entrySet()) {
      messageTemplate = messageTemplate.replace("{" + entry.getKey() + "}", entry.getValue().toString());
    }

    return messageTemplate;
  }

}