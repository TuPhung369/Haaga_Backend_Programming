package com.database.study.exception;

public enum ErrorCode {
  GENERAL_EXCEPTION(9999, "General script exception"),
  USER_EXISTS(1001, "User already exists"),
  USER_NOT_FOUND(1002, "User not found"),
  INVALID_REQUEST(1003, "Invalid request");

  ErrorCode(int code, String message) {
    this.code = code;
    this.message = message;
  }

  private int code;
  private String message;

  public int getCode() {
    return code;
  }

  public String getMessage() {
    return message;
  }
}