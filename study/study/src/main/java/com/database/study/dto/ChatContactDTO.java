package com.database.study.dto;

import lombok.Data;

@Data
public class ChatContactDTO {
    private String id;
    private String name;
    private String email;
    private String status; // online, offline, away
    private int unreadCount;
    private String lastMessage;
}
