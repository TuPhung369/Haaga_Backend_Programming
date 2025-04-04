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
         * Find all messages for a user, ordered by creation date
         */
        Page<LanguageMessage> findByUserIdOrderByCreatedAtAsc(String userId, Pageable pageable);

        /**
         * Find the initial metadata message for a specific user and language
         */
        Optional<LanguageMessage> findByUserIdAndLanguageAndIsSessionMetadataTrue(String userId, String language);

        /**
         * Find all sessions (metadata messages) for a user
         */
        Page<LanguageMessage> findByUserIdAndIsSessionMetadataTrueOrderByCreatedAtDesc(String userId,
                        Pageable pageable);

        /**
         * Find sessions (metadata messages) by user and language
         */
        Page<LanguageMessage> findByUserIdAndLanguageAndIsSessionMetadataTrueOrderByCreatedAtDesc(String userId,
                        String language, Pageable pageable);

        /**
         * Check if a metadata entry exists for a user and language
         */
        boolean existsByUserIdAndLanguageAndIsSessionMetadataTrue(String userId, String language);

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
         * Find all unique languages for a user (for listing available languages)
         */
        @Query("SELECT DISTINCT m.language FROM LanguageMessage m WHERE m.userId = :userId ORDER BY MAX(m.createdAt) DESC")
        List<String> findDistinctLanguagesByUserId(String userId);

        /**
         * Find the most recent messages
         */
        List<LanguageMessage> findTop5ByOrderByCreatedAtDesc();

        // Option 2: Generic method that can be sorted using the Pageable parameter
        Page<LanguageMessage> findByUserId(String userId, Pageable pageable);
}