// src/main/java/com/database/study/repository/EmailVerificationTokenRepository.java
package com.database.study.repository;

import com.database.study.entity.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, UUID> {
    Optional<EmailVerificationToken> findByToken(String token);
    Optional<EmailVerificationToken> findByUsernameAndUsed(String username, boolean used);

    @Modifying
    @Query("DELETE FROM EmailVerificationToken e WHERE e.username = :username")
    void deleteByUsername(@Param("username") String username);
    
    void deleteByExpiryDateBefore(LocalDateTime date);
}