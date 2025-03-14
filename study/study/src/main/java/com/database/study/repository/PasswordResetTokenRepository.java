package com.database.study.repository;

import com.database.study.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {
    Optional<PasswordResetToken> findByToken(String token);

    Optional<PasswordResetToken> findByUsernameAndUsed(String username, boolean used);

    void deleteByExpiryDateBefore(LocalDateTime date);

    // Add method to find OTP tokens for a user that haven't expired
    List<PasswordResetToken> findAllByUsernameAndExpiryDateAfter(String username, LocalDateTime date);
}