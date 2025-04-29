package com.database.study.entity;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "chat_message")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "`read`", nullable = false)
    @Builder.Default
    private boolean read = false;

    @Column(name = "conversation_id")
    private String conversationId; // To group messages between two users

    @Column(name = "persistent", nullable = false)
    @Builder.Default
    private boolean persistent = true; // Whether this message should be stored permanently

    @ManyToOne
    @JoinColumn(name = "group_id")
    private ChatGroup group; // For group messages

    @Column(name = "metadata", columnDefinition = "TEXT")
    @Convert(converter = MapConverter.class)
    @Builder.Default
    private Map<String, Object> metadata = new HashMap<>(); // For additional message metadata

    // Add a getter that ensures we never return null
    public Map<String, Object> getMetadata() {
        if (metadata == null) {
            metadata = new HashMap<>();
        }
        return metadata;
    }

    // Add a setter that handles null values
    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata != null ? metadata : new HashMap<>();
    }
}
