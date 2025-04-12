package com.database.study.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageRequest {
    
    @NotNull(message = "Receiver ID is required")
    private String receiverId;
    
    @NotBlank(message = "Message content cannot be empty")
    private String content;
    
    private String conversationId;
}
