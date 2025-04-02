package com.database.study.controller;

import com.database.study.dto.LanguageInteractionDTO;
import com.database.study.dto.LanguageSessionDTO;
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
  public ResponseEntity<LanguageSessionDTO> createSession(@Valid @RequestBody CreateLanguageSessionRequest request) {
    return ResponseEntity.ok(languageAIService.createSession(request));
  }

  @GetMapping("/users/{userId}/sessions")
  public ResponseEntity<Page<LanguageSessionDTO>> getUserSessions(
      @PathVariable String userId,
      Pageable pageable) {
    return ResponseEntity.ok(languageAIService.getUserSessions(userId, pageable));
  }

  @GetMapping("/users/{userId}/sessions/language/{language}")
  public ResponseEntity<Page<LanguageSessionDTO>> getUserSessionsByLanguage(
      @PathVariable String userId,
      @PathVariable String language,
      Pageable pageable) {
    return ResponseEntity.ok(languageAIService.getUserSessionsByLanguage(userId, language, pageable));
  }

  @PostMapping("/interactions")
  public ResponseEntity<LanguageInteractionDTO> saveInteraction(
      @Valid @RequestBody SaveLanguageInteractionRequest request) {
    return ResponseEntity.ok(languageAIService.saveInteraction(request));
  }

  @GetMapping("/sessions/{sessionId}/interactions")
  public ResponseEntity<Page<LanguageInteractionDTO>> getSessionInteractions(
      @PathVariable String sessionId,
      Pageable pageable) {
    return ResponseEntity.ok(languageAIService.getSessionInteractions(sessionId, pageable));
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
    SaveLanguageInteractionRequest validRequest = SaveLanguageInteractionRequest.builder()
        .sessionId(adjustedSessionId)
        .userMessage(userMessage)
        .aiResponse(aiResponse)
        .audioUrl((String) request.get("audioUrl"))
        .userAudioUrl((String) request.get("userAudioUrl"))
        .recaptchaToken("dev_bypass_token") // Add a fake token to bypass validation
        .build();

    try {
      LanguageInteractionDTO result = languageAIService.saveInteraction(validRequest);
      log.info("Interaction successfully saved with ID: {}", result.getId());
      return ResponseEntity.ok(result);
    } catch (Exception e) {
      log.error("Error saving interaction: {}", e.getMessage(), e);

      Map<String, String> errorResponse = new HashMap<>();
      errorResponse.put("error", "Failed to save interaction: " + e.getMessage());
      errorResponse.put("note", "Using development endpoint that bypasses CAPTCHA");

      // For debugging, add info about the actual session ID format expected
      if (e.getMessage() != null && e.getMessage().contains("not found")) {
        errorResponse.put("debug", "Session ID format issue: Expected format may differ. Tried: " + adjustedSessionId);
      }

      return ResponseEntity.ok(errorResponse); // Return 200 in dev mode even on error
    }
  }
}