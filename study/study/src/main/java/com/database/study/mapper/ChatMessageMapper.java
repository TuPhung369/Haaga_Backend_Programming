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
                                .messageType("DIRECT") // Set message type to DIRECT for user-to-user messages
                                .build();
        }

        public ChatMessageResponse toResponse(ChatMessage message) {
                // Debug log at the start
                System.out.println("=== MAPPING MESSAGE TO RESPONSE ===");
                System.out.println("Message ID: " + message.getId());
                System.out.println("Message Type: " + message.getMessageType());
                System.out.println("Group: " + (message.getGroup() != null ? message.getGroup().getId() : "null"));
                System.out.println("Receiver: "
                                + (message.getReceiver() != null ? message.getReceiver().getId() : "null"));

                User sender = message.getSender();
                User receiver = message.getReceiver();

                String senderName = (sender.getFirstname() != null && sender.getLastname() != null)
                                ? sender.getFirstname() + " " + sender.getLastname()
                                : sender.getUsername() != null ? sender.getUsername() : sender.getEmail();

                ChatMessageResponse response = new ChatMessageResponse();
                response.setId(message.getId().toString());
                response.setContent(message.getContent());
                response.setSender(new ChatMessageResponse.UserInfo(
                                message.getSender().getId().toString(),
                                senderName));
                response.setTimestamp(message.getTimestamp().toString());
                response.setRead(message.isRead());
                response.setPersistent(message.isPersistent());

                // IMPORTANT: Set receiver to null by default
                response.setReceiver(null);

                // Check if this is a group message
                if (message.getGroup() != null || "GROUP".equals(message.getMessageType())) {
                        // For group messages, set group info and ensure receiver is null
                        if (message.getGroup() != null) {
                            response.setGroupId(message.getGroup().getId().toString());
                            response.setGroupName(message.getGroup().getName());
                        }
                        
                        // Ensure receiver is null for group messages
                        response.setReceiver(null);

                        // Debug log
                        System.out.println("Mapped GROUP message: " + message.getId() +
                                        " for group: " + (message.getGroup() != null ? message.getGroup().getId() : "null") +
                                        " with message type: " + message.getMessageType());
                } else if (receiver != null) {
                        // For direct messages, set receiver info
                        String receiverName = (receiver.getFirstname() != null && receiver.getLastname() != null)
                                        ? receiver.getFirstname() + " " + receiver.getLastname()
                                        : receiver.getUsername() != null ? receiver.getUsername() : receiver.getEmail();

                        ChatMessageResponse.UserInfo receiverInfo = new ChatMessageResponse.UserInfo(
                                        receiver.getId().toString(),
                                        receiverName);
                        response.setReceiver(receiverInfo);

                        // Debug log
                        System.out.println("Mapped DIRECT message: " + message.getId() +
                                        " to receiver: " + receiver.getId() +
                                        " with message type: " + message.getMessageType());
                }

                // Final verification
                System.out.println("=== FINAL RESPONSE ===");
                System.out.println("Message ID: " + response.getId());
                System.out.println("Group ID: " + response.getGroupId());
                System.out.println("Receiver: "
                                + (response.getReceiver() != null ? response.getReceiver().getId() : "null"));

                return response;
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
