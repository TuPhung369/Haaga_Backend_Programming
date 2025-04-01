package com.database.study.mapper;

import com.database.study.dto.LanguageInteractionDTO;
import com.database.study.entity.LanguageInteraction;
import org.springframework.stereotype.Component;

@Component
public class LanguageInteractionMapper {

  public LanguageInteractionDTO toDTO(LanguageInteraction entity) {
    if (entity == null) {
      return null;
    }

    return LanguageInteractionDTO.builder()
        .id(entity.getId())
        .sessionId(entity.getSession().getId())
        .userMessage(entity.getUserMessage())
        .aiResponse(entity.getAiResponse())
        .audioUrl(entity.getAudioUrl())
        .userAudioUrl(entity.getUserAudioUrl())
        .createdAt(entity.getCreatedAt())
        .build();
  }

  public LanguageInteraction toEntity(LanguageInteractionDTO dto) {
    if (dto == null) {
      return null;
    }

    // Note: This is a simplified conversion - in a real implementation,
    // you would need to handle the session relationship
    return LanguageInteraction.builder()
        .id(dto.getId())
        .userMessage(dto.getUserMessage())
        .aiResponse(dto.getAiResponse())
        .audioUrl(dto.getAudioUrl())
        .userAudioUrl(dto.getUserAudioUrl())
        .build();
  }
}