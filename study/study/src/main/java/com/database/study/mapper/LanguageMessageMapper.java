package com.database.study.mapper;

import com.database.study.dto.LanguageMessageDTO;
import com.database.study.entity.LanguageMessage;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface LanguageMessageMapper {

  LanguageMessageMapper INSTANCE = Mappers.getMapper(LanguageMessageMapper.class);

  @Mapping(target = "id", source = "id")
  @Mapping(target = "userId", source = "userId")
  @Mapping(target = "language", source = "language")
  @Mapping(target = "proficiencyLevel", source = "proficiencyLevel")
  @Mapping(target = "messageType", source = "messageType")
  @Mapping(target = "userMessage", source = "userMessage")
  @Mapping(target = "aiResponse", source = "aiResponse")
  @Mapping(target = "audioUrl", source = "audioUrl")
  @Mapping(target = "userAudioUrl", source = "userAudioUrl")
  @Mapping(target = "isSessionMetadata", source = "isSessionMetadata")
  @Mapping(target = "pronunciationScore", source = "pronunciationScore")
  @Mapping(target = "grammarScore", source = "grammarScore")
  @Mapping(target = "vocabularyScore", source = "vocabularyScore")
  @Mapping(target = "fluencyScore", source = "fluencyScore")
  @Mapping(target = "corrections", source = "corrections")
  @Mapping(target = "suggestions", source = "suggestions")
  @Mapping(target = "replyToId", source = "replyToId")
  @Mapping(target = "createdAt", source = "createdAt")
  @Mapping(target = "updatedAt", source = "updatedAt")
  LanguageMessageDTO toDTO(LanguageMessage entity);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "userId", source = "userId")
  @Mapping(target = "language", source = "language")
  @Mapping(target = "proficiencyLevel", source = "proficiencyLevel")
  @Mapping(target = "messageType", source = "messageType")
  @Mapping(target = "userMessage", source = "userMessage")
  @Mapping(target = "aiResponse", source = "aiResponse")
  @Mapping(target = "audioUrl", source = "audioUrl")
  @Mapping(target = "userAudioUrl", source = "userAudioUrl")
  @Mapping(target = "isSessionMetadata", source = "isSessionMetadata")
  @Mapping(target = "pronunciationScore", source = "pronunciationScore")
  @Mapping(target = "grammarScore", source = "grammarScore")
  @Mapping(target = "vocabularyScore", source = "vocabularyScore")
  @Mapping(target = "fluencyScore", source = "fluencyScore")
  @Mapping(target = "corrections", source = "corrections")
  @Mapping(target = "suggestions", source = "suggestions")
  @Mapping(target = "replyToId", source = "replyToId")
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  LanguageMessage toEntity(LanguageMessageDTO dto);
}