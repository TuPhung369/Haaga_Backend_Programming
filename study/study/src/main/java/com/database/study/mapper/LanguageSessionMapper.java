package com.database.study.mapper;

import com.database.study.dto.LanguageSessionDTO;
import com.database.study.entity.LanguageSession;
import org.springframework.stereotype.Component;

@Component
public class LanguageSessionMapper {

    public LanguageSessionDTO toDTO(LanguageSession entity) {
        if (entity == null) {
            return null;
        }
        
        return LanguageSessionDTO.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .language(entity.getLanguage())
                .proficiencyLevel(entity.getProficiencyLevel())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .interactionCount(entity.getInteractions() != null ? entity.getInteractions().size() : 0)
                .build();
    }

    public LanguageSession toEntity(LanguageSessionDTO dto) {
        if (dto == null) {
            return null;
        }
        
        return LanguageSession.builder()
                .id(dto.getId())
                .userId(dto.getUserId())
                .language(dto.getLanguage())
                .proficiencyLevel(dto.getProficiencyLevel())
                .build();
    }
} 