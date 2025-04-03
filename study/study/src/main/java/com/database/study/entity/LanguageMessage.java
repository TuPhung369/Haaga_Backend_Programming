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

  // We use content field as the main storage for messages
  @Column(name = "content", columnDefinition = "TEXT")
  private String content;

  // We keep these fields as transient (not stored in DB)
  // They're used as convenient accessors in the code
  @Transient
  private String userMessage;

  @Transient
  private String aiResponse;

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

  // Getter for userMessage (mapped to content for USER_MESSAGE types)
  public String getUserMessage() {
    if (messageType == MessageType.USER_MESSAGE) {
      return content;
    }
    return null;
  }

  // Setter for userMessage (sets content for USER_MESSAGE types)
  public void setUserMessage(String userMessage) {
    if (messageType == MessageType.USER_MESSAGE) {
      this.content = userMessage;
    }
    // For other message types, we ignore this setter
  }

  // Getter for aiResponse (mapped to content for AI_RESPONSE types)
  public String getAiResponse() {
    if (messageType == MessageType.AI_RESPONSE) {
      return content;
    }
    return null;
  }

  // Setter for aiResponse (sets content for AI_RESPONSE types)
  public void setAiResponse(String aiResponse) {
    if (messageType == MessageType.AI_RESPONSE) {
      this.content = aiResponse;
    }
    // For other message types, we ignore this setter
  }

  // Pre-persist hook to ensure required fields are set
  @PrePersist
  @PreUpdate
  private void ensureRequiredFields() {
    // Ensure sessionId is set based on userId
    if (sessionId == null || sessionId.isEmpty()) {
      if (userId != null) {
        this.sessionId = "session-" + userId;
      } else {
        this.sessionId = "session-" + UUID.randomUUID().toString();
      }
    }

    // Ensure proficiencyLevel has a default if not set
    if (proficiencyLevel == null) {
      this.proficiencyLevel = ProficiencyLevel.INTERMEDIATE;
    }

    // Ensure content is not null
    if (content == null) {
      this.content = "";
    }
  }
}