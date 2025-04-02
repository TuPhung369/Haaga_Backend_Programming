package com.database.study.enums;

/**
 * Types of messages in the language practice system
 */
public enum MessageType {
  /**
   * Message from the user (text input)
   */
  USER_MESSAGE,

  /**
   * Response from the AI language tutor
   */
  AI_RESPONSE,

  /**
   * Assessment/feedback on user's language
   */
  AI_FEEDBACK,

  /**
   * System message (session creation, etc.)
   */
  SYSTEM_MESSAGE
}