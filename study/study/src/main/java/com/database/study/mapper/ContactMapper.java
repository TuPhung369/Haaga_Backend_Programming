package com.database.study.mapper;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.database.study.dto.response.ContactResponse;
import com.database.study.entity.Contact;
import com.database.study.entity.User;

@Component
public class ContactMapper {
    
    public Contact toEntity(User user, User contactUser, String displayName) {
        return Contact.builder()
                .user(user)
                .contact(contactUser)
                .displayName(displayName != null ? displayName : contactUser.getUsername())
                .status(Contact.ContactStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
    }
    
    public ContactResponse toResponse(Contact contact) {
        User contactUser = contact.getContact();
        
        return ContactResponse.builder()
                .id(contact.getId())
                .userId(contact.getUser().getId())
                .contactId(contactUser.getId())
                .username(contactUser.getUsername())
                .email(contactUser.getEmail())
                .displayName(contact.getDisplayName())
                .status(contact.getStatus())
                .createdAt(contact.getCreatedAt())
                .updatedAt(contact.getUpdatedAt())
                .firstname(contactUser.getFirstname())
                .lastname(contactUser.getLastname())
                // These fields would be populated by the service
                .online(false)
                .lastSeen(null)
                .unreadMessageCount(0)
                .build();
    }
    
    public List<ContactResponse> toResponseList(List<Contact> contacts) {
        return contacts.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    public ContactResponse toResponseWithUnreadCount(Contact contact, int unreadCount) {
        ContactResponse response = toResponse(contact);
        response.setUnreadMessageCount(unreadCount);
        return response;
    }
}
