package com.database.study.service;

import com.database.study.dto.LanguageMessageDTO;
import com.database.study.dto.request.CreateLanguageSessionRequest;
import com.database.study.dto.request.SaveLanguageInteractionRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface LanguageAIService {

  /**
   * Create or retrieve session metadata for a user and language.
   * This now represents the start of a conversation context for a specific
   * language.
   */
  LanguageMessageDTO ensureSessionMetadata(CreateLanguageSessionRequest request);

  /**
   * Get conversation history (messages) for a user and language.
   */
  Page<LanguageMessageDTO> getUserConversationHistory(String userId, String language, Pageable pageable);

  /**
   * Save a language interaction (both user message and AI response).
   * This will likely save two LanguageMessage entries.
   */
  LanguageMessageDTO saveInteraction(SaveLanguageInteractionRequest request);

  /**
   * Get all unique languages a user has interacted with.
   * (Replaces getUserSessions)
   */
  Page<LanguageMessageDTO> getUserLanguages(String userId, Pageable pageable);

  /**
   * Get message sessions for a user.
   * This method retrieves session metadata messages for a specific user.
   * 
   * @param userId The ID of the user
   * @param limit  The maximum number of messages to return
   * @return A list of language message DTOs
   */
  List<LanguageMessageDTO> getUserMessageSessions(String userId, int limit);

  // Consider if processAudio needs changes - it might now depend on userId and
  // language
  // instead of sessionId.
  // String processAudio(ProcessAudioRequest request);
}