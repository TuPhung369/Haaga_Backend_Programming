package com.database.study.mapper;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.database.study.dto.response.ChatContactResponse;
import com.database.study.entity.ChatContact;
import com.database.study.entity.User;

@Component
public class ChatContactMapper {

    public ChatContact toEntity(User user, User contactUser, String displayName) {
        return ChatContact.builder()
                .user(user)
                .contact(contactUser)
                .displayName(displayName != null ? displayName : contactUser.getUsername())
                .status(ChatContact.ContactStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
    }

    public ChatContactResponse toResponse(ChatContact contact) {
        User contactUser = contact.getContact();

        return ChatContactResponse.builder()
                .id(contact.getId().toString())
                .name(contact.getDisplayName() != null ? contact.getDisplayName() :
                     contactUser.getFirstname() + " " + contactUser.getLastname())
                .email(contactUser.getEmail())
                .status(contact.getStatus().toString().toLowerCase())
                .unreadCount(0) // This will be populated by the service
                .group(contact.getContactGroup())
                .build();
    }

    public List<ChatContactResponse> toResponseList(List<ChatContact> contacts) {
        return contacts.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ChatContactResponse toResponseWithUnreadCount(ChatContact contact, int unreadCount) {
        ChatContactResponse response = toResponse(contact);
        response.setUnreadCount(unreadCount);
        return response;
    }
}
