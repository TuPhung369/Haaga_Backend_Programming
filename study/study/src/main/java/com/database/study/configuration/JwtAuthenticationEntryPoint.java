package com.database.study.configuration;

import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.http.MediaType;
import com.database.study.dto.request.ApiResponse;
import com.database.study.exception.ErrorCode;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.ServletException;
import java.io.IOException;
import org.springframework.security.core.AuthenticationException;
import com.fasterxml.jackson.databind.ObjectMapper;

public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

  // ErrorCode for unauthenticated requests
  private final ErrorCode errorCode = ErrorCode.UNAUTHORIZED_ACCESS;

  @Override
  public void commence(HttpServletRequest request, HttpServletResponse response,
      AuthenticationException authException) throws IOException, ServletException {
    // Set the response status and content type
    response.setStatus(errorCode.getHttpStatus().value());
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);

    // Build the ApiResponse object with appropriate error details
    ApiResponse<Object> apiResponse = ApiResponse.builder()
        .code(errorCode.getCode())
        .message(errorCode.getMessage())
        .httpStatus(errorCode.getHttpStatus())
        .httpCode(errorCode.getHttpCode())
        .severity(errorCode.getSeverity())
        .build();

    // Write the ApiResponse as JSON to the response body
    ObjectMapper mapper = new ObjectMapper(); // convert object to JSON
    response.getWriter().write(mapper.writeValueAsString(apiResponse));
    response.flushBuffer();
  }
}
