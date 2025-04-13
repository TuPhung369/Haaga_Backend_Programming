package com.database.study.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for chat message responses
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {
    /**
     * Unique identifier for the message
     */
    private String id;
    
    /**
     * The content of the message
     */
    private String content;
    
    /**
     * Information about the sender
     */
    private UserInfo sender;
    
    /**
     * Information about the receiver
     */
    private UserInfo receiver;
    
    /**
     * Timestamp of the message
     */
    private String timestamp;
    
    /**
     * Whether the message has been read
     */
    private boolean read;
    
    /**
     * Inner class for user information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        /**
         * User ID
         */
        private String id;
        
        /**
         * Display name (first name + last name or username)
         */
        private String name;
    }
}