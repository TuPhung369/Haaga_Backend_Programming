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
   * Create a new language practice session (metadata)
   * Now uses userId and language as context identifiers
   */
  LanguageMessageDTO createSession(CreateSessionRequest request);

  /**
   * Get all languages a user has interacted with
   * Returns a list of language codes
   */
  List<String> getUserSessions(String userId);

  /**
   * Get all messages for a user and language
   * The sessionId parameter may contain userId and language information
   */
  Page<LanguageMessageDTO> getSessionMessages(String sessionId, Pageable pageable);

  /**
   * Save a user message and generate AI response
   * Extracts language from sessionId if available
   */
  LanguageMessageDTO saveUserMessage(SaveMessageRequest request);

  /**
   * Check if a session exists
   * Parses sessionId to extract userId and language
   */
  boolean sessionExists(String sessionId);

  /**
   * Get session metadata
   * Parses sessionId to extract userId and language
   */
  LanguageMessageDTO getSessionMetadata(String sessionId);

  /**
   * Save session metadata message
   * Uses userId and language from the provided message
   */
  LanguageMessageDTO saveSessionMetadata(LanguageMessage sessionMessage);
}