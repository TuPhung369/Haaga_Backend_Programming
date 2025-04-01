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
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/language-ai")
@RequiredArgsConstructor
public class LanguageAIController {

  private final LanguageAIService languageAIService;

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
}