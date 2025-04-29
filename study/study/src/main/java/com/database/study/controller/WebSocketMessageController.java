package com.database.study.controller;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import com.database.study.dto.request.ChatMessageRequest;
import com.database.study.dto.response.ChatMessageResponse;
import com.database.study.entity.ChatMessage;
import com.database.study.entity.User;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.repository.ChatMessageRepository;
import com.database.study.repository.UserRepository;
import com.database.study.service.ChatMessageService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketMessageController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageService messageService;
    private final UserRepository userRepository;
    private final ChatMessageRepository messageRepository;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessageRequest ChatMessageRequest, Authentication authentication) {
        // Check if authentication is null
        if (authentication == null) {
            log.error("Authentication is null in sendMessage. Cannot process request.");
            return;
        }

        String username = authentication.getName();

        // Check if this is an anonymous user
        if ("anonymous".equals(username)) {
            log.warn("Anonymous user attempted to send a message. Cannot process request.");
            return;
        }

        log.info("Received message via WebSocket from user {} to {}", username, ChatMessageRequest.getReceiverId());
        log.info("Message content: {}", ChatMessageRequest.getContent());
        log.info("Message persistence: {}", ChatMessageRequest.getPersistent());

        try {
            // Process and save the message
            log.info("Processing message with messageService.sendMessage");
            ChatMessageResponse response = messageService.sendMessage(username, ChatMessageRequest);
            log.info("Message processed and saved with ID: {}", response.getId());

            // Find the receiver user to get their ID
            User receiver = userRepository.findById(UUID.fromString(ChatMessageRequest.getReceiverId()))
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            // Send to the specific user using their ID
            log.info("Sending message to receiver ID: {}", receiver.getId());
            messagingTemplate.convertAndSendToUser(
                    receiver.getId().toString(),
                    "/queue/messages",
                    response);
            log.info("Message sent to receiver successfully");

            // Find the sender user to get their ID
            User sender = userRepository.findByUsername(username)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            // Also send back to sender for confirmation using their ID
            log.info("Sending confirmation back to sender ID: {}", sender.getId());
            messagingTemplate.convertAndSendToUser(
                    sender.getId().toString(),
                    "/queue/messages",
                    response);
            log.info("Confirmation sent to sender successfully");
        } catch (AppException e) {
            log.error("Application error processing WebSocket message: {}", e.getMessage(), e);
            // You might want to send an error response back to the client
        } catch (IllegalArgumentException e) {
            log.error("Invalid UUID format in WebSocket message: {}", e.getMessage(), e);
            // Handle invalid UUID format
        } catch (MessagingException e) {
            log.error("Messaging error processing WebSocket message: {}", e.getMessage(), e);
            // Handle messaging errors
        } catch (RuntimeException e) {
            log.error("Runtime error processing WebSocket message: {}", e.getMessage(), e);
            // Handle runtime errors
        } catch (Exception e) {
            log.error("Unexpected error processing WebSocket message", e);
            // Handle other unexpected errors
        }
    }

    @MessageMapping("/chat.typing")
    public void notifyTyping(@Payload TypingNotification notification, Authentication authentication) {
        // Check if authentication is null
        if (authentication == null) {
            log.error("Authentication is null in notifyTyping. Cannot process request.");
            return;
        }

        String username = authentication.getName();

        // Check if this is an anonymous user
        if ("anonymous".equals(username)) {
            log.warn("Anonymous user attempted to send typing notification. Cannot process request.");
            return;
        }

        log.debug("User {} is typing to user {}", username, notification.getReceiverId());

        try {
            // Find the sender by username
            User sender = userRepository.findByUsername(username)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            // Find the receiver by UUID
            User receiver = userRepository.findById(UUID.fromString(notification.getReceiverId()))
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            // Add sender information
            notification.setSenderId(sender.getId().toString());

            // Send typing notification to the recipient using their ID
            messagingTemplate.convertAndSendToUser(
                    receiver.getId().toString(),
                    "/queue/typing",
                    notification);
            log.debug("Typing notification sent to receiver ID: {}", receiver.getId());
        } catch (AppException e) {
            log.error("Application error sending typing notification: {}", e.getMessage(), e);
        } catch (IllegalArgumentException e) {
            log.error("Invalid UUID format in typing notification: {}", e.getMessage(), e);
        } catch (MessagingException e) {
            log.error("Messaging error sending typing notification: {}", e.getMessage(), e);
        } catch (RuntimeException e) {
            log.error("Runtime error sending typing notification: {}", e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error sending typing notification", e);
        }
    }

    @MessageMapping("/chat.edit")
    public void editMessage(@Payload EditMessageRequest request, Authentication authentication) {
        // Check if authentication is null
        if (authentication == null) {
            log.error("Authentication is null in editMessage. Cannot process request.");
            return;
        }

        String username = authentication.getName();

        // Check if this is an anonymous user
        if ("anonymous".equals(username)) {
            log.warn("Anonymous user attempted to edit a message. Cannot process request.");
            return;
        }

        log.info("Editing message via WebSocket for user {}, message ID: {}", username, request.getMessageId());
        log.info("New content: {}", request.getContent());

        try {
            // Find the user by username
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
            log.info("Found user: {}", user.getId());

            // Call the service to edit the message
            UUID messageId = UUID.fromString(request.getMessageId());
            ChatMessageResponse response = messageService.editMessage(user.getId().toString(), messageId,
                    request.getContent());
            log.info("Message edited successfully, ID: {}", response.getId());

        } catch (AppException e) {
            log.error("Application error editing message: {}", e.getMessage(), e);
        } catch (IllegalArgumentException e) {
            log.error("Invalid UUID format in edit message request: {}", e.getMessage(), e);
        } catch (MessagingException e) {
            log.error("Messaging error editing message: {}", e.getMessage(), e);
        } catch (RuntimeException e) {
            log.error("Runtime error editing message: {}", e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error editing message via WebSocket", e);
        }
    }

    @MessageMapping("/chat.markAsRead")
    public ReadStatusResponse markMessagesAsRead(@Payload ReadStatusRequest request, Authentication authentication) {
        // Check if authentication is null
        if (authentication == null) {
            log.error("Authentication is null in markMessagesAsRead. Cannot process request.");
            return new ReadStatusResponse(request.getContactId(), false, request.getMessageId());
        }

        String username = authentication.getName();

        // Check if this is an anonymous user
        if ("anonymous".equals(username)) {
            log.warn("Anonymous user attempted to mark messages as read. Cannot process request.");
            return new ReadStatusResponse(request.getContactId(), false, request.getMessageId());
        }

        log.info("Marking messages as read via WebSocket for user {} from contact {}", username,
                request.getContactId());
        log.info("Raw request payload: {}", request);

        try {
            // Find the user by username
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
            log.info("Found user: {}", user.getId());

            // Find the contact user by ID
            User contact = userRepository.findById(UUID.fromString(request.getContactId()))
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
            log.info("Found contact: {}", contact.getId());

            // Generate the conversation ID
            String conversationId = user.getId().compareTo(contact.getId()) < 0
                    ? user.getId() + "_" + contact.getId()
                    : contact.getId() + "_" + user.getId();
            log.info("Using conversation ID: {}", conversationId);

            // Call the service to mark messages as read
            log.info("Calling messageService.markMessagesAsRead for user {} and conversation {}", username,
                    conversationId);
            messageService.markMessagesAsRead(username, conversationId);
            log.info("Messages marked as read successfully");

            // Verify that messages were marked as read
            Page<ChatMessage> messages = messageRepository.findByConversationIdOrderByTimestampDesc(conversationId,
                    Pageable.unpaged());
            int unreadCount = 0;
            for (ChatMessage message : messages) {
                if (message.getReceiver().equals(user) && !message.isRead()) {
                    unreadCount++;
                    log.warn("Message {} is still unread after marking as read", message.getId());
                }
            }
            log.info("After marking as read, there are {} unread messages for user {} in conversation {}",
                    unreadCount, username, conversationId);

            // Send confirmation back to the sender using their ID
            ReadStatusResponse senderResponse = new ReadStatusResponse(request.getContactId(), true,
                    request.getMessageId());
            log.info("Sending read receipt confirmation to sender ID: {}, response: {}", user.getId(), senderResponse);
            messagingTemplate.convertAndSendToUser(
                    user.getId().toString(),
                    "/queue/read-receipts",
                    senderResponse);
            log.info("Sent read receipt confirmation to sender ID: {}", user.getId());

            // Also send to the special acknowledgement queue
            log.info("Sending read receipt acknowledgement to sender ID: {}, response: {}", user.getId(),
                    senderResponse);
            messagingTemplate.convertAndSendToUser(
                    user.getId().toString(),
                    "/queue/read-receipts-ack",
                    senderResponse);
            log.info("Sent read receipt acknowledgement to sender ID: {}", user.getId());

            // Notify the other user that their messages have been read using their ID
            ReadStatusResponse receiverResponse = new ReadStatusResponse(user.getId().toString(), true,
                    request.getMessageId());
            log.info("Sending read receipt notification to receiver ID: {}, response: {}", contact.getId(),
                    receiverResponse);
            messagingTemplate.convertAndSendToUser(
                    contact.getId().toString(),
                    "/queue/read-receipts",
                    receiverResponse);
            log.info("Sent read receipt notification to receiver ID: {}", contact.getId());

            // Return a response to the client to acknowledge receipt
            return senderResponse;
        } catch (AppException e) {
            log.error("Application error marking messages as read: {}", e.getMessage(), e);
            return sendErrorResponse(username, request, "Application error");
        } catch (IllegalArgumentException e) {
            log.error("Invalid UUID format in read status request: {}", e.getMessage(), e);
            return sendErrorResponse(username, request, "Invalid format");
        } catch (MessagingException e) {
            log.error("Messaging error marking messages as read: {}", e.getMessage(), e);
            return sendErrorResponse(username, request, "Messaging error");
        } catch (RuntimeException e) {
            log.error("Runtime error marking messages as read: {}", e.getMessage(), e);
            return sendErrorResponse(username, request, "Runtime error");
        } catch (Exception e) {
            log.error("Unexpected error marking messages as read via WebSocket", e);
            return sendErrorResponse(username, request, "Unexpected error");
        }
    }

    /**
     * Helper method to send error response back to the client
     * 
     * @param username     The username of the user
     * @param request      The original request
     * @param errorMessage The error message to log
     * @return The error response
     */
    private ReadStatusResponse sendErrorResponse(String username, ReadStatusRequest request, String errorMessage) {
        try {
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
            ReadStatusResponse errorResponse = new ReadStatusResponse(request.getContactId(), false,
                    request.getMessageId());
            log.info("Sending error response to user ID: {}, error: {}, response: {}", user.getId(), errorMessage,
                    errorResponse);
            messagingTemplate.convertAndSendToUser(
                    user.getId().toString(),
                    "/queue/read-receipts",
                    errorResponse);
            log.info("Sent error response to user ID: {}", user.getId());

            // Also send to the special acknowledgement queue
            log.info("Sending error acknowledgement to user ID: {}, response: {}", user.getId(), errorResponse);
            messagingTemplate.convertAndSendToUser(
                    user.getId().toString(),
                    "/queue/read-receipts-ack",
                    errorResponse);
            log.info("Sent error acknowledgement to user ID: {}", user.getId());

            // Return the error response
            return errorResponse;
        } catch (AppException ex) {
            log.error("Error finding user while sending error response: {}", ex.getMessage(), ex);
            return new ReadStatusResponse(request.getContactId(), false, request.getMessageId());
        } catch (MessagingException ex) {
            log.error("Messaging error while sending error response: {}", ex.getMessage(), ex);
            return new ReadStatusResponse(request.getContactId(), false, request.getMessageId());
        } catch (RuntimeException ex) {
            log.error("Runtime error while sending error response: {}", ex.getMessage(), ex);
            return new ReadStatusResponse(request.getContactId(), false, request.getMessageId());
        } catch (Exception ex) {
            log.error("Unexpected error sending error response", ex);
            return new ReadStatusResponse(request.getContactId(), false, request.getMessageId());
        }
    }

    /**
     * Send a contact request notification via WebSocket
     * This method is not mapped to a client message, but is called from the
     * ChatContactController
     * when a new contact request is created
     * 
     * @param senderId   The ID of the user sending the contact request
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

            // Find the receiver user to get their ID (receiverId is already a UUID string)
            // No need to convert it, just use it directly

            // Send to the recipient using their ID
            messagingTemplate.convertAndSendToUser(
                    receiverId,
                    "/queue/contact-requests",
                    notification);

            log.info("Contact request notification sent successfully to ID: {}", receiverId);
        } catch (IllegalArgumentException e) {
            log.error("Invalid format in contact request notification: {}", e.getMessage(), e);
        } catch (org.springframework.messaging.MessagingException e) {
            log.error("Messaging error sending contact request notification: {}", e.getMessage(), e);
        } catch (RuntimeException e) {
            log.error("Runtime error sending contact request notification: {}", e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error sending contact request notification", e);
        }
    }

    /**
     * Send a contact request response notification via WebSocket
     * This method is called from the ChatContactController when a contact request
     * is accepted or rejected
     * 
     * @param requesterId   The ID of the user who sent the original request
     * @param responderId   The ID of the user who responded to the request
     * @param responderName The name of the user who responded to the request
     * @param accepted      Whether the request was accepted or rejected
     */
    public void sendContactResponseNotification(String requesterId, String responderId, String responderName,
            boolean accepted) {
        log.info("Sending contact response notification from {} to {}, accepted: {}", responderId, requesterId,
                accepted);

        try {
            // Create a notification object
            ContactResponseNotification notification = new ContactResponseNotification();
            notification.setResponderId(responderId);
            notification.setResponderName(responderName);
            notification.setAccepted(accepted);
            notification.setTimestamp(System.currentTimeMillis());

            // Find the requester user to get their ID (requesterId is already a UUID
            // string)
            // No need to convert it, just use it directly

            // Send to the original requester using their ID
            messagingTemplate.convertAndSendToUser(
                    requesterId,
                    "/queue/contact-responses",
                    notification);

            log.info("Contact response notification sent successfully to ID: {}", requesterId);
        } catch (IllegalArgumentException e) {
            log.error("Invalid format in contact response notification: {}", e.getMessage(), e);
        } catch (org.springframework.messaging.MessagingException e) {
            log.error("Messaging error sending contact response notification: {}", e.getMessage(), e);
        } catch (RuntimeException e) {
            log.error("Runtime error sending contact response notification: {}", e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error sending contact response notification", e);
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
        private String messageId;

        public ReadStatusRequest() {
            // Default constructor for JSON deserialization
        }

        public ReadStatusRequest(String contactId) {
            this.contactId = contactId;
        }

        public ReadStatusRequest(String contactId, String messageId) {
            this.contactId = contactId;
            this.messageId = messageId;
        }

        public String getContactId() {
            return contactId;
        }

        public void setContactId(String contactId) {
            this.contactId = contactId;
        }

        public String getMessageId() {
            return messageId;
        }

        public void setMessageId(String messageId) {
            this.messageId = messageId;
        }

        @Override
        public String toString() {
            return "ReadStatusRequest{" +
                    "contactId='" + contactId + '\'' +
                    ", messageId='" + messageId + '\'' +
                    '}';
        }
    }

    // Inner class for read status responses
    public static class ReadStatusResponse {
        private String contactId;
        private boolean success;
        private String messageId;

        public ReadStatusResponse() {
            // Default constructor for JSON serialization
        }

        public ReadStatusResponse(String contactId, boolean success) {
            this.contactId = contactId;
            this.success = success;
        }

        public ReadStatusResponse(String contactId, boolean success, String messageId) {
            this.contactId = contactId;
            this.success = success;
            this.messageId = messageId;
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

        public String getMessageId() {
            return messageId;
        }

        public void setMessageId(String messageId) {
            this.messageId = messageId;
        }

        @Override
        public String toString() {
            return "ReadStatusResponse{" +
                    "contactId='" + contactId + '\'' +
                    ", success=" + success +
                    ", messageId='" + messageId + '\'' +
                    '}';
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
