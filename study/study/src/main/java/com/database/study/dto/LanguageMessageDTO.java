package com.database.study.dto;

import com.database.study.enums.MessageType;
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
public class LanguageMessageDTO {
  private String id;
  private String userId;
  private String sessionId;
  private String language;
  private ProficiencyLevel proficiencyLevel;
  private MessageType messageType;

  // All message types have a content field
  private String content;

  // User message (same as content for USER_MESSAGE type)
  private String userMessage;

  // AI response (same as content for AI_RESPONSE type)
  private String aiResponse;

  private String audioUrl;
  private String userAudioUrl;
  private Boolean isSessionMetadata;

  // Assessment fields (only used for AI feedback messages)
  private Integer pronunciationScore;
  private Integer grammarScore;
  private Integer vocabularyScore;
  private Integer fluencyScore;
  private String corrections;
  private String suggestions;

  // Reference fields
  private String replyToId;

  // Timestamps
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}