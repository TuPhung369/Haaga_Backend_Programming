package com.database.study.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    
    private UUID id;
    private UUID senderId;
    private String senderUsername;
    private UUID receiverId;
    private String receiverUsername;
    private String content;
    private LocalDateTime timestamp;
    private boolean read;
    private String conversationId;
}
