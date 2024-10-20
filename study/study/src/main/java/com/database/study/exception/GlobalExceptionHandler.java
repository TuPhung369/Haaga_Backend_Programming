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
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@ControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  private ApiResponse<Object> buildErrorResponse(ErrorCode errorCode) {
    return ApiResponse.<Object>builder()
        .code(errorCode.getCode())
        .message(errorCode.getMessage())
        .httpStatus(errorCode.getHttpStatus())
        .httpCode(errorCode.getHttpCode())
        .severity(errorCode.getSeverity())
        .build();
  }

  @ExceptionHandler(AppException.class)
  public ResponseEntity<ApiResponse<Object>> handleAppException(AppException exception) {
    log.error("Handling AppException: {}", exception.getErrorCode().getMessage(), exception);
    ApiResponse<Object> apiResponse = buildErrorResponse(exception.getErrorCode());
    return new ResponseEntity<>(apiResponse, exception.getErrorCode().getHttpStatus());
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiResponse<Object>> handleGeneralException(Exception exception) {
    log.error("General exception occurred: {}", exception.getMessage(), exception);
    ApiResponse<Object> apiResponse = buildErrorResponse(ErrorCode.GENERAL_EXCEPTION);
    return new ResponseEntity<>(apiResponse, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(
      MethodArgumentNotValidException ex) {
    Map<String, String> errors = new HashMap<>();
    ex.getBindingResult().getFieldErrors().forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));

    ApiResponse<Map<String, String>> apiResponse = ApiResponse.<Map<String, String>>builder()
        .code(ErrorCode.INVALID_REQUEST.getCode())
        .message("Validation errors occurred")
        .result(errors)
        .build();

    return new ResponseEntity<>(apiResponse, HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ApiResponse<Object>> handleAccessDeniedException(AccessDeniedException exception) {
    log.error("Access denied: {}", exception.getMessage(), exception);
    ApiResponse<Object> apiResponse = buildErrorResponse(ErrorCode.ACCESS_DENIED);
    return new ResponseEntity<>(apiResponse, HttpStatus.FORBIDDEN);
  }

  @ExceptionHandler(InsufficientAuthenticationException.class)
  public ResponseEntity<ApiResponse<Object>> handleInsufficientAuthenticationException(
      InsufficientAuthenticationException exception) {
    log.error("Authentication failed: {}", exception.getMessage(), exception);
    ApiResponse<Object> apiResponse = buildErrorResponse(ErrorCode.UNAUTHORIZED_ACCESS);
    return new ResponseEntity<>(apiResponse, HttpStatus.UNAUTHORIZED);
  }
}
