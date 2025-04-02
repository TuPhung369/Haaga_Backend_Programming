package com.database.study.service.impl;

import com.database.study.dto.LanguageMessageDTO;
import com.database.study.dto.request.CreateLanguageSessionRequest;
import com.database.study.dto.request.ProcessAudioRequest;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LanguageAIServiceImpl implements LanguageAIService {

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
  public LanguageMessageDTO createSession(CreateLanguageSessionRequest request) {
    // Validate recaptcha
    recaptchaService.validateRecaptchaToken(request.getRecaptchaToken());

    // Validate user access
    authValidator.validateUserAccess(request.getUserId());

    // Use the provided proficiency level or default to BEGINNER
    ProficiencyLevel proficiencyLevel = Optional.ofNullable(request.getProficiencyLevel())
        .orElse(ProficiencyLevel.BEGINNER);

    // Generate a new session ID
    String sessionId = UUID.randomUUID().toString();

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
    return messageMapper.toDTO(savedMessage);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<LanguageMessageDTO> getUserSessions(String userId, Pageable pageable) {
    // Validate user access
    authValidator.validateUserAccess(userId);

    // Find message entries that represent session metadata
    Page<LanguageMessage> sessionMessages = messageRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    return sessionMessages.map(messageMapper::toDTO);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<LanguageMessageDTO> getUserSessionsByLanguage(String userId, String language, Pageable pageable) {
    // Validate user access
    authValidator.validateUserAccess(userId);

    Page<LanguageMessage> sessionMessages = messageRepository.findByUserIdAndLanguageOrderByCreatedAtDesc(userId,
        language, pageable);
    return sessionMessages.map(messageMapper::toDTO);
  }

  @Transactional
  @Override
  public LanguageMessageDTO saveInteraction(SaveLanguageInteractionRequest request) {
    log.info("Starting to save interaction for session ID: {}", request.getSessionId());
    log.info("User message: {}, AI response length: {}",
        request.getUserMessage().substring(0, Math.min(50, request.getUserMessage().length())),
        request.getAiResponse() != null ? request.getAiResponse().length() : 0);

    // Handle session ID format - strip "session-" prefix if present
    final String adjustedSessionId;
    if (request.getSessionId() != null && request.getSessionId().startsWith("session-")) {
      adjustedSessionId = request.getSessionId().substring("session-".length());
      log.info("Adjusted sessionId from {} to {}", request.getSessionId(), adjustedSessionId);
    } else {
      adjustedSessionId = request.getSessionId();
    }

    // Validate recaptcha
    log.debug("Validating reCAPTCHA token");
    recaptchaService.validateRecaptchaToken(request.getRecaptchaToken());
    log.debug("reCAPTCHA token validation passed");

    // Verify session exists before attempting to find it
    boolean sessionExists = messageRepository.existsBySessionId(adjustedSessionId);
    if (!sessionExists) {
      log.error("Session with ID {} does not exist in the database", adjustedSessionId);
      throw new EntityNotFoundException("Session", adjustedSessionId);
    }
    log.info("Session with ID {} exists in the database", adjustedSessionId);

    // Find session metadata
    log.info("Finding session with ID: {}", adjustedSessionId);
    LanguageMessage sessionMetadata = messageRepository.findBySessionIdAndIsSessionMetadataTrue(adjustedSessionId)
        .orElseThrow(() -> {
          log.error("Session metadata not found with ID: {} (this should not happen since we verified it exists)",
              adjustedSessionId);
          return new EntityNotFoundException("Session", adjustedSessionId);
        });
    log.info("Found session: {} for user: {}", sessionMetadata.getSessionId(), sessionMetadata.getUserId());

    // Validate user access
    log.debug("Validating user access for userID: {}", sessionMetadata.getUserId());
    authValidator.validateUserAccess(sessionMetadata.getUserId());
    log.debug("User access validation passed");

    // Create user message
    log.info("Building user message entity");
    LanguageMessage userMessage = LanguageMessage.builder()
        .sessionId(adjustedSessionId)
        .userId(sessionMetadata.getUserId())
        .language(sessionMetadata.getLanguage())
        .proficiencyLevel(sessionMetadata.getProficiencyLevel())
        .messageType(MessageType.USER_MESSAGE)
        .content(request.getUserMessage())
        .userAudioUrl(request.getUserAudioUrl())
        .isSessionMetadata(false)
        .build();
    log.debug("User message entity built successfully");

    // Save user message
    log.info("Saving user message to database");
    LanguageMessage savedUserMessage = messageRepository.save(userMessage);
    log.info("User message saved successfully with ID: {}", savedUserMessage.getId());

    // Create AI response message
    log.info("Building AI response entity");
    LanguageMessage aiResponse = LanguageMessage.builder()
        .sessionId(adjustedSessionId)
        .userId(sessionMetadata.getUserId())
        .language(sessionMetadata.getLanguage())
        .proficiencyLevel(sessionMetadata.getProficiencyLevel())
        .messageType(MessageType.AI_RESPONSE)
        .content(request.getAiResponse())
        .audioUrl(request.getAudioUrl())
        .isSessionMetadata(false)
        .replyToId(savedUserMessage.getId())
        .build();
    log.debug("AI response entity built successfully");

    // Save AI response
    log.info("Saving AI response to database");
    LanguageMessage savedAiResponse = messageRepository.save(aiResponse);
    log.info("AI response saved successfully with ID: {}", savedAiResponse.getId());

    // Check if it was really saved by querying the database
    boolean exists = messageRepository.existsById(savedAiResponse.getId());
    log.info("Verification - AI response exists in database: {}", exists);

    // Convert to DTO and return
    LanguageMessageDTO dto = messageMapper.toDTO(savedAiResponse);
    log.info("Interaction successfully processed and returning DTO with ID: {}", dto.getId());
    return dto;
  }

  @Override
  @Transactional(readOnly = true)
  public Page<LanguageMessageDTO> getSessionInteractions(String sessionId, Pageable pageable) {
    // Check if session exists
    if (!messageRepository.existsBySessionId(sessionId)) {
      throw new EntityNotFoundException("Session", sessionId);
    }

    // Find session metadata
    LanguageMessage sessionMetadata = messageRepository.findBySessionIdAndIsSessionMetadataTrue(sessionId)
        .orElseThrow(() -> new EntityNotFoundException("Session metadata", sessionId));

    // Validate user access
    authValidator.validateUserAccess(sessionMetadata.getUserId());

    // Get all messages for this session
    Page<LanguageMessage> messages = messageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId, pageable);
    return messages.map(messageMapper::toDTO);
  }

  @Override
  @Transactional
  public String processAudio(ProcessAudioRequest request) {
    // Validate recaptcha
    recaptchaService.validateRecaptchaToken(request.getRecaptchaToken());

    // Check if session exists
    if (!messageRepository.existsBySessionId(request.getSessionId())) {
      throw new EntityNotFoundException("Session", request.getSessionId());
    }

    // Find session metadata
    LanguageMessage sessionMetadata = messageRepository.findBySessionIdAndIsSessionMetadataTrue(request.getSessionId())
        .orElseThrow(() -> new EntityNotFoundException("Session metadata", request.getSessionId()));

    // Validate user access
    authValidator.validateUserAccess(request.getUserId());

    // Validate that the session belongs to this user
    if (!sessionMetadata.getUserId().equals(request.getUserId())) {
      throw new EntityNotFoundException("Session for user", request.getUserId());
    }

    try {
      // Call external AI API
      return generateAIResponse(request.getMessage(), sessionMetadata.getLanguage(),
          sessionMetadata.getProficiencyLevel());
    } catch (Exception e) {
      log.error("Error generating AI response: {}", e.getMessage(), e);
      return generateMockResponse(request.getMessage(), sessionMetadata.getProficiencyLevel());
    }
  }

  private String generateAIResponse(String userMessage, String language, ProficiencyLevel proficiencyLevel) {
    try {
      log.info("Calling AI API for response to: {}", userMessage.substring(0, Math.min(50, userMessage.length())));

      RestTemplate restTemplate = new RestTemplate();
      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);
      headers.set("X-API-KEY", aiApiKey);

      Map<String, Object> requestBody = new HashMap<>();
      requestBody.put("message", userMessage);
      requestBody.put("language", language);
      requestBody.put("proficiency", proficiencyLevel.toString());

      HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

      @SuppressWarnings("rawtypes")
      ResponseEntity<Map> response = restTemplate.postForEntity(
          aiApiUrl + "/generate-response",
          request,
          Map.class);

      if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = response.getBody();
        if (responseBody != null && responseBody.get("response") != null) {
          String aiResponse = (String) responseBody.get("response");
          log.info("Received AI response from API: {} characters", aiResponse.length());
          return aiResponse;
        }
        log.warn("AI API response body or 'response' field is null");
        return generateMockResponse(userMessage, proficiencyLevel);
      } else {
        log.warn("AI API returned non-success status code: {}", response.getStatusCode());
        return generateMockResponse(userMessage, proficiencyLevel);
      }
    } catch (Exception e) {
      log.error("Error calling AI API: {}", e.getMessage(), e);
      return generateMockResponse(userMessage, proficiencyLevel);
    }
  }

  private String generateMockResponse(String userMessage, ProficiencyLevel proficiencyLevel) {
    log.info("Generating mock response for proficiency level: {}", proficiencyLevel);
    String response;

    switch (proficiencyLevel) {
      case BEGINNER:
        response = simplifyMessage("I understand. " + userMessage);
        break;
      case ELEMENTARY:
        response = simplifyMessage("That's interesting. " + userMessage);
        break;
      case INTERMEDIATE:
        response = improveVocabulary("I see what you mean. " + userMessage);
        break;
      case ADVANCED:
        response = makeMoreNatural(userMessage);
        break;
      case PROFICIENT:
      case NATIVE:
        response = addNuance(userMessage);
        break;
      default:
        response = "I understand. Please tell me more.";
    }

    return response;
  }

  private String simplifyMessage(String message) {
    return "I understand. That's interesting. Can you tell me more about that?";
  }

  private String improveVocabulary(String message) {
    return "That's quite fascinating. I'd love to hear additional details about your perspective on this topic.";
  }

  private String makeMoreNatural(String message) {
    return "I see what you're getting at. That's an intriguing point you've raised. Would you mind elaborating a bit more on how you came to that conclusion?";
  }

  private String addNuance(String message) {
    return "That's a nuanced perspective. I appreciate your thoughtful approach to this subject. Perhaps we could explore some of the underlying assumptions and see where that leads our conversation?";
  }
}