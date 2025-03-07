package com.database.study.repository;

import com.database.study.entity.EmailChangeToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailChangeTokenRepository extends JpaRepository<EmailChangeToken, UUID> {
    
    Optional<EmailChangeToken> findByToken(String token);
    
    Optional<EmailChangeToken> findByUsernameAndNewEmailAndUsed(String username, String newEmail, boolean used);
    
    void deleteByExpiryDateBefore(LocalDateTime dateTime);
    
    Optional<EmailChangeToken> findByUserIdAndNewEmailAndUsed(String userId, String newEmail, boolean used);
}