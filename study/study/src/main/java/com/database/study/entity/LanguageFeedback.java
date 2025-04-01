package com.database.study.entity;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator; // Updated import

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "language_feedback")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LanguageFeedback {

    @Id
    @UuidGenerator // Replaces @GeneratedValue and @GenericGenerator
    @Column(name = "id", columnDefinition = "VARCHAR(36)")
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interaction_id", nullable = false)
    private LanguageInteraction interaction;

    @Column(name = "pronunciation")
    private Integer pronunciation;

    @Column(name = "grammar")
    private Integer grammar;

    @Column(name = "vocabulary")
    private Integer vocabulary;

    @Column(name = "fluency")
    private Integer fluency;

    @OneToMany(mappedBy = "feedback", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LanguageCorrection> corrections = new ArrayList<>();

    @OneToMany(mappedBy = "feedback", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LanguageSuggestion> suggestions = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}