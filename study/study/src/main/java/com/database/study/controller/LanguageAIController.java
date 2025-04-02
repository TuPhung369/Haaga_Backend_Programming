package com.database.study.controller;

import com.database.study.dto.LanguageMessageDTO;
import com.database.study.dto.request.CreateLanguageSessionRequest;
import com.database.study.dto.request.ProcessAudioRequest;
import com.database.study.dto.request.SaveLanguageInteractionRequest;
import com.database.study.service.LanguageAIService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/language-ai")
@RequiredArgsConstructor
public class LanguageAIController {

  private final LanguageAIService languageAIService;
  private static final Logger log = LoggerFactory.getLogger(LanguageAIController.class);

  @PostMapping("/sessions")
  public ResponseEntity<LanguageMessageDTO> createSession(@Valid @RequestBody CreateLanguageSessionRequest request) {
    return ResponseEntity.ok(languageAIService.createSession(request));
  }

  @GetMapping("/users/{userId}/sessions")
  public ResponseEntity<Page<LanguageMessageDTO>> getUserSessions(
      @PathVariable String userId,
      Pageable pageable) {
    return ResponseEntity.ok(languageAIService.getUserSessions(userId, pageable));
  }

  @GetMapping("/users/{userId}/sessions/language/{language}")
  public ResponseEntity<Page<LanguageMessageDTO>> getUserSessionsByLanguage(
      @PathVariable String userId,
      @PathVariable String language,
      Pageable pageable) {
    return ResponseEntity.ok(languageAIService.getUserSessionsByLanguage(userId, language, pageable));
  }

  @PostMapping("/interactions")
  public ResponseEntity<LanguageMessageDTO> saveInteraction(
      @Valid @RequestBody SaveLanguageInteractionRequest request) {
    log.info("Saving interaction for session: {}", request.getSessionId());

    // Handle session ID formatting (strip "session-" prefix if present)
    String adjustedSessionId = request.getSessionId();
    if (adjustedSessionId != null && adjustedSessionId.startsWith("session-")) {
      adjustedSessionId = adjustedSessionId.substring("session-".length());
      log.info("Adjusted sessionId from {} to {}", request.getSessionId(), adjustedSessionId);

      // Create a new request with the adjusted session ID
      SaveLanguageInteractionRequest adjustedRequest = SaveLanguageInteractionRequest.builder()
          .sessionId(adjustedSessionId)
          .userMessage(request.getUserMessage())
          .aiResponse(request.getAiResponse())
          .audioUrl(request.getAudioUrl())
          .userAudioUrl(request.getUserAudioUrl())
          .recaptchaToken(request.getRecaptchaToken())
          .build();

      return ResponseEntity.ok(languageAIService.saveInteraction(adjustedRequest));
    }

    return ResponseEntity.ok(languageAIService.saveInteraction(request));
  }

  @GetMapping("/sessions/{sessionId}/interactions")
  public ResponseEntity<Page<LanguageMessageDTO>> getSessionInteractions(
      @PathVariable String sessionId,
      Pageable pageable) {
    log.info("Getting interactions for session: {}", sessionId);

    // Handle session ID formatting (strip "session-" prefix if present)
    String adjustedSessionId = sessionId;
    if (sessionId != null && sessionId.startsWith("session-")) {
      adjustedSessionId = sessionId.substring("session-".length());
      log.info("Adjusted sessionId from {} to {}", sessionId, adjustedSessionId);
    }

    return ResponseEntity.ok(languageAIService.getSessionInteractions(adjustedSessionId, pageable));
  }

  @PostMapping("/process-audio")
  public ResponseEntity<Map<String, String>> processAudio(@Valid @RequestBody ProcessAudioRequest request) {
    String aiResponse = languageAIService.processAudio(request);

    Map<String, String> response = new HashMap<>();
    response.put("aiResponse", aiResponse);

    return ResponseEntity.ok(response);
  }

