package com.database.study.service.impl;

import com.database.study.dto.LanguageMessageDTO;
import com.database.study.dto.request.CreateLanguageSessionRequest;
import com.database.study.dto.request.SaveLanguageInteractionRequest;
import com.database.study.entity.LanguageMessage;
import com.database.study.enums.MessageType;
import com.database.study.enums.ProficiencyLevel;
import com.database.study.exception.EntityNotFoundException;
import com.database.study.mapper.LanguageMessageMapper;
import com.database.study.repository.LanguageMessageRepository;
import com.database.study.service.LanguageAIService;
import com.database.study.service.RecaptchaService;
import com.database.study.validator.AuthValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

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
      return messageMapper.toDTO(existingMetadata.get());
    } else {
      log.info("Creating new session metadata for user: {}, language: {}", request.getUserId(), request.getLanguage());
      // Use the provided proficiency level or default to BEGINNER
      ProficiencyLevel proficiencyLevel = Optional.ofNullable(request.getProficiencyLevel())
          .orElse(ProficiencyLevel.BEGINNER);

      // Create the metadata message
      LanguageMessage sessionMessage = LanguageMessage.builder()
          .userId(request.getUserId())
          .language(request.getLanguage())
          .proficiencyLevel(proficiencyLevel)
          .messageType(MessageType.SYSTEM_MESSAGE) // Mark as system message
          .isSessionMetadata(true)
          .build();

      LanguageMessage savedMessage = messageRepository.save(sessionMessage);
      log.info("Saved new session metadata with ID: {}", savedMessage.getId());
      return messageMapper.toDTO(savedMessage);
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

  @Transactional
  @Override
  public LanguageMessageDTO saveInteraction(SaveLanguageInteractionRequest request) {
    log.info("Saving interaction for user: {}, language: {}", request.getUserId(), request.getLanguage());
    log.info("User message length: {}, AI response length: {}",
        request.getUserMessage() != null ? request.getUserMessage().length() : 0,
        request.getAiResponse() != null ? request.getAiResponse().length() : 0);

    // Validate recaptcha
    recaptchaService.validateRecaptchaToken(request.getRecaptchaToken());

    // Validate user access
    authValidator.validateUserAccess(request.getUserId());

    // Try to find existing session metadata
    Optional<LanguageMessage> metadataOpt = messageRepository
        .findByUserIdAndLanguageAndIsSessionMetadataTrue(request.getUserId(), request.getLanguage());

    LanguageMessage sessionMetadata;
    if (metadataOpt.isPresent()) {
      sessionMetadata = metadataOpt.get();
      log.info("Found existing session metadata ID: {}", sessionMetadata.getId());
    } else {
      // Metadata not found, attempt to create it automatically
      log.warn("Session metadata not found for user {} and language {}. Attempting to auto-create.",
          request.getUserId(), request.getLanguage());
      try {
        // Call ensureSessionMetadata to create it (it handles its own validation)
        LanguageMessageDTO createdMetadataDTO = ensureSessionMetadata(CreateLanguageSessionRequest.builder()
            .userId(request.getUserId())
            .language(request.getLanguage())
            .proficiencyLevel(request.getProficiencyLevel()) // Pass proficiency if available
            .recaptchaToken(request.getRecaptchaToken()) // Pass token
            .build());
        log.info("Successfully auto-created session metadata with ID: {}", createdMetadataDTO.getId());
        // Now, fetch the newly created entity
        sessionMetadata = messageRepository.findById(createdMetadataDTO.getId())
            .orElseThrow(() -> new IllegalStateException(
                "Could not find session metadata immediately after creation: " + createdMetadataDTO.getId()));
      } catch (Exception creationEx) {
        log.error("Failed to auto-create session metadata for user {} and language {}: {}",
            request.getUserId(), request.getLanguage(), creationEx.getMessage());
        // If creation fails, we cannot proceed with saving the interaction
        throw new EntityNotFoundException("Session metadata",
            "user: " + request.getUserId() + ", lang: " + request.getLanguage()
                + " (required but not found, auto-creation failed)");
      }
    }

    // --- Proceed with saving interaction messages using the obtained
    // sessionMetadata ---

    log.info("Using session metadata ID: {}", sessionMetadata.getId());

    // Create and save user message entity
    log.info("Creating user message entity");
    LanguageMessage userMessage = LanguageMessage.builder()
        .userId(request.getUserId())
        .language(request.getLanguage())
        .proficiencyLevel(request.getProficiencyLevel() != null ? request.getProficiencyLevel()
            : sessionMetadata.getProficiencyLevel()) // Use request level or metadata level
        .messageType(MessageType.USER_MESSAGE)
        .userMessage(request.getUserMessage()) // Store user message here
        .userAudioUrl(request.getUserAudioUrl())
        .isSessionMetadata(false)
        .build();

    log.info("Saving user message to database");
    LanguageMessage savedUserMessage = messageRepository.save(userMessage);
    log.info("User message saved successfully with ID: {}", savedUserMessage.getId());

    // Create and save AI response entity
    log.info("Creating AI response entity");
    LanguageMessage aiResponse = LanguageMessage.builder()
        .userId(request.getUserId())
        .language(request.getLanguage())
        .proficiencyLevel(request.getProficiencyLevel() != null ? request.getProficiencyLevel()
            : sessionMetadata.getProficiencyLevel()) // Use request level or metadata level
        .messageType(MessageType.AI_RESPONSE)
        .aiResponse(request.getAiResponse()) // Store AI response here
        .audioUrl(request.getAudioUrl())
        .isSessionMetadata(false)
        .replyToId(savedUserMessage.getId()) // Link AI response to the user message
        .build();
    log.debug("AI response entity built successfully");

    // Save AI response
    log.info("Saving AI response to database");
    LanguageMessage savedAiResponse = messageRepository.save(aiResponse);
    log.info("AI response saved successfully with ID: {}", savedAiResponse.getId());

    // Verification step
    boolean exists = messageRepository.existsById(savedAiResponse.getId());
    log.info("Verification - AI response exists in database: {}", exists);

    // Return the DTO of the saved AI response, as it concludes the interaction turn
    LanguageMessageDTO dto = messageMapper.toDTO(savedAiResponse);
    log.info("Interaction successfully processed, returning AI response DTO with ID: {}", dto.getId());
    return dto;
  }
}