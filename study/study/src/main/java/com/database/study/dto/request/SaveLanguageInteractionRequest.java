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
public class SaveLanguageInteractionRequest {

  @NotBlank(message = "User ID cannot be blank")
  private String userId;

  @NotBlank(message = "Language cannot be blank")
  private String language;

  private ProficiencyLevel proficiencyLevel; // Can be optional if derived from metadata

  @NotBlank(message = "User message cannot be blank")
  private String userMessage;

  @NotBlank(message = "AI response cannot be blank")
  private String aiResponse;

  private String audioUrl; // URL for AI audio

  private String userAudioUrl; // URL for user audio

  @NotNull(message = "Recaptcha token is required")
  private String recaptchaToken;
}