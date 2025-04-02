package com.database.study.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller that proxies requests to the AI Speech service running on Python
 */
@RestController
@RequestMapping("/api/proxy")
public class AIServiceProxyController {

  private static final Logger logger = LoggerFactory.getLogger(AIServiceProxyController.class);

  @Autowired
  private RestTemplate restTemplate;

  @Value("${speech.service.url:http://localhost:8008}")
  private String speechServiceUrl;

  /**
   * Log when this controller is initialized
   */
  @EventListener(ApplicationReadyEvent.class)
  public void onStartup() {
    logger.info("AIServiceProxyController initialized with speech service URL: {}", speechServiceUrl);
    logger.info("Ready to handle proxy requests to Python service");
    logger.info("Available endpoints:");
    logger.info(" - POST /api/proxy/ai-response");
    logger.info(" - POST /api/proxy/language-sessions");
    logger.info(" - GET /api/proxy/language-sessions/{userId}");
    logger.info(" - POST /api/proxy/language-ai/interactions");
    logger.info(" - GET /api/proxy/language-ai/interactions/{sessionId}");
    logger.info(" - GET /api/proxy/users/{userId}/language-proficiency");
    logger.info(" - GET /api/proxy/health");
  }

  /**
   * Simple test endpoint to verify the controller is working
   */
  @GetMapping("/test")
  public ResponseEntity<Map<String, String>> test() {
    logger.info("Test endpoint called - controller is active");
    Map<String, String> response = new HashMap<>();
    response.put("status", "ok");
    response.put("message", "AIServiceProxyController is working");
    return ResponseEntity.ok(response);
  }

  /**
   * Proxy for the AI response endpoint
   */
  @PostMapping("/ai-response")
  public ResponseEntity<Object> getAiResponse(@RequestBody Object requestBody) {
    logger.info("Proxying AI response request with body: {}", requestBody);
    return proxyRequest("/api/ai-response", HttpMethod.POST, requestBody);
  }

  /**
   * Proxy for creating language sessions
   */
  @PostMapping("/language-sessions")
  public ResponseEntity<Object> createLanguageSession(@RequestBody Object requestBody) {
    logger.info("Proxying create language session request with body: {}", requestBody);
    return proxyRequest("/api/language-sessions", HttpMethod.POST, requestBody);
  }

  /**
   * Proxy for getting language sessions for a user
   */
  @GetMapping("/language-sessions/{userId}")
  public ResponseEntity<Object> getLanguageSessions(@PathVariable String userId) {
    logger.info("Proxying get language sessions request for user: {}", userId);
    return proxyRequest("/api/language-sessions/" + userId, HttpMethod.GET, null);
  }

  /**
   * Proxy for saving language interactions
   */
  @PostMapping("/language-ai/interactions")
  public ResponseEntity<Object> saveInteraction(@RequestBody Object requestBody) {
    logger.info("Proxying save language interaction request with body: {}", requestBody);
    return proxyRequest("/api/language-ai/interactions", HttpMethod.POST, requestBody);
  }

  /**
   * Proxy for getting language interactions for a session
   */
  @GetMapping("/language-ai/interactions/{sessionId}")
  public ResponseEntity<Object> getInteractions(@PathVariable String sessionId) {
    logger.info("Proxying get language interactions request for session: {}", sessionId);
    return proxyRequest("/api/language-ai/interactions/" + sessionId, HttpMethod.GET, null);
  }

  /**
   * Proxy for getting user language proficiency
   */
  @GetMapping("/users/{userId}/language-proficiency")
  public ResponseEntity<Object> getLanguageProficiency(
      @PathVariable String userId,
      @RequestParam(required = false) String language) {

    logger.info("Proxying get language proficiency request for user: {}, language: {}", userId, language);
    String url = "/api/users/" + userId + "/language-proficiency";
    if (language != null && !language.isEmpty()) {
      url += "?language=" + language;
    }

    return proxyRequest(url, HttpMethod.GET, null);
  }

  /**
   * Health check endpoint for the proxy service
   */
  @GetMapping("/health")
  public ResponseEntity<Object> healthCheck() {
    logger.info("Health check request received");

    try {
      // Forward request to Python service to check if it's alive
      ResponseEntity<Object> pythonResponse = proxyRequest("/health", HttpMethod.GET, null);
      logger.info("Python service health check response: {}", pythonResponse.getStatusCode());
      return pythonResponse;
    } catch (Exception e) {
      logger.error("Health check failed: {}", e.getMessage());

      Map<String, Object> response = new HashMap<>();
      response.put("status", "error");
      response.put("message", "Backend AI service is unavailable");

      return new ResponseEntity<>(response, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  /**
   * Generic method to proxy requests to the Python service
   */
  private ResponseEntity<Object> proxyRequest(String endpoint, HttpMethod method, Object body) {
    HttpHeaders headers = new HttpHeaders();
    headers.set("Content-Type", "application/json");

    HttpEntity<Object> httpEntity = new HttpEntity<>(body, headers);

    String url = speechServiceUrl + endpoint;
    logger.info("Proxying request to: {} with method: {}", url, method);

    try {
      // Forward the request to the Python server
      ResponseEntity<Object> response = restTemplate.exchange(url, method, httpEntity, Object.class);
      logger.info("Received response from Python service: {}", response.getStatusCode());
      return response;
    } catch (RestClientException e) {
      logger.error("Error proxying request to Python service: {}", e.getMessage());

      // Return a fallback response for better user experience
      Map<String, Object> errorResponse = new HashMap<>();
      errorResponse.put("status", "error");
      errorResponse.put("message", "The AI service is currently unavailable. Please try again later.");
      errorResponse.put("details", e.getMessage());

      return new ResponseEntity<>(errorResponse, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}