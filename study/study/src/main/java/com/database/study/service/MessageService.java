package com.database.study.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.database.study.dto.request.MessageRequest;
import com.database.study.dto.response.MessageResponse;
import com.database.study.entity.Message;
import com.database.study.entity.User;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.mapper.MessageMapper;
import com.database.study.repository.MessageRepository;
import com.database.study.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {
    
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final MessageMapper messageMapper;
    private final SimpMessagingTemplate messagingTemplate;
    
    @Transactional
    public MessageResponse sendMessage(String senderId, MessageRequest request) {
        User sender = userRepository.findById(UUID.fromString(senderId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        User receiver = userRepository.findById(UUID.fromString(request.getReceiverId()))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        // Create and save the message
        Message message = messageMapper.toEntity(request, sender, receiver);
        
        // If conversationId is not provided, generate one
        if (message.getConversationId() == null) {
            message.setConversationId(
                messageMapper.generateConversationId(sender.getId(), receiver.getId())
            );
        }
        
        message = messageRepository.save(message);
        log.info("Message sent from {} to {}: {}", sender.getUsername(), receiver.getUsername(), message.getId());
        
        MessageResponse response = messageMapper.toResponse(message);
        
        // Send the message to the receiver via WebSocket
        messagingTemplate.convertAndSendToUser(
            receiver.getId().toString(),
            "/queue/messages",
            response
        );
        
        return response;
    }
    
    @Transactional(readOnly = true)
    public Page<MessageResponse> getMessagesBetweenUsers(String userId, String otherUserId, Pageable pageable) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        User otherUser = userRepository.findById(UUID.fromString(otherUserId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        Page<Message> messages = messageRepository.findMessagesBetweenUsers(user, otherUser, pageable);
        
        return messages.map(messageMapper::toResponse);
    }
    
    @Transactional(readOnly = true)
    public Page<MessageResponse> getMessagesByConversationId(String conversationId, Pageable pageable) {
        Page<Message> messages = messageRepository.findByConversationIdOrderByTimestampDesc(conversationId, pageable);
        return messages.map(messageMapper::toResponse);
    }
    
    @Transactional
    public void markMessagesAsRead(String userId, String conversationId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        Page<Message> messages = messageRepository.findByConversationIdOrderByTimestampDesc(conversationId, Pageable.unpaged());
        
        messages.forEach(message -> {
            if (message.getReceiver().equals(user) && !message.isRead()) {
                message.setRead(true);
                messageRepository.save(message);
            }
        });
    }
    
    @Transactional(readOnly = true)
    public List<MessageResponse> getLatestMessagesForUser(String userId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        List<Message> latestMessages = messageRepository.findLatestMessagesForUser(user);
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
        
        Page<Message> messages = messageRepository.findByConversationIdOrderByTimestampDesc(conversationId, Pageable.unpaged());
        
        return (int) messages.stream()
                .filter(message -> message.getReceiver().equals(user) && !message.isRead())
                .count();
    }
}
