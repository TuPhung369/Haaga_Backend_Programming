package com.database.study.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

  // Handling AppException with logging
  @ExceptionHandler(AppException.class)
  public ResponseEntity<ApiResponse<Object>> handleAppException(AppException exception) {
    log.error("Handling AppException: {}", exception.getErrorCode().getMessage(), exception); // Log error with details
    ErrorCode errorCode = exception.getErrorCode();
    ApiResponse<Object> apiResponse = new ApiResponse<>();
    apiResponse.setCode(errorCode.getCode());
    apiResponse.setMessage(errorCode.getMessage());
    return new ResponseEntity<>(apiResponse, HttpStatus.NOT_FOUND);
  }

  // Handling all general exceptions
  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiResponse<Object>> handleGeneralException(Exception exception) {
    log.error("General exception occurred", exception); // Log stack trace
    ErrorCode errorCode = ErrorCode.GENERAL_EXCEPTION;
    ApiResponse<Object> apiResponse = new ApiResponse<>();
    apiResponse.setCode(errorCode.getCode());
    apiResponse.setMessage(errorCode.getMessage());
    return new ResponseEntity<>(apiResponse, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  // Handling validation errors
  @ExceptionHandler(MethodArgumentNotValidException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
    Map<String, String> errors = new HashMap<>();
    ex.getBindingResult().getFieldErrors().forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));
    return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
  }
}
