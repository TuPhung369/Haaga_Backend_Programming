package com.database.study.dto;

import com.database.study.enums.ProficiencyLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LanguageSessionDTO {
  private String id;
  private String userId;
  private String language;
  private ProficiencyLevel proficiencyLevel;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  private int interactionCount;
}