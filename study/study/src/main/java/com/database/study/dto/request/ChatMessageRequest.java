package com.database.study.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for chat message requests
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageRequest {
    /**
     * The content of the message
     */
    private String content;

    /**
     * The ID of the message recipient
     */
    private String receiverId;

    /**
     * The ID of the group (for group messages)
     */
    private String groupId;

    /**
     * Whether this message should be stored permanently in the database
     * Default is true
     */
    @Builder.Default
    private Boolean persistent = true;
    
    // Override the getPersistent method to ensure it always returns a boolean
    public Boolean getPersistent() {
        // If persistent is null, return true (default)
        if (this.persistent == null) {
            System.out.println("PERSISTENT DEBUG - getPersistent returning default true for null value");
            return true;
        }
        // Otherwise return the boolean value
        System.out.println("PERSISTENT DEBUG - getPersistent returning: " + this.persistent);
        return this.persistent;
    }

    // Override the setPersistent method to add debug logging and ensure boolean conversion
    public void setPersistent(Boolean persistent) {
        System.out.println("PERSISTENT DEBUG - ChatMessageRequest.setPersistent called with: " + persistent +
                " (type: " + (persistent != null ? persistent.getClass().getName() : "null") + ")");
        
        // Convert to boolean explicitly
        if (persistent == null) {
            this.persistent = true; // Default to true if null
        } else {
            // For Boolean or other types, convert to boolean primitive
            this.persistent = Boolean.TRUE.equals(persistent);
            System.out.println("PERSISTENT DEBUG - Converted to boolean primitive: " + this.persistent);
        }
    }
}