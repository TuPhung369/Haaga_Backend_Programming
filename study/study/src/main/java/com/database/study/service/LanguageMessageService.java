package com.database.study.service;

import com.database.study.dto.LanguageMessageDTO;
import com.database.study.dto.request.CreateSessionRequest;
import com.database.study.dto.request.SaveMessageRequest;
import com.database.study.entity.LanguageMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Service for handling language practice messaging
 */
public interface LanguageMessageService {

  /**
   * Create a new language practice session
   */
  LanguageMessageDTO createSession(CreateSessionRequest request);

  /**
   * Get all sessions for a user
   */
  List<String> getUserSessions(String userId);

  /**
   * Get all messages in a session
   */
  Page<LanguageMessageDTO> getSessionMessages(String sessionId, Pageable pageable);

  /**
   * Save a user message and generate AI response
   */
  LanguageMessageDTO saveUserMessage(SaveMessageRequest request);

  /**
   * Check if a session exists
   */
  boolean sessionExists(String sessionId);

  /**
   * Get session metadata
   */
  LanguageMessageDTO getSessionMetadata(String sessionId);

  /**
   * Save session metadata message
   */
  LanguageMessageDTO saveSessionMetadata(LanguageMessage sessionMessage);
}