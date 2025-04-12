package com.database.study.dto;

import lombok.Data;

@Data
public class ChatMessageDTO {
    private String id;
    private String content;
    private User sender;
    private User receiver;
    private String timestamp;
    private boolean read;

    @Data
    public static class User {
        private String id;
        private String name;

        public User() {
        }

        public User(String id, String name) {
            this.id = id;
            this.name = name;
        }
    }
}
