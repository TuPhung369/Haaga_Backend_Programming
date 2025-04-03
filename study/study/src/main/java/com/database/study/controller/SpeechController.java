package com.database.study.controller;

import com.database.study.entity.LanguageMessage;
import com.database.study.enums.MessageType;
import com.database.study.enums.ProficiencyLevel;
import com.database.study.service.LanguageMessageService;
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
import lombok.RequiredArgsConstructor;

import java.io.IOException;
import java.util.*;

/**
 * Controller for Speech API services
 * This controller handles both text-to-speech and speech-to-text
 */
@RestController
@RequestMapping("/api/speech")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RequiredArgsConstructor
public class SpeechController {

  private static final Logger log = LoggerFactory.getLogger(SpeechController.class);

  private final LanguageMessageService languageMessageService;
  private final RestTemplate restTemplate;

  @Value("${speech.service.url:http://localhost:8008}")
  private String speechServiceUrl;

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
    log.info("Creating new language session with params: {}", request);

    try {
      // Set default userId and proficiencyLevel if not provided
      if (!request.containsKey("userId")) {
        request.put("userId", "guest");
        log.info("No userId provided, defaulting to 'guest'");
      }

      if (!request.containsKey("proficiencyLevel")) {
        request.put("proficiencyLevel", "intermediate");
        log.info("No proficiencyLevel provided, defaulting to 'intermediate'");
      }

      // Forward request to Python/AI service to create the session
      ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
          speechServiceUrl + "/api/language-sessions",
          HttpMethod.POST,
          new HttpEntity<>(request),
          new ParameterizedTypeReference<Map<String, Object>>() {
          });

      log.info("Session response received: {}", response.getBody());

      if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
        Map<String, Object> responseData = response.getBody();

        // Ensure consistent session ID format
        if (responseData != null) {
          Object sessionId = responseData.get("id");
          if (sessionId != null) {
            String sessionIdStr = sessionId.toString();

            // Save session to our new database model using LanguageMessageService
            try {
              // Extract fields from request
              String userId = request.get("userId").toString();
              String language = request.get("language").toString();
              String proficiencyLevelStr = request.get("proficiencyLevel").toString();
              ProficiencyLevel proficiencyLevel;

              try {
                proficiencyLevel = ProficiencyLevel.valueOf(proficiencyLevelStr.toUpperCase());
              } catch (IllegalArgumentException e) {
                log.warn("Invalid proficiency level: {}, defaulting to BEGINNER", proficiencyLevelStr);
                proficiencyLevel = ProficiencyLevel.BEGINNER;
              }

              // Create session metadata using our new LanguageMessage entity
              LanguageMessage sessionMessage = LanguageMessage.builder()
                  .userId(userId)
                  .language(language)
                  .proficiencyLevel(proficiencyLevel)
                  .messageType(MessageType.SYSTEM_MESSAGE)
                  .userMessage("Session created")
                  .isSessionMetadata(true)
                  .build();

              // Save the session using our new service
              languageMessageService.saveSessionMetadata(sessionMessage);
              log.info("Successfully saved session to database: {}", sessionIdStr);
            } catch (Exception e) {
              log.error("Failed to save session to database: {}", e.getMessage(), e);
              // Continue anyway, as we want to return the session to the frontend
            }

            // Ensure consistent format in the response
            if (!sessionIdStr.startsWith("session-")) {
              responseData.put("id", "session-" + sessionIdStr);
              log.info("Added 'session-' prefix to session ID in response: {}", responseData.get("id"));
            }
          }
        }

        return ResponseEntity.ok(responseData);
      } else {
        log.error("Failed to create language session. Status: {}", response.getStatusCode());
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", "Failed to create language session");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
      }
    } catch (Exception e) {
      log.error("Error creating language session", e);
      Map<String, String> errorResponse = new HashMap<>();
      errorResponse.put("error", "Error creating language session: " + e.getMessage());
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
  }
}