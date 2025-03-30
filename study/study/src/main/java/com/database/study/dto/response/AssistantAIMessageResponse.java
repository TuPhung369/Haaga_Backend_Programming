package com.database.study.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssistantAIMessageResponse {
  private Long id;
  private String content;
  private String sender; // "USER" or "AI"
  private LocalDateTime timestamp;
  private String sessionId;
}