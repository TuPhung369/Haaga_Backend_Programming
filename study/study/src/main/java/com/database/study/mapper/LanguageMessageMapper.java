package com.database.study.mapper;

import com.database.study.dto.LanguageMessageDTO;
import com.database.study.entity.LanguageMessage;
import com.database.study.enums.MessageType;
import org.springframework.stereotype.Component;

@Component
public class LanguageMessageMapper {

  /**
   * Convert entity to DTO
   * Sets the proper content fields based on message type
   */
  public LanguageMessageDTO toDTO(LanguageMessage entity) {
    if (entity == null) {
      return null;
    }

    LanguageMessageDTO dto = new LanguageMessageDTO();
    dto.setId(entity.getId());
    dto.setUserId(entity.getUserId());
    dto.setSessionId(entity.getSessionId());
    dto.setLanguage(entity.getLanguage());
    dto.setProficiencyLevel(entity.getProficiencyLevel());
    dto.setMessageType(entity.getMessageType());
    dto.setIsSessionMetadata(entity.getIsSessionMetadata());

    // Set the content field based on message type
    dto.setContent(entity.getContent());

    // Set the specific message field based on type
    if (entity.getMessageType() == MessageType.USER_MESSAGE) {
      dto.setUserMessage(entity.getContent());
    } else if (entity.getMessageType() == MessageType.AI_RESPONSE) {
      dto.setAiResponse(entity.getContent());
    }

    dto.setAudioUrl(entity.getAudioUrl());
    dto.setUserAudioUrl(entity.getUserAudioUrl());
    dto.setPronunciationScore(entity.getPronunciationScore());
    dto.setGrammarScore(entity.getGrammarScore());
    dto.setVocabularyScore(entity.getVocabularyScore());
    dto.setFluencyScore(entity.getFluencyScore());
    dto.setCorrections(entity.getCorrections());
    dto.setSuggestions(entity.getSuggestions());
    dto.setReplyToId(entity.getReplyToId());
    dto.setCreatedAt(entity.getCreatedAt());
    dto.setUpdatedAt(entity.getUpdatedAt());

    return dto;
  }

  /**
   * Convert DTO to entity
   * Properly sets content based on message type
   */
  public LanguageMessage toEntity(LanguageMessageDTO dto) {
    if (dto == null) {
      return null;
    }

    LanguageMessage entity = new LanguageMessage();
    entity.setId(dto.getId());
    entity.setUserId(dto.getUserId());
    entity.setSessionId(dto.getSessionId());
    entity.setLanguage(dto.getLanguage());
    entity.setProficiencyLevel(dto.getProficiencyLevel());
    entity.setMessageType(dto.getMessageType());
    entity.setIsSessionMetadata(dto.getIsSessionMetadata());

    // Determine which content to use based on message type
    if (dto.getMessageType() == MessageType.USER_MESSAGE && dto.getUserMessage() != null) {
      entity.setContent(dto.getUserMessage());
    } else if (dto.getMessageType() == MessageType.AI_RESPONSE && dto.getAiResponse() != null) {
      entity.setContent(dto.getAiResponse());
    } else {
      entity.setContent(dto.getContent());
    }

    entity.setAudioUrl(dto.getAudioUrl());
    entity.setUserAudioUrl(dto.getUserAudioUrl());
    entity.setPronunciationScore(dto.getPronunciationScore());
    entity.setGrammarScore(dto.getGrammarScore());
    entity.setVocabularyScore(dto.getVocabularyScore());
    entity.setFluencyScore(dto.getFluencyScore());
    entity.setCorrections(dto.getCorrections());
    entity.setSuggestions(dto.getSuggestions());
    entity.setReplyToId(dto.getReplyToId());

    return entity;
  }
}