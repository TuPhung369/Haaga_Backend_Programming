package com.database.study.service.impl;

import com.database.study.dto.LanguageMessageDTO;
import com.database.study.dto.request.CreateLanguageSessionRequest;
import com.database.study.dto.request.SaveLanguageInteractionRequest;
import com.database.study.entity.LanguageMessage;
import com.database.study.enums.MessageType;
import com.database.study.enums.ProficiencyLevel;
import com.database.study.mapper.LanguageMessageMapper;
import com.database.study.repository.LanguageMessageRepository;
import com.database.study.service.LanguageAIService;
import com.database.study.service.RecaptchaService;
import com.database.study.validator.AuthValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LanguageAIServiceImpl implements LanguageAIService {

  private final LanguageMessageRepository messageRepository;
  private final LanguageMessageMapper messageMapper;
  private final AuthValidator authValidator;
  private final RecaptchaService recaptchaService;

  @Transactional
  @Override
  public LanguageMessageDTO ensureSessionMetadata(CreateLanguageSessionRequest request) {
    log.info("Ensuring session metadata exists for user: {}, language: {}", request.getUserId(), request.getLanguage());
    // Validate recaptcha
    recaptchaService.validateRecaptchaToken(request.getRecaptchaToken());

    // Validate user access
    authValidator.validateUserAccess(request.getUserId());

    // Check if metadata already exists for this user and language
    Optional<LanguageMessage> existingMetadata = messageRepository.findByUserIdAndLanguageAndIsSessionMetadataTrue(
        request.getUserId(), request.getLanguage());

    if (existingMetadata.isPresent()) {
      log.info("Session metadata already exists for user: {}, language: {}", request.getUserId(),
          request.getLanguage());

      // Check if proficiency level needs to be updated
      LanguageMessage metadata = existingMetadata.get();
      if (request.getProficiencyLevel() != null && metadata.getProficiencyLevel() != request.getProficiencyLevel()) {
        log.info("Updating proficiency level from {} to {}", metadata.getProficiencyLevel(),
            request.getProficiencyLevel());
        metadata.setProficiencyLevel(request.getProficiencyLevel());
        metadata = messageRepository.save(metadata);
      }

      return messageMapper.toDTO(metadata);
    } else {
      log.info("Creating new session metadata (in memory only, not stored) for user: {}, language: {}",
          request.getUserId(), request.getLanguage());

      // Use the provided proficiency level or default to INTERMEDIATE
      ProficiencyLevel proficiencyLevel = Optional.ofNullable(request.getProficiencyLevel())
          .orElse(ProficiencyLevel.INTERMEDIATE);

      // Create the metadata message but don't save it to the database
      // We'll just return a DTO with the necessary information
      LanguageMessage sessionMessage = LanguageMessage.builder()
          .userId(request.getUserId())
          .language(request.getLanguage())
          .proficiencyLevel(proficiencyLevel)
          .messageType(MessageType.SYSTEM_MESSAGE)
          .isSessionMetadata(true)
          .build();

      // Generate an ID for this virtual metadata
      String virtualId = java.util.UUID.randomUUID().toString();
      sessionMessage.setId(virtualId);

      log.info("Created virtual session metadata with ID: {}", virtualId);
      return messageMapper.toDTO(sessionMessage);
    }
  }

  @Override
  @Transactional(readOnly = true)
  public Page<LanguageMessageDTO> getUserConversationHistory(String userId, String language, Pageable pageable) {
    log.info("Getting conversation history for user: {}, language: {}", userId, language);
    // Validate user access
    authValidator.validateUserAccess(userId);

    // Find all messages for this user and language, excluding the metadata message
    // itself
    // We might need a specific repository method for this later if performance is
    // an issue
    Page<LanguageMessage> messages = messageRepository.findByUserIdOrderByCreatedAtAsc(userId, pageable);
    // it.
    // For now, returning all messages for the user ordered by time.
    log.info("Found {} messages for user {}", messages.getTotalElements(), userId);
    return messages.map(messageMapper::toDTO);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<LanguageMessageDTO> getUserLanguages(String userId, Pageable pageable) {
    log.info("Getting distinct languages for user: {}", userId);
    authValidator.validateUserAccess(userId);
    // Find all metadata messages for the user, effectively listing their
    // 'sessions'/languages
    Page<LanguageMessage> metadataMessages = messageRepository
        .findByUserIdAndIsSessionMetadataTrueOrderByCreatedAtDesc(userId, pageable);
    log.info("Found {} distinct language sessions for user {}", metadataMessages.getTotalElements(), userId);
    return metadataMessages.map(messageMapper::toDTO);
  }

  @Override
  @Transactional(readOnly = true)
  public List<LanguageMessageDTO> getUserMessageSessions(String userId, int limit) {
    log.info("Getting message sessions for user: {}, limit: {}", userId, limit);
    // Validate user access
    authValidator.validateUserAccess(userId);

    // Create pageable request with the limit
    Pageable pageable = PageRequest.of(0, limit);

    // Get user-AI conversation pairs
    Page<LanguageMessage> messages = messageRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    log.info("Found {} messages for user {}", messages.getTotalElements(), userId);

    // Convert to DTOs
    List<LanguageMessageDTO> messageDTOs = messages.getContent().stream()
        .map(messageMapper::toDTO)
        .collect(Collectors.toList());

    return messageDTOs;
  }

  @Transactional
  @Override
  public LanguageMessageDTO saveInteraction(SaveLanguageInteractionRequest request) {
    log.info("Saving interaction for user: {}, language: {}, proficiency: {}",
        request.getUserId(), request.getLanguage(), request.getProficiencyLevel());
    log.info("User message length: {}, AI response length: {}",
        request.getUserMessage() != null ? request.getUserMessage().length() : 0,
        request.getAiResponse() != null ? request.getAiResponse().length() : 0);

    // Validate recaptcha
    recaptchaService.validateRecaptchaToken(request.getRecaptchaToken());

    // Validate user access
    authValidator.validateUserAccess(request.getUserId());

    // The proficiency level to use throughout this interaction
    ProficiencyLevel proficiencyLevel = request.getProficiencyLevel();
    if (proficiencyLevel == null) {
      proficiencyLevel = ProficiencyLevel.INTERMEDIATE; // Default to INTERMEDIATE if not specified
      log.info("No proficiency level specified, defaulting to: {}", proficiencyLevel);
    }

    // We don't need to create metadata entry anymore - optimizing storage
    log.info("Proceeding without explicit metadata storage");

    // Create and save user message entity
    log.info("Creating user message entity");
    LanguageMessage userMessage = LanguageMessage.builder()
        .userId(request.getUserId())
        .language(request.getLanguage())
        .proficiencyLevel(proficiencyLevel)
        .messageType(MessageType.USER_MESSAGE)
        .content(request.getUserMessage()) // Store directly in content field
        .userAudioUrl(request.getUserAudioUrl())
        .isSessionMetadata(false)
        .build();

    log.info("Saving user message to database");
    LanguageMessage savedUserMessage = messageRepository.save(userMessage);
    log.info("User message saved successfully with ID: {}", savedUserMessage.getId());
    log.debug("User message content: {}", savedUserMessage.getContent());

    // Create and save AI response entity
    log.info("Creating AI response entity");
    LanguageMessage aiResponse = LanguageMessage.builder()
        .userId(request.getUserId())
        .language(request.getLanguage())
        .proficiencyLevel(proficiencyLevel)
        .messageType(MessageType.AI_RESPONSE)
        .content(request.getAiResponse()) // Store directly in content field
        .audioUrl(request.getAudioUrl())
        .isSessionMetadata(false)
        .replyToId(savedUserMessage.getId()) // Link AI response to the user message
        .build();
    log.debug("AI response entity built successfully");

    // Save AI response
    log.info("Saving AI response to database");
    LanguageMessage savedAiResponse = messageRepository.save(aiResponse);
    log.info("AI response saved successfully with ID: {}", savedAiResponse.getId());
    log.debug("AI response content: {}", savedAiResponse.getContent());

    // Return the DTO of the saved AI response, as it concludes the interaction turn
    LanguageMessageDTO dto = messageMapper.toDTO(savedAiResponse);
    log.info("Interaction successfully processed, returning AI response DTO with ID: {}", dto.getId());
    return dto;
  }
}