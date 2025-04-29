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
     * Information about the receiver (null for group messages)
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
     * Whether this message is stored permanently in the database
     */
    private boolean persistent;
    
    /**
     * Group ID (for group messages)
     */
    private String groupId;
    
    /**
     * Group name (for group messages)
     */
    private String groupName;
    
    /**
     * Custom setter for receiver that ensures it's null when groupId is set
     * This provides an additional safeguard to ensure group messages never have a receiver
     */
    public void setReceiver(UserInfo receiver) {
        // If this is a group message (has a groupId), ensure receiver is null
        if (this.groupId != null) {
            this.receiver = null;
            System.out.println("Forced receiver to null because this is a group message (groupId: " + this.groupId + ")");
        } else {
            this.receiver = receiver;
        }
    }
    
    /**
     * Custom setter for groupId that ensures receiver is null when groupId is set
     * This provides an additional safeguard to ensure group messages never have a receiver
     */
    public void setGroupId(String groupId) {
        this.groupId = groupId;
        // If setting a group ID, ensure receiver is null
        if (groupId != null) {
            this.receiver = null;
            System.out.println("Set receiver to null because groupId was set to: " + groupId);
        }
    }
    
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