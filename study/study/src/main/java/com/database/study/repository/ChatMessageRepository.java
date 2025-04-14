package com.database.study.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.database.study.entity.ChatMessage;
import com.database.study.entity.User;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    // Find messages between two users
    @Query("SELECT m FROM ChatMessage m WHERE " +
           "(m.sender = :user1 AND m.receiver = :user2) OR " +
           "(m.sender = :user2 AND m.receiver = :user1) " +
           "ORDER BY m.timestamp DESC")
    Page<ChatMessage> findMessagesBetweenUsers(@Param("user1") User user1,
                                          @Param("user2") User user2,
                                          Pageable pageable);

    // Find messages by conversation ID
    Page<ChatMessage> findByConversationIdOrderByTimestampDesc(String conversationId, Pageable pageable);

    // Find unread messages for a user
    List<ChatMessage> findByReceiverAndReadFalseOrderByTimestampDesc(User receiver);

    // Count unread messages for a user
    long countByReceiverAndReadFalse(User receiver);

    // Find latest message for each conversation of a user
    @Query("SELECT m FROM ChatMessage m WHERE m.id IN " +
           "(SELECT MAX(m2.id) FROM ChatMessage m2 WHERE m2.sender = :user OR m2.receiver = :user " +
           "GROUP BY CASE " +
           "WHEN m2.sender = :user THEN m2.receiver.id " +
           "ELSE m2.sender.id END) " +
           "ORDER BY m.timestamp DESC")
    List<ChatMessage> findLatestMessagesForUser(@Param("user") User user);

    // Find all conversations for a user
    @Query("SELECT DISTINCT " +
           "CASE WHEN m.sender = :user THEN m.receiver " +
           "ELSE m.sender END " +
           "FROM ChatMessage m " +
           "WHERE m.sender = :user OR m.receiver = :user")
    List<User> findAllConversationPartnersForUser(@Param("user") User user);
    
    // Mark a message as read using a direct update query
    @Modifying
    @Query("UPDATE ChatMessage m SET m.read = true WHERE m.id = :messageId")
    void markMessageAsRead(@Param("messageId") UUID messageId);
    
    // Mark all messages in a conversation as read for a specific receiver
    @Modifying
    @Query("UPDATE ChatMessage m SET m.read = true WHERE m.conversationId = :conversationId AND m.receiver.id = :receiverId AND m.read = false")
    int markMessagesAsReadInConversation(@Param("conversationId") String conversationId, @Param("receiverId") UUID receiverId);
}
