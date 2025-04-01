package com.database.study.service.impl;

import com.database.study.dto.LanguageInteractionDTO;
import com.database.study.dto.LanguageSessionDTO;
import com.database.study.dto.request.CreateLanguageSessionRequest;
import com.database.study.dto.request.ProcessAudioRequest;
import com.database.study.dto.request.SaveLanguageInteractionRequest;
import com.database.study.entity.LanguageInteraction;
import com.database.study.entity.LanguageSession;
import com.database.study.enums.ProficiencyLevel;
import com.database.study.exception.EntityNotFoundException;
import com.database.study.exception.UnauthorizedAccessException;
import com.database.study.mapper.LanguageInteractionMapper;
import com.database.study.mapper.LanguageSessionMapper;
import com.database.study.repository.LanguageInteractionRepository;
import com.database.study.repository.LanguageSessionRepository;
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
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class LanguageAIServiceImpl implements LanguageAIService {

  private final LanguageSessionRepository sessionRepository;
  private final LanguageInteractionRepository interactionRepository;
  private final LanguageSessionMapper sessionMapper;
  private final LanguageInteractionMapper interactionMapper;
  private final AuthValidator authValidator;
  private final RecaptchaService recaptchaService;

  @Value("${ai.api.url:http://localhost:8000/api}")
  private String aiApiUrl;

  @Value("${ai.api.key:test-api-key}")
  private String aiApiKey;

  @Transactional
  @Override
  public LanguageSessionDTO createSession(CreateLanguageSessionRequest request) {
    // Validate recaptcha
    recaptchaService.validateRecaptchaToken(request.getRecaptchaToken());

    // Validate user access
    authValidator.validateUserAccess(request.getUserId());

    // Use the provided proficiency level or default to BEGINNER
    ProficiencyLevel proficiencyLevel = Optional.ofNullable(request.getProficiencyLevel())
        .orElse(ProficiencyLevel.BEGINNER);

    // Create new session
    LanguageSession session = LanguageSession.builder()
        .userId(request.getUserId())
        .language(request.getLanguage())
        .proficiencyLevel(proficiencyLevel)
        .build();

    LanguageSession savedSession = sessionRepository.save(session);
    return sessionMapper.toDTO(savedSession);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<LanguageSessionDTO> getUserSessions(String userId, Pageable pageable) {
    // Validate user access
    authValidator.validateUserAccess(userId);

    Page<LanguageSession> sessions = sessionRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    return sessions.map(sessionMapper::toDTO);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<LanguageSessionDTO> getUserSessionsByLanguage(String userId, String language, Pageable pageable) {
    // Validate user access
    authValidator.validateUserAccess(userId);

    Page<LanguageSession> sessions = sessionRepository.findByUserIdAndLanguageOrderByCreatedAtDesc(userId, language,
        pageable);
    return sessions.map(sessionMapper::toDTO);
  }

  @Transactional
  @Override
  public LanguageInteractionDTO saveInteraction(SaveLanguageInteractionRequest request) {
    // Validate recaptcha
    recaptchaService.validateRecaptchaToken(request.getRecaptchaToken());

    // Find session
    LanguageSession session = sessionRepository.findById(request.getSessionId())
        .orElseThrow(() -> new EntityNotFoundException("Session", request.getSessionId()));

    // Validate user access
    authValidator.validateUserAccess(session.getUserId());

    // Create interaction
    LanguageInteraction interaction = LanguageInteraction.builder()
        .session(session)
        .userMessage(request.getUserMessage())
        .aiResponse(request.getAiResponse())
        .audioUrl(request.getAudioUrl())
        .userAudioUrl(request.getUserAudioUrl())
        .build();

    LanguageInteraction savedInteraction = interactionRepository.save(interaction);
    return interactionMapper.toDTO(savedInteraction);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<LanguageInteractionDTO> getSessionInteractions(String sessionId, Pageable pageable) {
    // Find session
    LanguageSession session = sessionRepository.findById(sessionId)
        .orElseThrow(() -> new EntityNotFoundException("Session", sessionId));

    // Validate user access
    authValidator.validateUserAccess(session.getUserId());

    Page<LanguageInteraction> interactions = interactionRepository.findBySessionIdOrderByCreatedAtAsc(sessionId,
        pageable);
    return interactions.map(interactionMapper::toDTO);
  }

  @Override
  @Transactional
  public String processAudio(ProcessAudioRequest request) {
    // Validate recaptcha
    recaptchaService.validateRecaptchaToken(request.getRecaptchaToken());

    // Find session
    LanguageSession session = sessionRepository.findById(request.getSessionId())
        .orElseThrow(() -> new EntityNotFoundException("Session", request.getSessionId()));

    // Validate user access
    authValidator.validateUserAccess(request.getUserId());

    // Validate that the session belongs to this user
    if (!session.getUserId().equals(request.getUserId())) {
      throw new UnauthorizedAccessException("You do not have access to this session");
    }

    // Mock AI processing - in a real implementation, call your AI service
    String aiResponse = generateAIResponse(
        request.getMessage(),
        request.getLanguage(),
        Optional.ofNullable(request.getProficiencyLevel()).orElse(session.getProficiencyLevel()));

    return aiResponse;
  }

  /**
   * Generate a mock AI response based on user's message and proficiency
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