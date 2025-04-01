package com.database.study.dto.request;

import com.database.study.enums.ProficiencyLevel;
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
public class ProcessAudioRequest {

  @NotBlank(message = "User ID cannot be blank")
  private String userId;

  @NotBlank(message = "Session ID cannot be blank")
  private String sessionId;

  @NotBlank(message = "Message cannot be blank")
  private String message;

  @NotBlank(message = "Language code cannot be blank")
  private String language;

  private ProficiencyLevel proficiencyLevel;

  private String audioData; // Base64 encoded audio data if sent directly

  @NotNull(message = "Recaptcha token is required")
  private String recaptchaToken;
}