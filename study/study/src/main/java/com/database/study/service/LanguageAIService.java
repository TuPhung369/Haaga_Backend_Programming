package com.database.study.service;

import com.database.study.dto.LanguageMessageDTO;
import com.database.study.dto.request.CreateLanguageSessionRequest;
import com.database.study.dto.request.ProcessAudioRequest;
import com.database.study.dto.request.SaveLanguageInteractionRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface LanguageAIService {

  /**
   * Create a new language practice session
   */
  LanguageMessageDTO createSession(CreateLanguageSessionRequest request);

  /**
   * Get sessions for a user
   */
  Page<LanguageMessageDTO> getUserSessions(String userId, Pageable pageable);

  /**
   * Get sessions for a user with a specific language
   */
  Page<LanguageMessageDTO> getUserSessionsByLanguage(String userId, String language, Pageable pageable);

  /**
   * Save a language interaction
   */
  LanguageMessageDTO saveInteraction(SaveLanguageInteractionRequest request);

  /**
   * Get interactions for a session
   */
  Page<LanguageMessageDTO> getSessionInteractions(String sessionId, Pageable pageable);

  /**
   * Process audio and generate AI response
   */
  String processAudio(ProcessAudioRequest request);
}