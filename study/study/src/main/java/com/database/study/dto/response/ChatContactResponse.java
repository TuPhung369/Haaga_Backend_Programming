package com.database.study.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for chat contact responses
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatContactResponse {
    /**
     * Unique identifier for the contact
     */
    private String id;
    
    /**
     * Display name of the contact
     */
    private String name;
    
    /**
     * Email address of the contact
     */
    private String email;
    
    /**
     * Status of the contact (online, offline, away)
     */
    private String status;
    
    /**
     * Number of unread messages from this contact
     */
    private int unreadCount;
    
    /**
     * Last message exchanged with this contact
     */
    private String lastMessage;
    
    /**
     * Group categorization of the contact (Friend, College, Family, etc.)
     */
    private String group;
}