package com.database.study.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

import com.database.study.entity.Contact.ContactStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactResponse {
    
    private UUID id;
    private UUID userId;
    private UUID contactId;
    private String username;
    private String email;
    private String displayName;
    private ContactStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String firstname;
    private String lastname;
    private boolean online;
    private LocalDateTime lastSeen;
    private int unreadMessageCount;
}
