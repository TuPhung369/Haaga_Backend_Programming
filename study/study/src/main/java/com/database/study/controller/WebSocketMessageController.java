package com.database.study.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import com.database.study.dto.request.ChatMessageRequest;
import com.database.study.dto.response.ChatMessageResponse;
import com.database.study.service.ChatMessageService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketMessageController {
    
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageService messageService;
    
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessageRequest ChatMessageRequest, Authentication authentication) {
        String username = authentication.getName();
        log.info("Received message via WebSocket from user {} to {}", username, ChatMessageRequest.getReceiverId());
        log.info("Message content: {}", ChatMessageRequest.getContent());
        
        try {
            // Process and save the message
            log.info("Processing message with messageService.sendMessage");
            ChatMessageResponse response = messageService.sendMessage(username, ChatMessageRequest);
            log.info("Message processed and saved with ID: {}", response.getId());
            
            // Send to the specific user
            log.info("Sending message to receiver: {}", ChatMessageRequest.getReceiverId());
            messagingTemplate.convertAndSendToUser(
                ChatMessageRequest.getReceiverId(),
                "/queue/messages",
                response
            );
            log.info("Message sent to receiver successfully");
            
            // Also send back to sender for confirmation
            log.info("Sending confirmation back to sender: {}", username);
            messagingTemplate.convertAndSendToUser(
                username,
                "/queue/messages",
                response
            );
            log.info("Confirmation sent to sender successfully");
        } catch (Exception e) {
            log.error("Error processing WebSocket message", e);
            // You might want to send an error response back to the client
        }
    }
    
    @MessageMapping("/chat.typing")
    public void notifyTyping(@Payload TypingNotification notification, Authentication authentication) {
        String username = authentication.getName();
        log.debug("User {} is typing to user {}", username, notification.getReceiverId());
        
        // Add sender information
        notification.setSenderId(username);
        
        // Send typing notification to the recipient
        messagingTemplate.convertAndSendToUser(
            notification.getReceiverId(),
            "/queue/typing",
            notification
        );
    }
    
    // Inner class for typing notifications
    public static class TypingNotification {
        private String senderId;
        private String receiverId;
        private boolean typing;
        
        public String getSenderId() {
            return senderId;
        }
        
        public void setSenderId(String senderId) {
            this.senderId = senderId;
        }
        
        public String getReceiverId() {
            return receiverId;
        }
        
        public void setReceiverId(String receiverId) {
            this.receiverId = receiverId;
        }
        
        public boolean isTyping() {
            return typing;
        }
        
        public void setTyping(boolean typing) {
            this.typing = typing;
        }
    }
}
