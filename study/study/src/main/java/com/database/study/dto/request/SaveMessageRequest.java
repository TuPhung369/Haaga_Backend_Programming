package com.database.study.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaveMessageRequest {

  @NotBlank(message = "Session ID is required")
  private String sessionId;

  @NotBlank(message = "User ID is required")
  private String userId;

  @NotBlank(message = "Message content is required")
  private String content;

  private String audioUrl;

  private String recaptchaToken;
}