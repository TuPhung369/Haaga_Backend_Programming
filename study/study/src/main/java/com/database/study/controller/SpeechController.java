package com.database.study.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.ResourceAccessException;

import java.io.IOException;
import java.util.*;

/**
 * Controller for Speech API services
 * This controller handles both text-to-speech and speech-to-text
 */
@RestController
@RequestMapping("/api/speech")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class SpeechController {

  private static final Logger log = LoggerFactory.getLogger(SpeechController.class);

  private final RestTemplate restTemplate;

  @Value("${speech.service.url:http://localhost:8008}")
  private String speechServiceUrl;

  public SpeechController() {
    this.restTemplate = new RestTemplate();
  }

  /**
   * Health check endpoint
   */
  @GetMapping("/health")
  public ResponseEntity<Map<String, String>> healthCheck() {
    log.info("Checking Speech API health");
    Map<String, String> response = new HashMap<>();

    try {
      ResponseEntity<Map<String, Object>> serviceResponse = restTemplate.exchange(
          speechServiceUrl + "/health", HttpMethod.GET, null, ParameterizedTypeReference.forType(Map.class));

      if (serviceResponse.getStatusCode().is2xxSuccessful()) {
        response.put("status", "healthy");
        log.info("Speech API is healthy");
      } else {
        response.put("status", "unhealthy");
        log.warn("Speech API returned non-200 status: {}", serviceResponse.getStatusCode());
      }
    } catch (Exception e) {
      response.put("status", "unhealthy");
      response.put("error", e.getMessage());
      log.error("Error checking Speech API health: {}", e.getMessage());
    }

    return ResponseEntity.ok(response);
  }

  /**
   * Convert text to speech
   */
  @PostMapping("/text-to-speech")
  public ResponseEntity<?> textToSpeech(@RequestBody Map<String, String> request) {
    log.info("Text-to-speech request received for language: {}", request.get("language"));

    try {
      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);

      HttpEntity<Map<String, String>> entity = new HttpEntity<>(request, headers);

      ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
          speechServiceUrl + "/api/text-to-speech",
          HttpMethod.POST,
          entity,
          ParameterizedTypeReference.forType(Map.class));

      log.info("Text-to-speech response received with status: {}", response.getStatusCode());
      return ResponseEntity.ok(response.getBody());
    } catch (HttpClientErrorException e) {
      log.error("HTTP client error during text-to-speech: {}", e.getMessage());
      return ResponseEntity
          .status(e.getStatusCode())
          .body(Map.of("error", "Text-to-speech service error: " + e.getResponseBodyAsString()));
    } catch (Exception e) {
      log.error("Error during text-to-speech: {}", e.getMessage());
      return ResponseEntity
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("error", "Failed to convert text to speech: " + e.getMessage()));
    }
  }

  /**
   * Convert speech to text (accepts JSON)
   */
  @PostMapping("/speech-to-text")
  public ResponseEntity<?> speechToText(
      @RequestParam("file") MultipartFile file,
      @RequestParam(value = "language", defaultValue = "en-US") String language) {

    log.info("Speech-to-text request received for language: {}", language);

    try {
      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.MULTIPART_FORM_DATA);

      MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
      body.add("file", new ByteArrayResource(file.getBytes()) {
        @Override
        public String getFilename() {
          return file.getOriginalFilename() == null ? "audio.wav" : file.getOriginalFilename();
        }
      });
      body.add("language", language);

      HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

      ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
          speechServiceUrl + "/api/speech-to-text",
          HttpMethod.POST,
          requestEntity,
          ParameterizedTypeReference.forType(Map.class));

      log.info("Speech-to-text response received with status: {}", response.getStatusCode());
      return ResponseEntity.ok(response.getBody());
    } catch (IOException e) {
      log.error("IO error processing audio file: {}", e.getMessage());
      return ResponseEntity
          .status(HttpStatus.BAD_REQUEST)
          .body(Map.of("error", "Failed to process audio file: " + e.getMessage()));
    } catch (HttpClientErrorException e) {
      log.error("HTTP client error during speech-to-text: {}", e.getMessage());
      return ResponseEntity
          .status(e.getStatusCode())
          .body(Map.of("error", "Speech-to-text service error: " + e.getResponseBodyAsString()));
    } catch (Exception e) {
      log.error("Error during speech-to-text: {}", e.getMessage());
      return ResponseEntity
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("error", "Failed to convert speech to text: " + e.getMessage()));
    }
  }

  /**
   * Create a new language session by forwarding to the Python service
   * (Assumes Python service handles session creation)
   */
  @PostMapping("/language-sessions")
  public ResponseEntity<?> createLanguageSession(@RequestBody Map<String, Object> request) {
    log.info("Create language session request received: {}", request);
    try {
      // Create a new request map that includes the required fields
      Map<String, Object> enhancedRequest = new HashMap<>(request);

      // Add userId if not present (default to "guest")
      if (!enhancedRequest.containsKey("userId")) {
        enhancedRequest.put("userId", "guest");
        log.info("Added default userId 'guest' to request");
      }

      // Add proficiencyLevel if not present (default to "intermediate")
      if (!enhancedRequest.containsKey("proficiencyLevel")) {
        enhancedRequest.put("proficiencyLevel", "intermediate");
        log.info("Added default proficiencyLevel 'intermediate' to request");
      }

      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);
      HttpEntity<Map<String, Object>> entity = new HttpEntity<>(enhancedRequest, headers);

      // Forward to Python service endpoint (adjust path if needed)
      ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
          speechServiceUrl + "/api/language-sessions",
          HttpMethod.POST,
          entity,
          new ParameterizedTypeReference<Map<String, Object>>() {
          });

      log.info("Language session creation response from Python service: {}", response.getStatusCode());

      // Get the response body
      Map<String, Object> responseBody = response.getBody();

      // Ensure consistent session ID format (prefix with 'session-' if needed)
      if (responseBody != null && responseBody.containsKey("id")) {
        String sessionId = (String) responseBody.get("id");
        if (!sessionId.startsWith("session-")) {
          // Convert the session ID to a consistent format
          String formattedSessionId = "session-" + sessionId;
          log.info("Reformatting session ID from {} to {}", sessionId, formattedSessionId);
          responseBody.put("id", formattedSessionId);
        }
      }

      // Log the full response for debugging
      log.info("Final session creation response: {}", responseBody);

      return ResponseEntity.status(response.getStatusCode()).body(responseBody);
    } catch (HttpClientErrorException e) {
      log.error("HTTP client error creating language session: {}", e.getMessage());
      // Return the error response from the Python service if available
      return ResponseEntity
          .status(e.getStatusCode())
          .body(Map.of("error", "Failed to create session via speech service: " + e.getResponseBodyAsString()));
    } catch (ResourceAccessException e) {
      log.error("Cannot connect to speech service for session creation: {}", e.getMessage());
      // Generate a mock session response as fallback
      String sessionId = "session-" + UUID.randomUUID().toString();
      Map<String, Object> mockResponse = new HashMap<>();
      mockResponse.put("id", sessionId); // Use 'id' to match frontend model expectation
      mockResponse.put("language", request.get("language"));
      mockResponse.put("userId", "guest"); // Add placeholder userId
      mockResponse.put("createdAt", new Date());
      mockResponse.put("updatedAt", new Date());
      mockResponse.put("note", "Mock session created - speech service unavailable");
      log.warn("Returning mock session due to ResourceAccessException: {}", mockResponse);
      return ResponseEntity.ok(mockResponse);
    } catch (Exception e) {
      log.error("Unexpected error creating language session: {}", e.getMessage(), e);
      String sessionId = "session-error-" + UUID.randomUUID().toString();
      Map<String, Object> errorResponse = new HashMap<>();
      errorResponse.put("id", sessionId);
      errorResponse.put("error", "Unexpected error creating language session: " + e.getMessage());
      errorResponse.put("language", request.get("language"));
      errorResponse.put("userId", request.getOrDefault("userId", "guest"));
      errorResponse.put("createdAt", new Date());
      errorResponse.put("updatedAt", new Date());
      return ResponseEntity.ok(errorResponse); // Return 200 with error info in development
    }
  }
}