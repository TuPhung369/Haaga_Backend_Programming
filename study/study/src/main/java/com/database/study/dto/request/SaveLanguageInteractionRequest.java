package com.database.study.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaveLanguageInteractionRequest {

  @NotBlank(message = "Session ID cannot be blank")
  private String sessionId;

  @NotBlank(message = "User message cannot be blank")
  private String userMessage;

  @NotBlank(message = "AI response cannot be blank")
  private String aiResponse;

  private String audioUrl;

  private String userAudioUrl;

  @NotNull(message = "Recaptcha token is required")
  private String recaptchaToken;
}