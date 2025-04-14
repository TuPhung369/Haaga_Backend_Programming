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
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

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

    // Check if metadata already exists for this user and language
    Optional<LanguageMessage> existingMetadata = messageRepository.findByUserIdAndLanguageAndIsSessionMetadataTrue(
        request.getUserId(), request.getLanguage());

    if (existingMetadata.isPresent()) {
      log.info("Session metadata already exists for user: {}, language: {}", request.getUserId(),
          request.getLanguage());
      return messageMapper.toDTO(existingMetadata.get());
    }

    // Create session metadata message
    LanguageMessage sessionMessage = LanguageMessage.builder()
        .userId(request.getUserId())
        .language(request.getLanguage())
        .proficiencyLevel(proficiencyLevel)
        .messageType(MessageType.SYSTEM_MESSAGE)
        .userMessage("Session created")
        .isSessionMetadata(true)
        .build();

    LanguageMessage savedMessage = messageRepository.save(sessionMessage);
    log.info("Session created successfully with ID: {}", savedMessage.getId());

    return messageMapper.toDTO(savedMessage);
  }

  @Override
  @Transactional(readOnly = true)
  public List<String> getUserSessions(String userId) {
    // Validate user access
    authValidator.validateUserAccess(userId);

    // Get all languages the user has interacted with by finding metadata entries
    Page<LanguageMessage> metadataMessages = messageRepository
        .findByUserIdAndIsSessionMetadataTrueOrderByCreatedAtDesc(userId, Pageable.unpaged());

    // Extract just the languages from the metadata messages
    return metadataMessages.getContent().stream()
        .map(LanguageMessage::getLanguage)
        .distinct()
        .collect(Collectors.toList());
  }

  @Override
  @Transactional(readOnly = true)
  public Page<LanguageMessageDTO> getSessionMessages(String sessionId, Pageable pageable) {
    // This method has been repurposed to get messages by userId and language
    // Parse the sessionId which might contain userId and language in format
    // "user-{userId}-lang-{language}"

    String userId;
    String language;

    if (sessionId != null && sessionId.contains("-lang-")) {
      // Parse from combined format
      String[] parts = sessionId.split("-lang-");
      if (parts.length >= 2) {
        userId = parts[0].startsWith("user-") ? parts[0].substring(5) : parts[0];
        language = parts[1];
      } else {
        throw new EntityNotFoundException("Invalid session format", sessionId);
      }
    } else if (sessionId != null && sessionId.startsWith("user-")) {
      // If only userId is provided, we can't determine the language
      userId = sessionId.substring(5);
      throw new EntityNotFoundException("Language required", "userId: " + userId);
    } else {
      // Fallback using sessionId as userId (backward compatibility)
      userId = sessionId;
      throw new EntityNotFoundException("Language required", "userId: " + userId);
    }

    log.info("Getting messages for user {} and language {}", userId, language);

    // Validate user access
    authValidator.validateUserAccess(userId);

    // Find metadata record to confirm this user+language combination exists
    Optional<LanguageMessage> metadata = messageRepository.findByUserIdAndLanguageAndIsSessionMetadataTrue(userId,
        language);
    if (metadata.isEmpty()) {
      throw new EntityNotFoundException("No conversations found", "userId: " + userId + ", language: " + language);
    }

    // Get messages for the user and language
    Page<LanguageMessage> messages = messageRepository.findByUserIdAndLanguageOrderByCreatedAtDesc(userId, language,
        pageable);
    return messages.map(messageMapper::toDTO);
  }

  @Transactional
  @Override
  public LanguageMessageDTO saveUserMessage(SaveMessageRequest request) {
    // The session ID may encode both user ID and language
    log.info("Saving user message for user {} from session {}", request.getUserId(), request.getSessionId());

    // Validate recaptcha
    recaptchaService.validateRecaptchaToken(request.getRecaptchaToken());

    // Validate user access
    authValidator.validateUserAccess(request.getUserId());

    // Extract language from session ID if possible
    String language = "en-US"; // Default language
    if (request.getSessionId() != null && request.getSessionId().contains("-lang-")) {
      String[] parts = request.getSessionId().split("-lang-");
      if (parts.length >= 2) {
        language = parts[1];
        log.info("Extracted language from session ID: {}", language);
      }
    }

    // Check if metadata exists for this user and language
    Optional<LanguageMessage> metadataOpt = messageRepository.findByUserIdAndLanguageAndIsSessionMetadataTrue(
        request.getUserId(), language);

    LanguageMessage metadata;
    if (metadataOpt.isPresent()) {
      metadata = metadataOpt.get();
      log.info("Found existing metadata for user {} and language {}", request.getUserId(), language);
    } else {
      // Create a new metadata entry if one doesn't exist
      log.info("No metadata found for user {} and language {}, creating new", request.getUserId(), language);

      // Default to INTERMEDIATE proficiency for new sessions
      ProficiencyLevel proficiencyLevel = ProficiencyLevel.INTERMEDIATE;

      LanguageMessage newMetadata = LanguageMessage.builder()
          .userId(request.getUserId())
          .language(language)
          .proficiencyLevel(proficiencyLevel)
          .messageType(MessageType.SYSTEM_MESSAGE)
          .userMessage("Session created automatically")
          .isSessionMetadata(true)
          .build();

      metadata = messageRepository.save(newMetadata);
      log.info("Created new metadata with ID: {}", metadata.getId());
    }

    // Save user message
    LanguageMessage userMessage = LanguageMessage.builder()
        .userId(request.getUserId())
        .language(language)
        .proficiencyLevel(metadata.getProficiencyLevel())
        .messageType(MessageType.USER_MESSAGE)
        .userMessage(request.getContent())
        .audioUrl(request.getAudioUrl())
        .isSessionMetadata(false)
        .build();

    LanguageMessage savedUserMessage = messageRepository.save(userMessage);
    log.info("User message saved with ID: {}", savedUserMessage.getId());

    // Generate AI response
    String aiResponseContent = generateAIResponse(
        request.getContent(),
        language,
        metadata.getProficiencyLevel());

    // Save AI response
    LanguageMessage aiResponse = LanguageMessage.builder()
        .userId(request.getUserId())
        .language(language)
        .proficiencyLevel(metadata.getProficiencyLevel())
        .messageType(MessageType.AI_RESPONSE)
        .aiResponse(aiResponseContent)
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
    // Parse the sessionId to extract userId and language
    String userId;
    String language;

    if (sessionId != null && sessionId.contains("-lang-")) {
      // Parse from combined format
      String[] parts = sessionId.split("-lang-");
      if (parts.length >= 2) {
        userId = parts[0].startsWith("user-") ? parts[0].substring(5) : parts[0];
        language = parts[1];

        // Check if metadata exists for this user and language
        return messageRepository.existsByUserIdAndLanguageAndIsSessionMetadataTrue(userId, language);
      }
    }

    // For other formats, return false
    return false;
  }

  @Override
  public LanguageMessageDTO getSessionMetadata(String sessionId) {
    // Parse the sessionId to extract userId and language
    String userId;
    String language;

    if (sessionId != null && sessionId.contains("-lang-")) {
      // Parse from combined format
      String[] parts = sessionId.split("-lang-");
      if (parts.length >= 2) {
        userId = parts[0].startsWith("user-") ? parts[0].substring(5) : parts[0];
        language = parts[1];

        Optional<LanguageMessage> metadata = messageRepository.findByUserIdAndLanguageAndIsSessionMetadataTrue(userId,
            language);
        if (metadata.isPresent()) {
          return messageMapper.toDTO(metadata.get());
        } else {
          throw new EntityNotFoundException("No metadata found", "userId: " + userId + ", language: " + language);
        }
      }
    }

    throw new EntityNotFoundException("Invalid session format", sessionId);
  }

  @Override
  public LanguageMessageDTO saveSessionMetadata(LanguageMessage sessionMessage) {
    log.info("Saving session metadata for user ID: {}, language: {}",
        sessionMessage.getUserId(), sessionMessage.getLanguage());

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

  private String generateAIResponse(String userMessage, String language, ProficiencyLevel proficiencyLevel) {
    if (aiApiUrl == null || aiApiUrl.isEmpty()) {
      log.warn("AI API URL not configured, using mock response");
      return generateMockResponse(userMessage, proficiencyLevel);
    }

    try {
      RestTemplate restTemplate = new RestTemplate();
      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);
      headers.set("X-API-KEY", aiApiKey);

      Map<String, Object> requestBody = new HashMap<>();
      requestBody.put("user_message", userMessage);
      requestBody.put("language", language);
      requestBody.put("proficiency", proficiencyLevel.toString().toLowerCase());

      HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

      // Using raw type Map to match the RestTemplate API
      // and avoiding null pointer access by explicit null checks
      @SuppressWarnings("rawtypes")
      ResponseEntity<Map> response = restTemplate.postForEntity(
          aiApiUrl + "/generate-response",
          request,
          Map.class);

      if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        if (responseBody != null) {
          Object responseText = responseBody.get("response");
          if (responseText != null) {
            return responseText.toString();
          }
        }
      }

      // Fallback to mock response
      log.warn("AI service returned invalid response, using mock response");
      return generateMockResponse(userMessage, proficiencyLevel);

    } catch (HttpClientErrorException | HttpServerErrorException e) {
      log.error("HTTP error calling AI service: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
      return generateMockResponse(userMessage, proficiencyLevel);
    } catch (ResourceAccessException e) {
      log.error("Network error calling AI service: {}", e.getMessage());
      return generateMockResponse(userMessage, proficiencyLevel);
    } catch (RestClientException e) {
      log.error("REST client error calling AI service: {}", e.getMessage());
      return generateMockResponse(userMessage, proficiencyLevel);
    } catch (RuntimeException e) {
      log.error("Unexpected error calling AI service: {}", e.getMessage());
      return generateMockResponse(userMessage, proficiencyLevel);
    }
  }

  private String generateMockResponse(String userMessage, ProficiencyLevel proficiencyLevel) {
    return switch (proficiencyLevel) {
      case BEGINNER -> "That's a good try! A simpler way to say that would be: "
          + simplifyMessage(userMessage);
      case INTERMEDIATE -> "Well said! You could improve your vocabulary by saying: "
          + improveVocabulary(userMessage);
      case ADVANCED -> "Very good! To sound more natural, try: "
          + makeMoreNatural(userMessage);
      case PROFICIENT, NATIVE -> "Excellent! For absolute perfection, consider this nuance: "
          + addNuance(userMessage);
      default -> "I understand what you're saying. Keep practicing!";
    };
  }

  private String simplifyMessage(String message) {
    // Mock implementation
    return message.replaceAll("\\b(difficult|challenging)\\b", "hard")
        .replaceAll("\\b(purchase|acquire)\\b", "buy");
  }

  private String improveVocabulary(String message) {
    // Mock implementation
    return message.replaceAll("\\b(good)\\b", "excellent")
        .replaceAll("\\b(bad)\\b", "inadequate");
  }

  private String makeMoreNatural(String message) {
    // Mock implementation
    return message.replaceAll("\\b(I am)\\b", "I'm")
        .replaceAll("\\b(It is)\\b", "It's");
  }

  private String addNuance(String message) {
    // Mock implementation
    return "While \"" + message + "\" is correct, a native speaker might express this with more idiomatic language.";
  }
}