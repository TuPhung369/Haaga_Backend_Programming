package com.database.study.entity;

import com.database.study.enums.MessageType;
import com.database.study.enums.ProficiencyLevel;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;

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

  @Column(name = "session_id", nullable = false)
  private String sessionId;

  @Column(name = "user_id", nullable = false)
  private String userId;

  @Column(name = "language", nullable = false)
  private String language;

  @Enumerated(EnumType.STRING)
  @Column(name = "proficiency_level")
  private ProficiencyLevel proficiencyLevel;

  @Enumerated(EnumType.STRING)
  @Column(name = "message_type", nullable = false)
  private MessageType messageType;

  @Column(name = "content", columnDefinition = "TEXT", nullable = false)
  private String content;

  @Column(name = "audio_url")
  private String audioUrl;

  @Column(name = "user_audio_url")
  private String userAudioUrl;

  // Session metadata fields (stored on the first message of a session)
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

  // Reference to the message this is replying to
  @Column(name = "reply_to_id")
  private String replyToId;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;
}