package com.database.study.entity;

import com.database.study.enums.MessageType;
import com.database.study.enums.ProficiencyLevel;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "language_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LanguageMessage {

  @Id
  @UuidGenerator
  @Column(name = "id", columnDefinition = "VARCHAR(36)")
  private String id;

  @Column(name = "user_id", nullable = false)
  private String userId;

  // Keep session_id for database backwards compatibility
  @Column(name = "session_id", columnDefinition = "VARCHAR(255)")
  private String sessionId;

  @Column(name = "language", nullable = false)
  private String language;

  @Enumerated(EnumType.STRING)
  @Column(name = "proficiency_level")
  private ProficiencyLevel proficiencyLevel;

  @Enumerated(EnumType.STRING)
  @Column(name = "message_type", nullable = false)
  private MessageType messageType;

  // New fields for user and AI messages
  @Column(name = "user_message", columnDefinition = "TEXT")
  private String userMessage; // Content from the user

  @Column(name = "ai_response", columnDefinition = "TEXT")
  private String aiResponse; // Content from the AI

  // Keep content field for database compatibility (will be removed in future)
  @Column(name = "content", columnDefinition = "TEXT")
  private String content;

  @Column(name = "audio_url")
  private String audioUrl; // URL for AI-generated audio

  @Column(name = "user_audio_url")
  private String userAudioUrl; // URL for user-uploaded audio

  // Session metadata fields (stored on the first message associated with a
  // user/language)
  @Column(name = "is_session_metadata", nullable = false)
  private Boolean isSessionMetadata;

  // Assessment fields (only used for AI feedback messages)
  @Column(name = "pronunciation_score")
  private Integer pronunciationScore;

  @Column(name = "grammar_score")
  private Integer grammarScore;

  @Column(name = "vocabulary_score")
  private Integer vocabularyScore;

  @Column(name = "fluency_score")
  private Integer fluencyScore;

  @Column(name = "corrections", columnDefinition = "TEXT")
  private String corrections;

  @Column(name = "suggestions", columnDefinition = "TEXT")
  private String suggestions;

  // Reference to the message this is replying to (e.g., AI response replying to
  // user message)
  @Column(name = "reply_to_id")
  private String replyToId;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  // Pre-persist hook to ensure content field is populated
  @PrePersist
  @PreUpdate
  private void ensureContentField() {
    // If userMessage is set, use it for content
    if (userMessage != null && !userMessage.isBlank()) {
      this.content = userMessage;
    }
    // Otherwise if aiResponse is set, use it for content
    else if (aiResponse != null && !aiResponse.isBlank()) {
      this.content = aiResponse;
    }
    // Fallback to empty string
    else {
      this.content = "";
    }

    // Ensure sessionId is set based on userId
    if (sessionId == null || sessionId.isEmpty()) {
      if (userId != null) {
        this.sessionId = "session-" + userId;
      } else {
        this.sessionId = "session-" + java.util.UUID.randomUUID().toString();
      }
    }
  }
}