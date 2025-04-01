package com.database.study.entity;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "language_suggestions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LanguageSuggestion {

  @Id
  @GeneratedValue(generator = "uuid")
  @GenericGenerator(name = "uuid", strategy = "uuid2")
  @Column(name = "id", columnDefinition = "VARCHAR(36)")
  private String id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "interaction_id", nullable = false)
  private LanguageInteraction interaction;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "feedback_id")
  private LanguageFeedback feedback;

  @Column(name = "suggestion", columnDefinition = "TEXT", nullable = false)
  private String suggestion;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at")
  private LocalDateTime updatedAt;
}