package com.database.study.dto.request;

import com.database.study.enums.ProficiencyLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSessionRequest {

  @NotBlank(message = "User ID is required")
  private String userId;

  @NotBlank(message = "Language is required")
  private String language;

  private ProficiencyLevel proficiencyLevel;

  private String recaptchaToken;
}