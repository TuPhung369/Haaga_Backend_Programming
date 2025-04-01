package com.database.study.entity;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator; // Updated import
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "language_interactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LanguageInteraction {

  @Id
  @UuidGenerator // Replaces @GeneratedValue and @GenericGenerator
  @Column(name = "id", columnDefinition = "VARCHAR(36)")
  private String id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "session_id", nullable = false)
  private LanguageSession session;

  @Column(name = "user_message", columnDefinition = "TEXT", nullable = false)
  private String userMessage;

  @Column(name = "ai_response", columnDefinition = "TEXT", nullable = false)
  private String aiResponse;

  @Column(name = "audio_url")
  private String audioUrl;

  @Column(name = "user_audio_url")
  private String userAudioUrl;

  @OneToMany(mappedBy = "interaction", cascade = CascadeType.ALL, orphanRemoval = true)
  @Builder.Default
  private List<LanguageCorrection> corrections = new ArrayList<>();

  @OneToMany(mappedBy = "interaction", cascade = CascadeType.ALL, orphanRemoval = true)
  @Builder.Default
  private List<LanguageSuggestion> suggestions = new ArrayList<>();

  @OneToOne(mappedBy = "interaction", cascade = CascadeType.ALL, orphanRemoval = true)
  private LanguageFeedback feedback;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at")
  private LocalDateTime updatedAt;
}