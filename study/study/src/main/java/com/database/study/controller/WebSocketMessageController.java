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
        log.info("Message persistence: {}", ChatMessageRequest.getPersistent());
        
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
    
    @MessageMapping("/chat.markAsRead")
    public void markMessagesAsRead(@Payload ReadStatusRequest request, Authentication authentication) {
        String username = authentication.getName();
        log.info("Marking messages as read via WebSocket for user {} from contact {}", username, request.getContactId());
        
        try {
            // Call the service to mark messages as read
            messageService.markMessagesAsRead(username, request.getContactId());
            log.info("Messages marked as read successfully");
            
            // Send confirmation back to the sender
            messagingTemplate.convertAndSendToUser(
                username,
                "/queue/read-receipts",
                new ReadStatusResponse(request.getContactId(), true)
            );
            
            // Notify the other user that their messages have been read
            messagingTemplate.convertAndSendToUser(
                request.getContactId(),
                "/queue/read-receipts",
                new ReadStatusResponse(username, true)
            );
        } catch (Exception e) {
            log.error("Error marking messages as read via WebSocket", e);
            // Send error response back to the client
            messagingTemplate.convertAndSendToUser(
                username,
                "/queue/read-receipts",
                new ReadStatusResponse(request.getContactId(), false)
            );
        }
    }
    
    /**
     * Send a contact request notification via WebSocket
     * This method is not mapped to a client message, but is called from the ChatContactController
     * when a new contact request is created
     * 
     * @param senderId The ID of the user sending the contact request
     * @param receiverId The ID of the user receiving the contact request
     * @param senderName The name of the user sending the contact request
     */
    public void sendContactRequestNotification(String senderId, String receiverId, String senderName) {
        log.info("Sending contact request notification from {} to {}", senderId, receiverId);
        
        try {
            // Create a notification object
            ContactRequestNotification notification = new ContactRequestNotification();
            notification.setSenderId(senderId);
            notification.setSenderName(senderName);
            notification.setTimestamp(System.currentTimeMillis());
            
            // Send to the recipient
            messagingTemplate.convertAndSendToUser(
                receiverId,
                "/queue/contact-requests",
                notification
            );
            
            log.info("Contact request notification sent successfully to {}", receiverId);
        } catch (Exception e) {
            log.error("Error sending contact request notification", e);
        }
    }
    
    /**
     * Send a contact request response notification via WebSocket
     * This method is called from the ChatContactController when a contact request is accepted or rejected
     * 
     * @param requesterId The ID of the user who sent the original request
     * @param responderId The ID of the user who responded to the request
     * @param responderName The name of the user who responded to the request
     * @param accepted Whether the request was accepted or rejected
     */
    public void sendContactResponseNotification(String requesterId, String responderId, String responderName, boolean accepted) {
        log.info("Sending contact response notification from {} to {}, accepted: {}", responderId, requesterId, accepted);
        
        try {
            // Create a notification object
            ContactResponseNotification notification = new ContactResponseNotification();
            notification.setResponderId(responderId);
            notification.setResponderName(responderName);
            notification.setAccepted(accepted);
            notification.setTimestamp(System.currentTimeMillis());
            
            // Send to the original requester
            messagingTemplate.convertAndSendToUser(
                requesterId,
                "/queue/contact-responses",
                notification
            );
            
            log.info("Contact response notification sent successfully to {}", requesterId);
        } catch (Exception e) {
            log.error("Error sending contact response notification", e);
        }
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
    
    // Inner class for read status requests
    public static class ReadStatusRequest {
        private String contactId;
        
        public ReadStatusRequest() {
            // Default constructor for JSON deserialization
        }
        
        public ReadStatusRequest(String contactId) {
            this.contactId = contactId;
        }
        
        public String getContactId() {
            return contactId;
        }
        
        public void setContactId(String contactId) {
            this.contactId = contactId;
        }
    }
    
    // Inner class for read status responses
    public static class ReadStatusResponse {
        private String contactId;
        private boolean success;
        
        public ReadStatusResponse() {
            // Default constructor for JSON serialization
        }
        
        public ReadStatusResponse(String contactId, boolean success) {
            this.contactId = contactId;
            this.success = success;
        }
        
        public String getContactId() {
            return contactId;
        }
        
        public void setContactId(String contactId) {
            this.contactId = contactId;
        }
        
        public boolean isSuccess() {
            return success;
        }
        
        public void setSuccess(boolean success) {
            this.success = success;
        }
    }
    
    // Inner class for contact request notifications
    public static class ContactRequestNotification {
        private String senderId;
        private String senderName;
        private long timestamp;
        
        public ContactRequestNotification() {
            // Default constructor for JSON serialization
        }
        
        public String getSenderId() {
            return senderId;
        }
        
        public void setSenderId(String senderId) {
            this.senderId = senderId;
        }
        
        public String getSenderName() {
            return senderName;
        }
        
        public void setSenderName(String senderName) {
            this.senderName = senderName;
        }
        
        public long getTimestamp() {
            return timestamp;
        }
        
        public void setTimestamp(long timestamp) {
            this.timestamp = timestamp;
        }
    }
    
    // Inner class for contact response notifications
    public static class ContactResponseNotification {
        private String responderId;
        private String responderName;
        private boolean accepted;
        private long timestamp;
        
        public ContactResponseNotification() {
            // Default constructor for JSON serialization
        }
        
        public String getResponderId() {
            return responderId;
        }
        
        public void setResponderId(String responderId) {
            this.responderId = responderId;
        }
        
        public String getResponderName() {
            return responderName;
        }
        
        public void setResponderName(String responderName) {
            this.responderName = responderName;
        }
        
        public boolean isAccepted() {
            return accepted;
        }
        
        public void setAccepted(boolean accepted) {
            this.accepted = accepted;
        }
        
        public long getTimestamp() {
            return timestamp;
        }
        
        public void setTimestamp(long timestamp) {
            this.timestamp = timestamp;
        }
    }
}
