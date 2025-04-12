package com.database.study.mapper;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.database.study.dto.request.MessageRequest;
import com.database.study.dto.response.MessageResponse;
import com.database.study.entity.Message;
import com.database.study.entity.User;

@Component
public class MessageMapper {
    
    public Message toEntity(MessageRequest request, User sender, User receiver) {
        return Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(request.getContent())
                .timestamp(LocalDateTime.now())
                .read(false)
                .conversationId(generateConversationId(sender.getId(), receiver.getId()))
                .build();
    }
    
    public MessageResponse toResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .senderId(message.getSender().getId())
                .senderUsername(message.getSender().getUsername())
                .receiverId(message.getReceiver().getId())
                .receiverUsername(message.getReceiver().getUsername())
                .content(message.getContent())
                .timestamp(message.getTimestamp())
                .read(message.isRead())
                .conversationId(message.getConversationId())
                .build();
    }
    
    public List<MessageResponse> toResponseList(List<Message> messages) {
        return messages.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    // Generate a consistent conversation ID for two users
    public String generateConversationId(UUID user1Id, UUID user2Id) {
        // Ensure the conversation ID is the same regardless of who initiates
        UUID smallerId = user1Id.compareTo(user2Id) < 0 ? user1Id : user2Id;
        UUID largerId = user1Id.compareTo(user2Id) < 0 ? user2Id : user1Id;
        return smallerId.toString() + "_" + largerId.toString();
    }
}