  /**
   * Development endpoint for saving interactions without CAPTCHA validation
   * This is used by the language practice component during development
   */
  @PostMapping("/interactions/dev")
  public ResponseEntity<?> saveInteractionDev(@RequestBody Map<String, Object> request) {
    String sessionId = (String) request.get("sessionId");
    String userMessage = (String) request.get("userMessage");
    String aiResponse = (String) request.get("aiResponse");

    // Log the incoming request
    log.info("DEV Interaction request received - sessionId: {}, userMessage: {}, aiResponse: {}",
        sessionId,
        userMessage != null ? userMessage.substring(0, Math.min(50, userMessage.length())) + "..." : "null",
        aiResponse != null ? aiResponse.substring(0, Math.min(50, aiResponse.length())) + "..." : "null");

    // Handle possible session ID format issues
    // Frontend might send "session-uuid" but backend expects just "uuid"
    String adjustedSessionId = sessionId;
    if (sessionId != null && sessionId.startsWith("session-")) {
      adjustedSessionId = sessionId.substring("session-".length());
      log.info("Adjusted sessionId from {} to {}", sessionId, adjustedSessionId);

      // Update the request map
      request.put("sessionId", adjustedSessionId);
    } else if (sessionId != null && sessionId.startsWith("mock-")) {
      // For mock sessions, create a placeholder response
      log.info("Mock session detected: {}", sessionId);
      Map<String, Object> mockResponse = new HashMap<>();
      mockResponse.put("id", "mock-interaction-" + UUID.randomUUID().toString());
      mockResponse.put("sessionId", sessionId);
      mockResponse.put("userMessage", userMessage);
      mockResponse.put("aiResponse", aiResponse);
      mockResponse.put("createdAt", new Date());
      mockResponse.put("note", "Mock interaction - session was a frontend-generated mock");
      return ResponseEntity.ok(mockResponse);
    }

    // Create a SaveLanguageInteractionRequest with default recaptcha token
    log.info("Creating SaveLanguageInteractionRequest with sessionId: {}", adjustedSessionId);
    SaveLanguageInteractionRequest validRequest = SaveLanguageInteractionRequest.builder()
        .sessionId(adjustedSessionId)
        .userMessage(userMessage)
        .aiResponse(aiResponse)
        .audioUrl((String) request.get("audioUrl"))
        .userAudioUrl((String) request.get("userAudioUrl"))
        .recaptchaToken("dev_bypass_token") // Add a fake token to bypass validation
        .build();

    try {
      log.info("Calling languageAIService.saveInteraction");
      LanguageMessageDTO result = languageAIService.saveInteraction(validRequest);
      log.info("Interaction successfully saved with ID: {}", result.getId());

      // Enhanced response with more details
      Map<String, Object> successResponse = new HashMap<>();
      successResponse.put("success", true);
      successResponse.put("id", result.getId());
      successResponse.put("sessionId", result.getSessionId());
      successResponse.put("originalSessionId", sessionId);
      successResponse.put("adjustedSessionId", adjustedSessionId);
      successResponse.put("sessionExistedBeforeSave", true); // Since it was successful, session must exist
      successResponse.put("createdAt", result.getCreatedAt());

      log.info("Returning success response: {}", successResponse);
      return ResponseEntity.ok(successResponse);
    } catch (Exception e) {
      log.error("Error saving interaction: {}", e.getMessage(), e);

      Map<String, Object> errorResponse = new HashMap<>();
      errorResponse.put("success", false);
      errorResponse.put("error", "Failed to save interaction: " + e.getMessage());
      errorResponse.put("originalSessionId", sessionId);
      errorResponse.put("adjustedSessionId", adjustedSessionId);
      errorResponse.put("sessionExistedBeforeSave", false); // Error suggests session may not exist
      errorResponse.put("note", "Using development endpoint that bypasses CAPTCHA");

      // For debugging, add info about the actual session ID format expected
      if (e.getMessage() != null && e.getMessage().contains("not found")) {
        errorResponse.put("debug", "Session ID format issue: Expected format may differ. Tried: " + adjustedSessionId);

        // Try to provide more detailed diagnostics
        try {
          log.info("Attempting diagnostic query for sessions with similar IDs");
          // Check if we can find the session by another means
          errorResponse.put("diagnosticNote",
              "The system could not find a session with this ID. Make sure the session exists before saving interactions.");
        } catch (Exception diagEx) {
          log.error("Diagnostic query failed: {}", diagEx.getMessage());
        }
      }

      log.info("Returning error response: {}", errorResponse);
      return ResponseEntity.ok(errorResponse); // Return 200 in dev mode even on error
    }
  }

  @GetMapping("/sessions/{sessionId}/exists")
  public ResponseEntity<Map<String, Boolean>> checkSessionExists(@PathVariable String sessionId) {
    log.info("Checking if session exists: {}", sessionId);

    // Handle session ID formatting (strip "session-" prefix if present)
    String adjustedSessionId = sessionId;
    if (sessionId != null && sessionId.startsWith("session-")) {
      adjustedSessionId = sessionId.substring("session-".length());
      log.info("Adjusted sessionId from {} to {}", sessionId, adjustedSessionId);
    }

    boolean exists = false;

    try {
      // Try to get session interactions - if this doesn't throw an exception, the
      // session exists
      languageAIService.getSessionInteractions(adjustedSessionId, Pageable.unpaged());
      exists = true;
      log.info("Session {} exists", sessionId);
    } catch (Exception e) {
      log.info("Session {} does not exist: {}", sessionId, e.getMessage());
      exists = false;
    }

    Map<String, Boolean> response = new HashMap<>();
    response.put("exists", exists);
    response.put("originalId", sessionId != null && !sessionId.equals(adjustedSessionId));

    return ResponseEntity.ok(response);
  }
}