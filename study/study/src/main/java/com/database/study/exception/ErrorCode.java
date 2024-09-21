package com.database.study.exception;

public enum ErrorCode {
  GENERAL_EXCEPTION(9999, "General script exception"),
  USER_EXISTS(1001, "User already exists"),
  USER_NOT_FOUND(1002, "User not found"),
  USER_NOT_EXISTS(1003, "User does not exist"),
  INVALID_REQUEST(1004, "Invalid request"),
  PASSWORD_MISMATCH(1005, "Password mismatch");

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