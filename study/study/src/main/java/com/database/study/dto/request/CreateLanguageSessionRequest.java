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
public class CreateLanguageSessionRequest {

  @NotBlank(message = "User ID cannot be blank")
  private String userId;

  @NotBlank(message = "Language cannot be blank")
  private String language;

  private ProficiencyLevel proficiencyLevel;

  @NotNull(message = "Recaptcha token is required")
  private String recaptchaToken;
}