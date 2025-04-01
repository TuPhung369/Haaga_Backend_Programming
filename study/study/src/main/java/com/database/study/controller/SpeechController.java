package com.database.study.controller;

import com.database.study.dto.request.TextToSpeechRequest;
import com.database.study.dto.response.SpeechToTextResponse;
import com.database.study.dto.response.TextToSpeechResponse;
import com.database.study.service.SpeechService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/speech")
@RequiredArgsConstructor
@Slf4j
public class SpeechController {

  private final SpeechService speechService;

  /**
   * Convert speech to text
   * 
   * @param audioFile The audio file to transcribe
   * @param language  The language code (default: fi-FI)
   * @return The transcription result
   */
  @PostMapping(value = "/to-text", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<SpeechToTextResponse> speechToText(
      @RequestParam("audio") MultipartFile audioFile,
      @RequestParam(value = "language", defaultValue = "fi-FI") String language) {

    log.info("Received speech-to-text request, language: {}", language);
    SpeechToTextResponse response = speechService.convertSpeechToText(audioFile, language);
    return ResponseEntity.ok(response);
  }

  /**
   * Convert text to speech
   *
   * @param request The text to convert to speech
   * @return The base64 encoded audio data
   */
  @PostMapping("/to-speech")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<TextToSpeechResponse> textToSpeech(@RequestBody TextToSpeechRequest request) {
    log.info("Received text-to-speech request: {}, language: {}", request.getText(), request.getLanguage());
    TextToSpeechResponse response = speechService.convertTextToSpeech(request);
    return ResponseEntity.ok(response);
  }

  /**
   * Check if the speech service is healthy
   *
   * @return Status of the speech service
   */
  @GetMapping("/health")
  public ResponseEntity<String> healthCheck() {
    boolean isHealthy = speechService.isSpeechServiceHealthy();
    if (isHealthy) {
      return ResponseEntity.ok("Speech service is healthy");
    } else {
      return ResponseEntity.status(503).body("Speech service is unavailable");
    }
  }
}