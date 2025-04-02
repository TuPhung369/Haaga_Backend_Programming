package com.database.study.repository;

import com.database.study.entity.LanguageMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LanguageMessageRepository extends JpaRepository<LanguageMessage, String> {

    /**
     * Find all messages in a session ordered by creation time
     */
    Page<LanguageMessage> findBySessionIdOrderByCreatedAtAsc(String sessionId, Pageable pageable);

    /**
     * Find all messages from a specific user ordered by creation time descending
     */
    Page<LanguageMessage> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    /**
     * Find all messages from a user in a specific language ordered by creation time
     * descending
     */
    Page<LanguageMessage> findByUserIdAndLanguageOrderByCreatedAtDesc(String userId, String language,
            Pageable pageable);

    /**
     * Find session metadata for a given session ID
     */
    Optional<LanguageMessage> findBySessionIdAndIsSessionMetadataTrue(String sessionId);

    /**
     * Check if a session exists by looking for messages with that session ID
     */
    boolean existsBySessionId(String sessionId);

    /**
     * Find all unique session IDs for a user (for listing sessions)
     */
    @Query("SELECT DISTINCT m.sessionId FROM LanguageMessage m WHERE m.userId = :userId ORDER BY MAX(m.createdAt) DESC")
    List<String> findDistinctSessionIdsByUserId(String userId);

    /**
     * Find the most recent messages
     */
    List<LanguageMessage> findTop5ByOrderByCreatedAtDesc();
}