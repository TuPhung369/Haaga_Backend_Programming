package com.database.study.entity;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "language_corrections")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LanguageCorrection {

  @Id
  @UuidGenerator // Replaces @GeneratedValue and @GenericGenerator
  @Column(name = "id", columnDefinition = "VARCHAR(36)")
  private String id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "interaction_id", nullable = false)
  private LanguageInteraction interaction;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "feedback_id")
  private LanguageFeedback feedback;

  @Column(name = "original_text", columnDefinition = "TEXT", nullable = false)
  private String originalText;

  @Column(name = "corrected_text", columnDefinition = "TEXT", nullable = false)
  private String correctedText;

  @Column(name = "explanation", columnDefinition = "TEXT")
  private String explanation;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at")
  private LocalDateTime updatedAt;
}