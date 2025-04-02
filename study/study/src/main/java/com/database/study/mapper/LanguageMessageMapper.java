package com.database.study.mapper;

import com.database.study.dto.LanguageMessageDTO;
import com.database.study.entity.LanguageMessage;
import org.springframework.stereotype.Component;

@Component
public class LanguageMessageMapper {

  /**
   * Convert entity to DTO
   */
  public LanguageMessageDTO toDTO(LanguageMessage entity) {
    if (entity == null) {
      return null;
    }

    return LanguageMessageDTO.builder()
        .id(entity.getId())
        .sessionId(entity.getSessionId())
        .userId(entity.getUserId())
        .language(entity.getLanguage())
        .proficiencyLevel(entity.getProficiencyLevel())
        .messageType(entity.getMessageType())
        .content(entity.getContent())
        .audioUrl(entity.getAudioUrl())
        .isSessionMetadata(entity.getIsSessionMetadata())
        .pronunciationScore(entity.getPronunciationScore())
        .grammarScore(entity.getGrammarScore())
        .vocabularyScore(entity.getVocabularyScore())
        .fluencyScore(entity.getFluencyScore())
        .corrections(entity.getCorrections())
        .suggestions(entity.getSuggestions())
        .replyToId(entity.getReplyToId())
        .createdAt(entity.getCreatedAt())
        .updatedAt(entity.getUpdatedAt())
        .build();
  }

  /**
   * Convert DTO to entity
   */
  public LanguageMessage toEntity(LanguageMessageDTO dto) {
    if (dto == null) {
      return null;
    }

    return LanguageMessage.builder()
        .id(dto.getId())
        .sessionId(dto.getSessionId())
        .userId(dto.getUserId())
        .language(dto.getLanguage())
        .proficiencyLevel(dto.getProficiencyLevel())
        .messageType(dto.getMessageType())
        .content(dto.getContent())
        .audioUrl(dto.getAudioUrl())
        .isSessionMetadata(dto.getIsSessionMetadata())
        .pronunciationScore(dto.getPronunciationScore())
        .grammarScore(dto.getGrammarScore())
        .vocabularyScore(dto.getVocabularyScore())
        .fluencyScore(dto.getFluencyScore())
        .corrections(dto.getCorrections())
        .suggestions(dto.getSuggestions())
        .replyToId(dto.getReplyToId())
        // Don't set createdAt and updatedAt from DTO - let the database handle these
        .build();
  }
}