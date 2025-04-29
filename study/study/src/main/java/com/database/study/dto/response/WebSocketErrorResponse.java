package com.database.study.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WebSocketErrorResponse {
  private String error;
  private String message;
  private long timestamp;

  public WebSocketErrorResponse(String error, String message) {
    this.error = error;
    this.message = message;
    this.timestamp = System.currentTimeMillis();
  }
}