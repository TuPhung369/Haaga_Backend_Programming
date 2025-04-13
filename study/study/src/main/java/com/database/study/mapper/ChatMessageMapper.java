package com.database.study.mapper;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.database.study.dto.request.ChatMessageRequest;
import com.database.study.dto.response.ChatMessageResponse;
import com.database.study.entity.ChatMessage;
import com.database.study.entity.User;

@Component
public class ChatMessageMapper {

    public ChatMessage toEntity(ChatMessageRequest request, User sender, User receiver) {
        return ChatMessage.builder()
                .sender(sender)
                .receiver(receiver)
                .content(request.getContent())
                .timestamp(LocalDateTime.now())
                .read(false)
                .conversationId(generateConversationId(sender.getId(), receiver.getId()))
                .build();
    }

    public ChatMessageResponse toResponse(ChatMessage message) {
        User sender = message.getSender();
        User receiver = message.getReceiver();

        String senderName = (sender.getFirstname() != null && sender.getLastname() != null) ?
                sender.getFirstname() + " " + sender.getLastname() :
                sender.getUsername() != null ? sender.getUsername() : sender.getEmail();

        String receiverName = (receiver.getFirstname() != null && receiver.getLastname() != null) ?
                receiver.getFirstname() + " " + receiver.getLastname() :
                receiver.getUsername() != null ? receiver.getUsername() : receiver.getEmail();

        return ChatMessageResponse.builder()
                .id(message.getId().toString())
                .content(message.getContent())
                .sender(new ChatMessageResponse.UserInfo(
                        message.getSender().getId().toString(),
                        senderName))
                .receiver(new ChatMessageResponse.UserInfo(
                        message.getReceiver().getId().toString(),
                        receiverName))
                .timestamp(message.getTimestamp().toString())
                .read(message.isRead())
                .build();
    }

    public List<ChatMessageResponse> toResponseList(List<ChatMessage> messages) {
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
