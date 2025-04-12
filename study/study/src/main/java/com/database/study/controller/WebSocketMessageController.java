package com.database.study.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import com.database.study.dto.request.MessageRequest;
import com.database.study.dto.response.MessageResponse;
import com.database.study.service.MessageService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketMessageController {
    
    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;
    
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload MessageRequest messageRequest, Authentication authentication) {
        String senderId = authentication.getName();
        log.info("Received message via WebSocket from user {} to {}", senderId, messageRequest.getReceiverId());
        
        // Process and save the message
        MessageResponse response = messageService.sendMessage(senderId, messageRequest);
        
        // Send to the specific user
        messagingTemplate.convertAndSendToUser(
            messageRequest.getReceiverId(),
            "/queue/messages",
            response
        );
        
        // Also send back to sender for confirmation
        messagingTemplate.convertAndSendToUser(
            senderId,
            "/queue/messages",
            response
        );
    }
    
    @MessageMapping("/chat.typing")
    public void notifyTyping(@Payload TypingNotification notification, Authentication authentication) {
        String senderId = authentication.getName();
        log.debug("User {} is typing to user {}", senderId, notification.getReceiverId());
        
        // Add sender information
        notification.setSenderId(senderId);
        
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
