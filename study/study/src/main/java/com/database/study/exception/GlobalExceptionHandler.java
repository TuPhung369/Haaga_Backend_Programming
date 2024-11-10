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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@ControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  // Utility method to build an error response based on the provided ErrorCode
  private ApiResponse<Object> buildErrorResponse(ErrorCode errorCode) {
    return ApiResponse.<Object>builder()
        .code(errorCode.getCode())
        .message(errorCode.getMessage())
        .httpStatus(errorCode.getHttpStatus())
        .httpCode(errorCode.getHttpCode())
        .severity(errorCode.getSeverity())
        .build();
  }

  // Handle custom AppException and return a structured error response
  @ExceptionHandler(AppException.class)
  public ResponseEntity<ApiResponse<Object>> handleAppException(AppException exception) {
    log.error("Handling AppException: {}", exception.getErrorCode().getMessage(), exception);
    ApiResponse<Object> apiResponse = buildErrorResponse(exception.getErrorCode());
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

  // Handle validation exceptions and return a structured error response
  @ExceptionHandler(MethodArgumentNotValidException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public ResponseEntity<ApiResponse<Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
    // Extract the first error field and message
    String field = ex.getBindingResult().getFieldErrors().get(0).getField();
    // String message =
    // ex.getBindingResult().getFieldErrors().get(0).getDefaultMessage();

    // Fallback to a generic error code if needed
    ErrorCode errorCode = ErrorCode.INVALID_REQUEST;

    // Optionally, if you have more mappings or specific conditions, you can add
    // them dynamically
    // or fallback to generic handling
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
      // Add cases as needed for more fields
      default:
        errorCode = ErrorCode.INVALID_REQUEST;
        break;
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
    ApiResponse<Object> apiResponse = buildErrorResponse(errorCode);

    return new ResponseEntity<>(apiResponse, HttpStatus.BAD_REQUEST);
  }
}