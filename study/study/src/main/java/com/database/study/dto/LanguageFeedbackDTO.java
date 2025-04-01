package com.database.study.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LanguageFeedbackDTO {
    private String id;
    private Integer pronunciation;
    private Integer grammar;
    private Integer vocabulary;
    private Integer fluency;
    private List<LanguageCorrectionDTO> corrections;
    private List<LanguageSuggestionDTO> suggestions;
    private LocalDateTime createdAt;
} 