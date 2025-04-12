package com.database.study.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.database.study.entity.Message;
import com.database.study.entity.User;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {
    
    // Find messages between two users
    @Query("SELECT m FROM Message m WHERE " +
           "(m.sender = :user1 AND m.receiver = :user2) OR " +
           "(m.sender = :user2 AND m.receiver = :user1) " +
           "ORDER BY m.timestamp DESC")
    Page<Message> findMessagesBetweenUsers(@Param("user1") User user1, 
                                          @Param("user2") User user2, 
                                          Pageable pageable);
    
    // Find messages by conversation ID
    Page<Message> findByConversationIdOrderByTimestampDesc(String conversationId, Pageable pageable);
    
    // Find unread messages for a user
    List<Message> findByReceiverAndReadFalseOrderByTimestampDesc(User receiver);
    
    // Count unread messages for a user
    long countByReceiverAndReadFalse(User receiver);
    
    // Find latest message for each conversation of a user
    @Query("SELECT m FROM Message m WHERE m.id IN " +
           "(SELECT MAX(m2.id) FROM Message m2 WHERE m2.sender = :user OR m2.receiver = :user " +
           "GROUP BY CASE " +
           "WHEN m2.sender = :user THEN m2.receiver.id " +
           "ELSE m2.sender.id END) " +
           "ORDER BY m.timestamp DESC")
    List<Message> findLatestMessagesForUser(@Param("user") User user);
    
    // Find all conversations for a user
    @Query("SELECT DISTINCT " +
           "CASE WHEN m.sender = :user THEN m.receiver " +
           "ELSE m.sender END " +
           "FROM Message m " +
           "WHERE m.sender = :user OR m.receiver = :user")
    List<User> findAllConversationPartnersForUser(@Param("user") User user);
}
