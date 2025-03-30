package com.database.study.controller;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.database.study.dto.request.AssistantAIMessageRequest;
import com.database.study.dto.response.AssistantAIMessageResponse;
import com.database.study.service.AssistantAIService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping({ "/api/assistant", "/api/chat" }) // Support both paths for backward compatibility
@RequiredArgsConstructor
public class AssistantAIController {

  private final AssistantAIService assistantAIService;

  @GetMapping("/test")
  public ResponseEntity<Map<String, String>> testEndpoint() {
    log.info("Test endpoint accessed");
    Map<String, String> response = new HashMap<>();
    response.put("status", "ok");
    response.put("message", "AssistantAI API is working");
    return ResponseEntity.ok(response);
  }

  @GetMapping("/{userId}")
  public ResponseEntity<List<AssistantAIMessageResponse>> getChatHistory(
      @PathVariable String userId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    log.info("Get chat history for user: {}, page: {}, size: {}", userId, page, size);
    return ResponseEntity.ok(assistantAIService.getChatHistory(userId, page, size));
  }

  @PostMapping("/send")
  public ResponseEntity<AssistantAIMessageResponse> sendMessage(@RequestBody AssistantAIMessageRequest request) {
    log.info("Received message for user: {}, sessionId: {}", request.getUserId(), request.getSessionId());
    return ResponseEntity.ok(assistantAIService.sendMessage(request));
  }
}