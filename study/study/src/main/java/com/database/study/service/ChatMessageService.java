package com.database.study.service;

import java.util.List;
import java.util.UUID;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.database.study.dto.request.ChatMessageRequest;
import com.database.study.dto.response.ChatMessageResponse;
import com.database.study.entity.ChatMessage;
import com.database.study.entity.User;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.mapper.ChatMessageMapper;
import com.database.study.repository.ChatMessageRepository;
import com.database.study.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for managing chat messages between users
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatMessageService {

    private final ChatMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ChatMessageMapper messageMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public ChatMessageResponse sendMessage(String username, ChatMessageRequest request) {
        log.info("ChatMessageService.sendMessage called for user: {} to receiver: {}", username, request.getReceiverId());
        log.info("Message content: {}", request.getContent());

        try {
            // Find the sender by username
            log.info("Finding sender by username: {}", username);
            User sender = userRepository.findByUsername(username)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
            log.info("Sender found: {}", sender.getId());

            // Find the receiver by UUID
            log.info("Finding receiver by UUID: {}", request.getReceiverId());
            User receiver = userRepository.findById(UUID.fromString(request.getReceiverId()))
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
            log.info("Receiver found: {}", receiver.getId());

            // Create the message entity
            log.info("Creating message entity");
            ChatMessage message = messageMapper.toEntity(request, sender, receiver);

            // Set the persistent flag based on the request
            Boolean persistentValue = request.getPersistent();
            boolean isPersistent = persistentValue != null ? persistentValue : true;
            message.setPersistent(isPersistent);
            log.info("Message persistence set to: {}, raw value from request: {}", isPersistent, persistentValue);

            // Log additional debug information
            log.debug("Request details - Content: {}, ReceiverID: {}, Persistent flag type: {}",
                    request.getContent().substring(0, Math.min(20, request.getContent().length())),
                    request.getReceiverId(),
                    persistentValue != null ? persistentValue.getClass().getName() : "null");

            // If conversationId is not provided, generate one
            if (message.getConversationId() == null) {
                log.info("Generating conversation ID");
                String conversationId = messageMapper.generateConversationId(sender.getId(), receiver.getId());
                message.setConversationId(conversationId);
                log.info("Conversation ID generated: {}", conversationId);
            }

            // Only save to database if the message is persistent
            if (isPersistent) {
                log.info("Saving message to database (persistent=true)");
                message = messageRepository.save(message);
                log.info("Message saved with ID: {}", message.getId());
            } else {
                log.info("Skipping database save for non-persistent message (persistent=false)");
                // Generate a temporary ID for non-persistent messages
                message.setId(UUID.randomUUID());

                // Ensure we're explicitly marking this as non-persistent for downstream processing
                message.setPersistent(false);

                // Log the decision to skip saving
                log.info("Message with ID {} will NOT be saved to database due to persistent=false flag", message.getId());
            }

            log.info("Creating response DTO");
            ChatMessageResponse response = messageMapper.toResponse(message);
            log.info("Response created with ID: {}", response.getId());

            // Send the message to the receiver via WebSocket
            log.info("Sending message to receiver via WebSocket: {}", receiver.getId());
            messagingTemplate.convertAndSendToUser(
                    receiver.getId().toString(),
                    "/queue/messages",
                    response
            );
            log.info("Message sent to receiver via WebSocket");

            return response;
        } catch (AppException e) {
            log.error("Application error in ChatMessageService.sendMessage: {}", e.getMessage(), e);
            throw e; // Re-throw application exceptions
        } catch (IllegalArgumentException e) {
            log.error("Invalid argument in ChatMessageService.sendMessage: {}", e.getMessage(), e);
            throw e; // Re-throw validation errors
        } catch (MessagingException e) {
            log.error("Messaging error in ChatMessageService.sendMessage: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to deliver message via WebSocket", e);
        } catch (RuntimeException e) {
            log.error("Runtime error in ChatMessageService.sendMessage: {}", e.getMessage(), e);
            throw e; // Re-throw runtime exceptions
        } catch (Exception e) {
            log.error("Unexpected error in ChatMessageService.sendMessage", e);
            throw new RuntimeException("An unexpected error occurred while sending the message", e);
        }
    }

    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> getMessagesBetweenUsers(String username, String otherUserId, Pageable pageable) {
        // Find the current user by username
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // Find the other user by UUID
        User otherUser = userRepository.findById(UUID.fromString(otherUserId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Page<ChatMessage> messages = messageRepository.findMessagesBetweenUsers(user, otherUser, pageable);

        return messages.map(messageMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> getMessagesByConversationId(String conversationId, Pageable pageable) {
        Page<ChatMessage> messages = messageRepository.findByConversationIdOrderByTimestampDesc(conversationId, pageable);
        return messages.map(messageMapper::toResponse);
    }

    @Transactional
    public void markMessagesAsRead(String username, String conversationId) {
        // Find the user by username
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        log.info("Marking messages as read for user {} (ID: {}) in conversation {}",
                username, user.getId(), conversationId);

        // Verify the conversation ID format
        if (!conversationId.contains("_")) {
            log.warn("Invalid conversation ID format: {}. Expected format: 'uuid_uuid'", conversationId);
            // Try to find the other user ID from the provided ID (which might be a contact ID)
            try {
                UUID contactId = UUID.fromString(conversationId);
                User contact = userRepository.findById(contactId)
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                // Generate the correct conversation ID
                conversationId = generateConversationId(user.getId(), contact.getId());
                log.info("Generated correct conversation ID: {}", conversationId);
            } catch (Exception e) {
                log.error("Failed to generate conversation ID from contact ID: {}", conversationId, e);
                // Continue with the provided ID as a fallback
            }
        }

        // First try with a direct SQL update for better performance
        try {
            log.info("Executing direct SQL update to mark messages as read for conversation ID: {}", conversationId);

            // Use a native SQL query to update all messages at once
            int updatedCount = messageRepository.markMessagesAsReadInConversation(conversationId, user.getId());

            log.info("Direct SQL update affected {} rows for conversation ID: {}", updatedCount, conversationId);

            // If no rows were affected, try the entity-based approach
            if (updatedCount == 0) {
                log.info("No rows affected by direct SQL update, trying entity-based approach for conversation ID: {}", conversationId);
                updateMessagesEntityBased(user, conversationId);
            } else {
                // Force a flush to ensure changes are committed
                messageRepository.flush();
                log.info("Flushed changes to database for conversation ID: {}", conversationId);
            }
        } catch (Exception e) {
            log.error("Error with direct SQL update for conversation ID: {}", conversationId, e);
            log.info("Falling back to entity-based approach for conversation ID: {}", conversationId);
            updateMessagesEntityBased(user, conversationId);
        }

        // Final verification
        verifyMessagesRead(user, conversationId);
    }

    // Helper method to generate a conversation ID
    private String generateConversationId(UUID user1Id, UUID user2Id) {
        // Ensure the conversation ID is the same regardless of who initiates
        UUID smallerId = user1Id.compareTo(user2Id) < 0 ? user1Id : user2Id;
        UUID largerId = user1Id.compareTo(user2Id) < 0 ? user2Id : user1Id;
        return smallerId.toString() + "_" + largerId.toString();
    }

    private void updateMessagesEntityBased(User user, String conversationId) {
        log.info("Using entity-based approach to mark messages as read for conversation ID: {}", conversationId);

        Page<ChatMessage> messages = messageRepository.findByConversationIdOrderByTimestampDesc(conversationId, Pageable.unpaged());
        log.info("Found {} messages in conversation {}", messages.getTotalElements(), conversationId);

        // Log all messages in the conversation for debugging
        messages.forEach(message -> {
            log.info("Message in conversation: ID={}, Sender={}, Receiver={}, Read={}, Content={}",
                    message.getId(),
                    message.getSender().getId(),
                    message.getReceiver().getId(),
                    message.isRead(),
                    message.getContent().substring(0, Math.min(20, message.getContent().length())) + "...");
        });

        int count = 0;
        for (ChatMessage message : messages) {
            if (message.getReceiver().equals(user) && !message.isRead()) {
                try {
                    log.info("Marking message {} as read (entity method) - Receiver ID: {}, User ID: {}",
                            message.getId(), message.getReceiver().getId(), user.getId());
                    message.setRead(true);
                    messageRepository.save(message);
                    count++;

                    // Force a flush after each save to ensure it's committed
                    messageRepository.flush();

                    log.info("Marked message {} as read via entity update", message.getId());
                } catch (Exception ex) {
                    log.error("Error marking message {} as read with entity approach", message.getId(), ex);

                    // Try with direct update as last resort
                    try {
                        log.info("Trying direct update for message {}", message.getId());
                        messageRepository.markMessageAsRead(message.getId());
                        messageRepository.flush();
                        log.info("Direct update successful for message {}", message.getId());
                    } catch (Exception directEx) {
                        log.error("Direct update also failed for message {}", message.getId(), directEx);
                    }
                }
            } else {
                if (message.getReceiver().equals(user)) {
                    log.info("Message {} already marked as read, skipping", message.getId());
                } else {
                    log.info("Message {} is not for this user (receiver: {}), skipping",
                            message.getId(), message.getReceiver().getId());
                }
            }
        }

        log.info("Entity-based approach marked {} messages as read in conversation {}", count, conversationId);
    }

    private void verifyMessagesRead(User user, String conversationId) {
        log.info("Verifying messages were marked as read for conversation ID: {}", conversationId);

        // Clear persistence context to ensure we get fresh data
        entityManager.clear();

        Page<ChatMessage> verifyMessages = messageRepository.findByConversationIdOrderByTimestampDesc(conversationId, Pageable.unpaged());
        log.info("Found {} messages in conversation {} for verification", verifyMessages.getTotalElements(), conversationId);

        int stillUnreadCount = 0;
        int totalMessagesForUser = 0;

        for (ChatMessage message : verifyMessages) {
            if (message.getReceiver().equals(user)) {
                totalMessagesForUser++;

                if (!message.isRead()) {
                    stillUnreadCount++;
                    log.warn("Message {} is still unread after all update attempts - Sender: {}, Content: {}",
                            message.getId(),
                            message.getSender().getId(),
                            message.getContent().substring(0, Math.min(20, message.getContent().length())) + "...");

                    // One final attempt with direct SQL
                    try {
                        log.info("Final attempt to mark message {} as read", message.getId());
                        messageRepository.markMessageAsRead(message.getId());
                        messageRepository.flush();
                        log.info("Final direct update successful for message {}", message.getId());
                    } catch (Exception ex) {
                        log.error("Final attempt failed for message {}", message.getId(), ex);
                    }
                } else {
                    log.info("Message {} is correctly marked as read", message.getId());
                }
            }
        }

        log.info("Verification summary for conversation {}: Total messages for user: {}, Still unread: {}",
                conversationId, totalMessagesForUser, stillUnreadCount);

        if (stillUnreadCount > 0) {
            log.warn("{} messages are still unread after all update attempts in conversation {}",
                    stillUnreadCount, conversationId);
        } else {
            log.info("All messages successfully marked as read in conversation {}", conversationId);
        }
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getLatestMessagesForUser(String username) {
        // Find the user by username
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        List<ChatMessage> latestMessages = messageRepository.findLatestMessagesForUser(user);
        return messageMapper.toResponseList(latestMessages);
    }

    @Transactional(readOnly = true)
    public int getUnreadMessageCount(String username) {
        // Find the user by username
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return (int) messageRepository.countByReceiverAndReadFalse(user);
    }

    @Transactional(readOnly = true)
    public int getUnreadMessageCountFromUser(String username, String senderId) {
        // Find the user by username
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // Find the sender by UUID
        User sender = userRepository.findById(UUID.fromString(senderId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        String conversationId = messageMapper.generateConversationId(user.getId(), sender.getId());

        Page<ChatMessage> messages = messageRepository.findByConversationIdOrderByTimestampDesc(conversationId, Pageable.unpaged());

        return (int) messages.stream()
                .filter(message -> message.getReceiver().equals(user) && !message.isRead())
                .count();
    }

    /**
     * Get a message by ID
     *
     * @param messageId The ID of the message to retrieve
     * @return The message response
     */
    @Transactional(readOnly = true)
    public ChatMessageResponse getMessageById(UUID messageId) {
        ChatMessage message = messageRepository.findById(messageId)
                .orElseThrow(() -> new AppException(ErrorCode.MESSAGE_NOT_FOUND));

        return messageMapper.toResponse(message);
    }

    /**
     * Delete a message
     *
     * @param userId The ID of the user making the request
     * @param messageId The ID of the message to delete
     */
    @Transactional
    public void deleteMessage(String userId, UUID messageId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        ChatMessage message = messageRepository.findById(messageId)
                .orElseThrow(() -> new AppException(ErrorCode.MESSAGE_NOT_FOUND));

        // Verify this message belongs to the user (either as sender or receiver)
        if (!message.getSender().getId().equals(user.getId()) && !message.getReceiver().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        messageRepository.delete(message);
        log.info("Message deleted: {} by {}", messageId, user.getUsername());
    }

    /**
     * Edit a message (only allowed for the sender)
     *
     * @param userId The ID of the user making the request
     * @param messageId The ID of the message to edit
     * @param newContent The new content for the message
     * @return The updated message response
     */
    @Transactional
    public ChatMessageResponse editMessage(String userId, UUID messageId, String newContent) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        ChatMessage message = messageRepository.findById(messageId)
                .orElseThrow(() -> new AppException(ErrorCode.MESSAGE_NOT_FOUND));

        // Verify this message was sent by the user
        if (!message.getSender().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Update the content
        message.setContent(newContent);
        message = messageRepository.save(message);

        ChatMessageResponse response = messageMapper.toResponse(message);

        // Notify the receiver about the edit
        messagingTemplate.convertAndSendToUser(
                message.getReceiver().getId().toString(),
                "/queue/message-updates",
                response
        );

        log.info("Message edited: {} by {}", messageId, user.getUsername());

        return response;
    }

    /**
     * Delete all messages in a conversation
     *
     * @param userId The ID of the user making the request
     * @param otherUserId The ID of the other user in the conversation
     */
    @Transactional
    public void deleteConversation(String userId, String otherUserId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        User otherUser = userRepository.findById(UUID.fromString(otherUserId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        String conversationId = messageMapper.generateConversationId(user.getId(), otherUser.getId());

        Page<ChatMessage> messages = messageRepository.findByConversationIdOrderByTimestampDesc(conversationId, Pageable.unpaged());

        // Delete all messages in the conversation
        messages.forEach(messageRepository::delete);

        log.info("Conversation deleted between {} and {}", user.getUsername(), otherUser.getUsername());
    }

    /**
     * Get all conversation partners for a user
     *
     * @param userId The ID of the user
     * @return List of users who have exchanged messages with this user
     */
    @Transactional(readOnly = true)
    public List<User> getConversationPartners(String userId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return messageRepository.findAllConversationPartnersForUser(user);
    }
}
