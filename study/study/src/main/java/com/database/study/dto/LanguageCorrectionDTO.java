package com.database.study.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LanguageCorrectionDTO {
  private String id;
  private String originalText;
  private String correctedText;
  private String explanation;
}