package com.database.study.service;

import com.database.study.dto.request.TextToSpeechRequest;
import com.database.study.dto.response.SpeechToTextResponse;
import com.database.study.dto.response.TextToSpeechResponse;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
@Slf4j
public class SpeechService {

  private final RestTemplate restTemplate;

  @Value("${speech.service.url:http://localhost:8008}")
  private String speechServiceUrl;

  /**
   * Convert speech audio file to text using SpeechBrain service
   *
   * @param audioFile The audio file to transcribe
   * @param language  The language code (e.g., "fi-FI")
   * @return The transcription result
   */
  public SpeechToTextResponse convertSpeechToText(MultipartFile audioFile, String language) {
    log.info("Converting speech to text, language: {}", language);
    try {
      // Create multipart request
      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.MULTIPART_FORM_DATA);

      MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
      body.add("file", createByteArrayResource(audioFile));
      body.add("language", language);

      HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

      // Make API call
      ResponseEntity<SpeechToTextResponse> response = restTemplate.exchange(
          speechServiceUrl + "/api/speech-to-text",
          HttpMethod.POST,
          requestEntity,
          SpeechToTextResponse.class);

      if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
        log.info("Successfully converted speech to text: {}");
        return response.getBody();
      } else {
        log.error("Failed to convert speech to text. Response status: {}", response.getStatusCode());
        throw new AppException(ErrorCode.EXTERNAL_API_ERROR, "Speech-to-text conversion failed");
      }
    } catch (RestClientException e) {
      log.error("Error calling speech-to-text API", e);
      throw new AppException(ErrorCode.EXTERNAL_API_ERROR, "Error calling speech-to-text API: " + e.getMessage());
    } catch (IOException e) {
      log.error("Error processing audio file", e);
      throw new AppException(ErrorCode.INVALID_REQUEST, "Error processing audio file: " + e.getMessage());
    }
  }

  /**
   * Convert text to speech audio using SpeechBrain service
   *
   * @param request The request containing text and language
   * @return The base64 encoded audio data
   */
  public TextToSpeechResponse convertTextToSpeech(TextToSpeechRequest request) {
    log.info("Converting text to speech: '{}', language: {}", request.getText(), request.getLanguage());
    try {
      // Create request
      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);

      HttpEntity<TextToSpeechRequest> requestEntity = new HttpEntity<>(request, headers);

      // Make API call
      ResponseEntity<TextToSpeechResponse> response = restTemplate.exchange(
          speechServiceUrl + "/api/text-to-speech",
          HttpMethod.POST,
          requestEntity,
          TextToSpeechResponse.class);

      if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
        log.info("Successfully converted text to speech");
        return response.getBody();
      } else {
        log.error("Failed to convert text to speech. Response status: {}", response.getStatusCode());
        throw new AppException(ErrorCode.EXTERNAL_API_ERROR, "Text-to-speech conversion failed");
      }
    } catch (RestClientException e) {
      log.error("Error calling text-to-speech API", e);
      throw new AppException(ErrorCode.EXTERNAL_API_ERROR, "Error calling text-to-speech API: " + e.getMessage());
    }
  }

  /**
   * Check if the SpeechBrain service is healthy
   *
   * @return true if the service is healthy, false otherwise
   */
  public boolean isSpeechServiceHealthy() {
    try {
      ResponseEntity<String> response = restTemplate.getForEntity(
          speechServiceUrl + "/health",
          String.class);
      return response.getStatusCode() == HttpStatus.OK;
    } catch (Exception e) {
      log.error("Error checking speech service health", e);
      return false;
    }
  }

  private ByteArrayResource createByteArrayResource(MultipartFile file) throws IOException {
    return new ByteArrayResource(file.getBytes()) {
      @Override
      public String getFilename() {
        return file.getOriginalFilename();
      }
    };
  }
}