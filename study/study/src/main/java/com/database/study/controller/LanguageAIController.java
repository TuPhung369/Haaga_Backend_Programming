package com.database.study.controller;

import com.database.study.dto.LanguageMessageDTO;
import com.database.study.dto.request.CreateLanguageSessionRequest;
import com.database.study.dto.request.SaveLanguageInteractionRequest;
import com.database.study.service.LanguageAIService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.database.study.exception.EntityNotFoundException;

@RestController
@RequestMapping("/api/language-ai")
@RequiredArgsConstructor
public class LanguageAIController {

  private final LanguageAIService languageAIService;
  private static final Logger log = LoggerFactory.getLogger(LanguageAIController.class);

  /**
   * Endpoint to ensure session metadata exists for a user and language.
   * Renamed from createSession.
   */
  @PostMapping("/sessions")
  public ResponseEntity<LanguageMessageDTO> ensureSessionMetadata(
      @Valid @RequestBody CreateLanguageSessionRequest request) {
    log.info("Request received to ensure session metadata for user: {}, language: {}", request.getUserId(),
        request.getLanguage());
    return ResponseEntity.ok(languageAIService.ensureSessionMetadata(request));
  }

  /**
   * Endpoint to get conversation history for a user and language.
   * Replaces getSessionInteractions.
   */
  @GetMapping("/users/{userId}/languages/{language}/history")
  public ResponseEntity<Page<LanguageMessageDTO>> getUserConversationHistory(
      @PathVariable String userId,
      @PathVariable String language,
      Pageable pageable) {
    log.info("Request received to get conversation history for user: {}, language: {}", userId, language);
    return ResponseEntity.ok(languageAIService.getUserConversationHistory(userId, language, pageable));
  }

  /**
   * Endpoint to save a new interaction (user message + AI response).
   */
  @PostMapping("/interactions")
  public ResponseEntity<LanguageMessageDTO> saveInteraction(
      @Valid @RequestBody SaveLanguageInteractionRequest request) {
    log.info("Request received to save interaction for user: {}, language: {}", request.getUserId(),
        request.getLanguage());
    // Note: Request DTO now includes userId, language, userMessage, aiResponse
    // directly
    return ResponseEntity.ok(languageAIService.saveInteraction(request));
  }

  /**
   * Endpoint to get distinct languages a user has interacted with.
   * Replaces getUserSessions.
   */
  @GetMapping("/users/{userId}/languages")
  public ResponseEntity<Page<LanguageMessageDTO>> getUserLanguages(
      @PathVariable String userId,
      Pageable pageable) {
    log.info("Request received to get languages for user: {}", userId);
    return ResponseEntity.ok(languageAIService.getUserLanguages(userId, pageable));
  }

  // --- Development Endpoints (Keep or remove based on need) ---

  /**
   * Development endpoint for ensureSessionMetadata without CAPTCHA.
   */
  @PostMapping("/sessions/dev")
  public ResponseEntity<LanguageMessageDTO> ensureSessionMetadataDev(
      @RequestBody CreateLanguageSessionRequest request) {
    log.warn("DEV: Request received to ensure session metadata (no CAPTCHA) for user: {}, language: {}",
        request.getUserId(), request.getLanguage());
    // Inject a mock token or handle absence in service if needed
    if (request.getRecaptchaToken() == null) {
      request.setRecaptchaToken("dev_bypass_token");
    }
    return ResponseEntity.ok(languageAIService.ensureSessionMetadata(request));
  }

  /**
   * Development endpoint for saving interactions without CAPTCHA.
   * Adapts incoming generic Map to SaveLanguageInteractionRequest.
   */
  @PostMapping("/interactions/dev")
  public ResponseEntity<?> saveInteractionDev(@RequestBody Map<String, Object> request) {
    String userId = (String) request.get("userId");
    String language = (String) request.get("language");
    String userMessage = (String) request.get("userMessage");
    String aiResponse = (String) request.get("aiResponse");

    log.warn("DEV: Saving interaction request received (no CAPTCHA) - user: {}, lang: {}, userMsg: {}, aiResp: {}",
        userId, language,
        userMessage != null ? userMessage.substring(0, Math.min(50, userMessage.length())) + "..." : "null",
        aiResponse != null ? aiResponse.substring(0, Math.min(50, aiResponse.length())) + "..." : "null");

    // Construct the required SaveLanguageInteractionRequest
    SaveLanguageInteractionRequest validRequest = SaveLanguageInteractionRequest.builder()
        .userId(userId)
        .language(language != null ? language : "en-US") // Default language if missing
        .userMessage(userMessage)
        .aiResponse(aiResponse)
        .audioUrl((String) request.get("audioUrl"))
        .userAudioUrl((String) request.get("userAudioUrl"))
        // Proficiency might be null, service impl handles default
        // .proficiencyLevel((ProficiencyLevel) request.get("proficiencyLevel"))
        .recaptchaToken("dev_bypass_token") // Bypass token
        .build();

    try {
      log.warn("DEV: Calling languageAIService.saveInteraction");
      LanguageMessageDTO result = languageAIService.saveInteraction(validRequest);
      log.warn("DEV: Interaction successfully saved with ID: {}", result.getId());

      // Return a success response (can be simplified)
      Map<String, Object> successResponse = new HashMap<>();
      successResponse.put("success", true);
      successResponse.put("message", "Interaction saved successfully (DEV mode).");
      successResponse.put("interactionId", result.getId()); // Return the ID of the saved AI response message
      successResponse.put("userId", result.getUserId());
      successResponse.put("language", result.getLanguage());
      successResponse.put("createdAt", result.getCreatedAt());

      return ResponseEntity.ok(successResponse);
    } catch (Exception e) {
      log.error("DEV: Error saving interaction: {}", e.getMessage(), e);

      Map<String, Object> errorResponse = new HashMap<>();
      errorResponse.put("success", false);
      errorResponse.put("error", "Failed to save interaction (DEV mode): " + e.getMessage());
      errorResponse.put("requestDetails", validRequest); // Include request for debugging

      // Provide specific feedback if metadata was the issue
      if (e instanceof EntityNotFoundException && e.getMessage().contains("Session metadata")) {
        errorResponse.put("debugHint",
            "Ensure session metadata exists for this user/language before saving interaction. Call POST /api/language-ai/sessions/dev first.");
      }

      // Return 200 OK even on error in dev mode, but with error details
      return ResponseEntity.ok(errorResponse);
    }
  }

  // Removed old session-based endpoints like:
  // GET /sessions/{sessionId}/interactions
  // GET /sessions/session-{sessionId}/interactions
  // POST /process-audio (assuming handled elsewhere)
}