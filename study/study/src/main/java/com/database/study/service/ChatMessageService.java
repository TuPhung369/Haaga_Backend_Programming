package com.database.study.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    @Transactional
    public ChatMessageResponse sendMessage(String senderId, ChatMessageRequest request) {
        User sender = userRepository.findById(UUID.fromString(senderId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        User receiver = userRepository.findById(UUID.fromString(request.getReceiverId()))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // Create and save the message
        ChatMessage message = messageMapper.toEntity(request, sender, receiver);

        // If conversationId is not provided, generate one
        if (message.getConversationId() == null) {
            message.setConversationId(
                messageMapper.generateConversationId(sender.getId(), receiver.getId())
            );
        }

        message = messageRepository.save(message);
        log.info("Message sent from {} to {}: {}", sender.getUsername(), receiver.getUsername(), message.getId());

        ChatMessageResponse response = messageMapper.toResponse(message);

        // Send the message to the receiver via WebSocket
        messagingTemplate.convertAndSendToUser(
            receiver.getId().toString(),
            "/queue/messages",
            response
        );

        return response;
    }

    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> getMessagesBetweenUsers(String userId, String otherUserId, Pageable pageable) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

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
    public void markMessagesAsRead(String userId, String conversationId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Page<ChatMessage> messages = messageRepository.findByConversationIdOrderByTimestampDesc(conversationId, Pageable.unpaged());

        messages.forEach(message -> {
            if (message.getReceiver().equals(user) && !message.isRead()) {
                message.setRead(true);
                messageRepository.save(message);
            }
        });
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getLatestMessagesForUser(String userId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        List<ChatMessage> latestMessages = messageRepository.findLatestMessagesForUser(user);
        return messageMapper.toResponseList(latestMessages);
    }

    @Transactional(readOnly = true)
    public int getUnreadMessageCount(String userId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return (int) messageRepository.countByReceiverAndReadFalse(user);
    }

    @Transactional(readOnly = true)
    public int getUnreadMessageCountFromUser(String userId, String senderId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

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
