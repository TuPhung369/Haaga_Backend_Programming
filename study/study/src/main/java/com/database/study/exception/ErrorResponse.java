package com.database.study.exception;

import java.time.LocalDateTime;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;

import lombok.Data;

@Data
@JsonInclude(Include.NON_NULL)
public class ErrorResponse {
  private String message;
  private String errorCode;
  private String code;
  private Integer remainingAttempts;
  private Map<String, Object> extraInfo;

  @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
  private LocalDateTime timestamp = LocalDateTime.now();

  public ErrorResponse(String message, String errorCode) {
    this.message = message;
    this.errorCode = errorCode;
  }

  public void setRemainingAttempts(Integer remainingAttempts) {
    this.remainingAttempts = remainingAttempts;
  }

  public void setCode(String code) {
    this.code = code;
  }

  public void setExtraInfo(Map<String, Object> extraInfo) {
    this.extraInfo = extraInfo;
  }
}