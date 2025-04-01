package com.database.study.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LanguageInteractionDTO {
  private String id;
  private String sessionId;
  private String userMessage;
  private String aiResponse;
  private String audioUrl;
  private String userAudioUrl;
  private LanguageFeedbackDTO feedback;
  private LocalDateTime createdAt;
}