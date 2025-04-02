package com.database.study.controller;

import com.database.study.dto.LanguageMessageDTO;
import com.database.study.dto.request.CreateSessionRequest;
import com.database.study.dto.request.SaveMessageRequest;
import com.database.study.service.LanguageMessageService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/language")
@RequiredArgsConstructor
public class LanguageMessageController {

  private static final Logger log = LoggerFactory.getLogger(LanguageMessageController.class);
  private final LanguageMessageService messageService;

  /**
   * Create a new language practice session
   */
  @PostMapping("/sessions")
  public ResponseEntity<LanguageMessageDTO> createSession(@Valid @RequestBody CreateSessionRequest request) {
    log.info("Creating new language session for user: {}, language: {}", request.getUserId(), request.getLanguage());
    return ResponseEntity.ok(messageService.createSession(request));
  }

  /**
   * Get all sessions for a user
   */
  @GetMapping("/users/{userId}/sessions")
  public ResponseEntity<List<String>> getUserSessions(@PathVariable String userId) {
    log.info("Getting sessions for user: {}", userId);
    return ResponseEntity.ok(messageService.getUserSessions(userId));
  }

  /**
   * Get all messages in a session
   */
  @GetMapping("/sessions/{sessionId}/messages")
  public ResponseEntity<Page<LanguageMessageDTO>> getSessionMessages(
      @PathVariable String sessionId,
      Pageable pageable) {
    log.info("Getting messages for session: {}", sessionId);

    // Handle session ID formatting (strip "session-" prefix if present)
    String adjustedSessionId = sessionId;
    if (sessionId != null && sessionId.startsWith("session-")) {
      adjustedSessionId = sessionId.substring("session-".length());
      log.info("Adjusted sessionId from {} to {}", sessionId, adjustedSessionId);
    }

    return ResponseEntity.ok(messageService.getSessionMessages(adjustedSessionId, pageable));
  }

  /**
   * Save a user message
   */
  @PostMapping("/messages")
  public ResponseEntity<LanguageMessageDTO> saveMessage(@Valid @RequestBody SaveMessageRequest request) {
    log.info("Saving message for session: {}", request.getSessionId());
    return ResponseEntity.ok(messageService.saveUserMessage(request));
  }

  /**
   * Check if a session exists
   */
  @GetMapping("/sessions/{sessionId}/exists")
  public ResponseEntity<Map<String, Boolean>> checkSessionExists(@PathVariable String sessionId) {
    log.info("Checking if session exists: {}", sessionId);

    boolean exists = messageService.sessionExists(sessionId);
    Map<String, Boolean> response = new HashMap<>();
    response.put("exists", exists);

    return ResponseEntity.ok(response);
  }

  /**
   * Get session metadata
   */
  @GetMapping("/sessions/{sessionId}/metadata")
  public ResponseEntity<LanguageMessageDTO> getSessionMetadata(@PathVariable String sessionId) {
    log.info("Getting metadata for session: {}", sessionId);
    return ResponseEntity.ok(messageService.getSessionMetadata(sessionId));
  }
}