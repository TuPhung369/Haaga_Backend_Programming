package com.database.study.service;

import com.database.study.dto.LanguageInteractionDTO;
import com.database.study.dto.LanguageSessionDTO;
import com.database.study.dto.request.CreateLanguageSessionRequest;
import com.database.study.dto.request.ProcessAudioRequest;
import com.database.study.dto.request.SaveLanguageInteractionRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface LanguageAIService {

  /**
   * Create a new language practice session
   */
  LanguageSessionDTO createSession(CreateLanguageSessionRequest request);

  /**
   * Get sessions for a user
   */
  Page<LanguageSessionDTO> getUserSessions(String userId, Pageable pageable);

  /**
   * Get sessions for a user with a specific language
   */
  Page<LanguageSessionDTO> getUserSessionsByLanguage(String userId, String language, Pageable pageable);

  /**
   * Save a language interaction
   */
  LanguageInteractionDTO saveInteraction(SaveLanguageInteractionRequest request);

  /**
   * Get interactions for a session
   */
  Page<LanguageInteractionDTO> getSessionInteractions(String sessionId, Pageable pageable);

  /**
   * Process audio and generate AI response
   */
  String processAudio(ProcessAudioRequest request);
}