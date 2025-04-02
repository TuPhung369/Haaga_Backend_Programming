package com.database.study.service.impl;

import com.database.study.dto.LanguageMessageDTO;
import com.database.study.dto.request.CreateSessionRequest;
import com.database.study.dto.request.SaveMessageRequest;
import com.database.study.entity.LanguageMessage;
import com.database.study.enums.MessageType;
import com.database.study.enums.ProficiencyLevel;
import com.database.study.exception.EntityNotFoundException;
import com.database.study.mapper.LanguageMessageMapper;
import com.database.study.repository.LanguageMessageRepository;
import com.database.study.service.LanguageMessageService;
import com.database.study.service.RecaptchaService;
import com.database.study.validator.AuthValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LanguageMessageServiceImpl implements LanguageMessageService {

  private final LanguageMessageRepository messageRepository;
  private final LanguageMessageMapper messageMapper;
  private final AuthValidator authValidator;
  private final RecaptchaService recaptchaService;

  @Value("${ai.api.url:http://localhost:8000/api}")
  private String aiApiUrl;

  @Value("${ai.api.key:test-api-key}")
  private String aiApiKey;

  @Transactional
  @Override
  public LanguageMessageDTO createSession(CreateSessionRequest request) {
    // Validate recaptcha
    log.info("Creating new language session for user {} with language {}", request.getUserId(), request.getLanguage());
    recaptchaService.validateRecaptchaToken(request.getRecaptchaToken());

    // Validate user access
    authValidator.validateUserAccess(request.getUserId());

    // Use the provided proficiency level or default to BEGINNER
    ProficiencyLevel proficiencyLevel = Optional.ofNullable(request.getProficiencyLevel())
        .orElse(ProficiencyLevel.BEGINNER);

    // Generate session ID
    String sessionId = UUID.randomUUID().toString();
    log.info("Generated session ID: {}", sessionId);

    // Create session metadata message
    LanguageMessage sessionMessage = LanguageMessage.builder()
        .sessionId(sessionId)
        .userId(request.getUserId())
        .language(request.getLanguage())
        .proficiencyLevel(proficiencyLevel)
        .messageType(MessageType.SYSTEM_MESSAGE)
        .content("Session created")
        .isSessionMetadata(true)
        .build();

    LanguageMessage savedMessage = messageRepository.save(sessionMessage);
    log.info("Session created successfully with ID: {}", sessionId);

    return messageMapper.toDTO(savedMessage);
  }

  @Override
  @Transactional(readOnly = true)
  public List<String> getUserSessions(String userId) {
    // Validate user access
    authValidator.validateUserAccess(userId);

    // Use a simplified approach to get unique session IDs
    return messageRepository.findDistinctSessionIdsByUserId(userId);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<LanguageMessageDTO> getSessionMessages(String sessionId, Pageable pageable) {
    // Handle session ID format - strip "session-" prefix if present
    final String adjustedSessionId;
    if (sessionId != null && sessionId.startsWith("session-")) {
      adjustedSessionId = sessionId.substring("session-".length());
      log.info("Adjusted sessionId from {} to {}", sessionId, adjustedSessionId);
    } else {
      adjustedSessionId = sessionId;
    }

    // Verify the session exists
    if (!messageRepository.existsBySessionId(adjustedSessionId)) {
      throw new EntityNotFoundException("Session", adjustedSessionId);
    }

    // Get session metadata to validate user access
    LanguageMessage metadata = messageRepository.findBySessionIdAndIsSessionMetadataTrue(adjustedSessionId)
        .orElseThrow(() -> new EntityNotFoundException("Session metadata", adjustedSessionId));

    // Validate user access
    authValidator.validateUserAccess(metadata.getUserId());

    // Get messages for the session
    Page<LanguageMessage> messages = messageRepository.findBySessionIdOrderByCreatedAtAsc(adjustedSessionId, pageable);
    return messages.map(messageMapper::toDTO);
  }

  @Transactional
  @Override
  public LanguageMessageDTO saveUserMessage(SaveMessageRequest request) {
    log.info("Saving user message for session {}", request.getSessionId());

    // Handle session ID format - strip "session-" prefix if present
    final String adjustedSessionId;
    if (request.getSessionId() != null && request.getSessionId().startsWith("session-")) {
      adjustedSessionId = request.getSessionId().substring("session-".length());
      log.info("Adjusted sessionId from {} to {}", request.getSessionId(), adjustedSessionId);
    } else {
      adjustedSessionId = request.getSessionId();
    }

    // Validate recaptcha
    recaptchaService.validateRecaptchaToken(request.getRecaptchaToken());

    // Verify the session exists
    if (!messageRepository.existsBySessionId(adjustedSessionId)) {
      throw new EntityNotFoundException("Session", adjustedSessionId);
    }

    // Get session metadata
    LanguageMessage metadata = messageRepository.findBySessionIdAndIsSessionMetadataTrue(adjustedSessionId)
        .orElseThrow(() -> new EntityNotFoundException("Session metadata", adjustedSessionId));

    // Validate user access
    authValidator.validateUserAccess(metadata.getUserId());

    if (!metadata.getUserId().equals(request.getUserId())) {
      log.error("User {} attempted to access session belonging to {}", request.getUserId(), metadata.getUserId());
      throw new EntityNotFoundException("Session", adjustedSessionId);
    }

    // Save user message
    LanguageMessage userMessage = LanguageMessage.builder()
        .sessionId(adjustedSessionId)
        .userId(request.getUserId())
        .language(metadata.getLanguage())
        .proficiencyLevel(metadata.getProficiencyLevel())
        .messageType(MessageType.USER_MESSAGE)
        .content(request.getContent())
        .audioUrl(request.getAudioUrl())
        .isSessionMetadata(false)
        .build();

    LanguageMessage savedUserMessage = messageRepository.save(userMessage);
    log.info("User message saved with ID: {}", savedUserMessage.getId());

    // Generate AI response
    String aiResponseContent = generateAIResponse(
        request.getContent(),
        metadata.getLanguage(),
        metadata.getProficiencyLevel());

    // Save AI response
    LanguageMessage aiResponse = LanguageMessage.builder()
        .sessionId(adjustedSessionId)
        .userId(metadata.getUserId())
        .language(metadata.getLanguage())
        .proficiencyLevel(metadata.getProficiencyLevel())
        .messageType(MessageType.AI_RESPONSE)
        .content(aiResponseContent)
        .isSessionMetadata(false)
        .replyToId(savedUserMessage.getId())
        .build();

    LanguageMessage savedAiResponse = messageRepository.save(aiResponse);
    log.info("AI response saved with ID: {}", savedAiResponse.getId());

    // Return the user message DTO
    return messageMapper.toDTO(savedUserMessage);
  }

  @Override
  public boolean sessionExists(String sessionId) {
    // Handle session ID format - strip "session-" prefix if present
    final String adjustedSessionId;
    if (sessionId != null && sessionId.startsWith("session-")) {
      adjustedSessionId = sessionId.substring("session-".length());
      log.info("Adjusted sessionId from {} to {}", sessionId, adjustedSessionId);
    } else {
      adjustedSessionId = sessionId;
    }

    return messageRepository.existsBySessionId(adjustedSessionId);
  }

  @Override
  public LanguageMessageDTO getSessionMetadata(String sessionId) {
    // Handle session ID format - strip "session-" prefix if present
    final String adjustedSessionId;
    if (sessionId != null && sessionId.startsWith("session-")) {
      adjustedSessionId = sessionId.substring("session-".length());
      log.info("Adjusted sessionId from {} to {}", sessionId, adjustedSessionId);
    } else {
      adjustedSessionId = sessionId;
    }

    LanguageMessage metadata = messageRepository.findBySessionIdAndIsSessionMetadataTrue(adjustedSessionId)
        .orElseThrow(() -> new EntityNotFoundException("Session metadata", adjustedSessionId));

    return messageMapper.toDTO(metadata);
  }

  @Override
  public LanguageMessageDTO saveSessionMetadata(LanguageMessage sessionMessage) {
    log.info("Saving session metadata for session ID: {}", sessionMessage.getSessionId());

    // Validate that it's a metadata message
    if (!Boolean.TRUE.equals(sessionMessage.getIsSessionMetadata())) {
      sessionMessage.setIsSessionMetadata(true);
      log.info("Forcing isSessionMetadata to true");
    }

    // Ensure it has the correct message type
    if (sessionMessage.getMessageType() == null) {
      sessionMessage.setMessageType(MessageType.SYSTEM_MESSAGE);
      log.info("Setting message type to SYSTEM_MESSAGE");
    }

    // Save the message
    LanguageMessage savedMessage = messageRepository.save(sessionMessage);
    log.info("Session metadata saved successfully with ID: {}", savedMessage.getId());

    return messageMapper.toDTO(savedMessage);
  }

  /**
   * Generate an AI response based on user's message and proficiency
   */
  private String generateAIResponse(String userMessage, String language, ProficiencyLevel proficiencyLevel) {
    try {
      RestTemplate restTemplate = new RestTemplate();
      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);
      headers.set("X-API-KEY", aiApiKey);

      Map<String, Object> requestBody = new HashMap<>();
      requestBody.put("message", userMessage);
      requestBody.put("language", language);
      requestBody.put("proficiencyLevel", proficiencyLevel.toString());

      HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

      try {
        // Try to call the AI API service if available
        ResponseEntity<String> response = restTemplate.postForEntity(
            aiApiUrl + "/generate-response",
            entity,
            String.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
          return response.getBody();
        }
      } catch (Exception e) {
        log.warn("Failed to call AI API service, falling back to mock response: {}", e.getMessage());
      }

      // Fallback to mock response if API call fails
      return generateMockResponse(userMessage, proficiencyLevel);
    } catch (Exception e) {
      log.error("Error generating AI response", e);
      return "I'm sorry, I couldn't process your message. Please try again.";
    }
  }

  /**
   * Generate a mock response for development/testing purposes
   */
  private String generateMockResponse(String userMessage, ProficiencyLevel proficiencyLevel) {
    // Simplified mock response generation based on proficiency level
    String response;

    switch (proficiencyLevel) {
      case BEGINNER:
        response = "That's a good start! Here's a simpler way to say it: \""
            + simplifyMessage(userMessage) + "\"";
        break;
      case INTERMEDIATE:
        response = "Well done! Your sentence structure is good. Consider using more varied vocabulary, like: \""
            + improveVocabulary(userMessage) + "\"";
        break;
      case ADVANCED:
        response = "Excellent! Your language is quite good. To sound more natural, try: \""
            + makeMoreNatural(userMessage) + "\"";
        break;
      case NATIVE:
        response = "Impressive! Your language skills are excellent. For even more nuance, consider: \""
            + addNuance(userMessage) + "\"";
        break;
      default:
        response = "I understood your message. Can you tell me more?";
    }

    return response;
  }

  private String simplifyMessage(String message) {
    // Mock implementation - just return slightly modified message
    return message.replaceAll("\\b(difficult|complex|challenging)\\b", "hard")
        .replaceAll("\\b(purchase|acquire)\\b", "buy")
        .replaceAll("\\b(inquire|investigate)\\b", "ask");
  }

  private String improveVocabulary(String message) {
    // Mock implementation - replace simple words with more complex ones
    return message.replaceAll("\\b(good)\\b", "excellent")
        .replaceAll("\\b(bad)\\b", "inadequate")
        .replaceAll("\\b(big)\\b", "substantial");
  }

  private String makeMoreNatural(String message) {
    // Mock implementation - add conversational elements
    if (message.length() > 10) {
      return "Actually, " + message + ", you know?";
    }
    return "Well, " + message + ", if you ask me.";
  }

  private String addNuance(String message) {
    // Mock implementation - add more sophisticated phrasing
    return "I appreciate your perspective that " + message + ". One might also consider...";
  }
}