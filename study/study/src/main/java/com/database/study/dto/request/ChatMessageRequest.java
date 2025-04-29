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
}