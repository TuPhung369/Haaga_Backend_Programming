package com.database.study.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import com.database.study.dto.request.ApiResponse;
import com.database.study.enums.ENUMS;

import org.springframework.validation.FieldError;
import jakarta.validation.ConstraintViolation;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@ControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

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

  // Handle custom AppException and return a structured error response
  @ExceptionHandler(AppException.class)
  public ResponseEntity<ApiResponse<Object>> handleAppException(AppException exception) {
    log.error("Handling AppException: {}", exception.getErrorCode().getMessage(), exception);
    ApiResponse<Object> apiResponse = buildErrorResponse(exception.getErrorCode(), "");
    return new ResponseEntity<>(apiResponse, exception.getErrorCode().getHttpStatus());
  }

  // Handle general exceptions and return a structured error response
  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiResponse<Object>> handleGeneralException(Exception exception) {
    log.error("General exception occurred: {}", exception.getMessage(), exception);
    ApiResponse<Object> apiResponse = buildErrorResponse(ErrorCode.GENERAL_EXCEPTION);
    return new ResponseEntity<>(apiResponse, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  // Handle AccessDeniedException and return a structured error response
  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ApiResponse<Object>> handleAccessDeniedException(AccessDeniedException exception) {
    log.error("Access denied: {}", exception.getMessage(), exception);
    ApiResponse<Object> apiResponse = buildErrorResponse(ErrorCode.ACCESS_DENIED);
    return new ResponseEntity<>(apiResponse, HttpStatus.FORBIDDEN);
  }

  // Handle InsufficientAuthenticationException and return a structured error
  // response
  @ExceptionHandler(InsufficientAuthenticationException.class)
  public ResponseEntity<ApiResponse<Object>> handleInsufficientAuthenticationException(
      InsufficientAuthenticationException exception) {
    log.error("Authentication failed: {}", exception.getMessage(), exception);
    ApiResponse<Object> apiResponse = buildErrorResponse(ErrorCode.UNAUTHORIZED_ACCESS);
    return new ResponseEntity<>(apiResponse, HttpStatus.UNAUTHORIZED);
  }

  // // Build NEW response using the matched or fallback ErrorCode
  // ApiResponse<Object> apiResponse = ApiResponse.<Object>builder()
  // .code(errorCode.getCode())
  // .message(errorCode.getMessage())
  // .httpStatus(errorCode.getHttpStatus())
  // .httpCode(errorCode.getHttpCode())
  // .severity(errorCode.getSeverity())
  // .build();

  // Build response using the buildErrorResponse utility method
  // ApiResponse<Object> apiResponse = buildErrorResponse(errorCode, message);

  // return new ResponseEntity<>(apiResponse,HttpStatus.BAD_REQUEST);
  // }

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

    switch (field) {
      case "dob":
        errorCode = ErrorCode.INVALID_DOB;
        break;
      case "firstname":
        errorCode = ErrorCode.FIRSTNAME_NOT_BLANK;
        break;
      case "lastname":
        errorCode = ErrorCode.LASTNAME_NOT_BLANK;
        break;
      default:
        break;
    }

    // log.warn("Validation error for field '{}': {}", field, message);
    ApiResponse<Object> apiResponse = buildErrorResponse(errorCode, detailedMessage);
    return new ResponseEntity<>(apiResponse, HttpStatus.BAD_REQUEST);
  }

  private String mapToDetailedMessage(String messageCode, Map<String, Object> attributes) {
    // Retrieve the message template from ENUMS.ErrorMessages based on the code
    String messageTemplate = "";
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