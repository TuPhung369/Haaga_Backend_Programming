package com.database.study.repository;

import com.database.study.entity.ActiveToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.List;

import org.springframework.stereotype.Repository;

@Repository
public interface ActiveTokenRepository extends JpaRepository<ActiveToken, String> {
  Optional<ActiveToken> findByToken(String token);
  Optional<ActiveToken> findByRefreshToken(String refreshToken);
  Optional<ActiveToken> findByUsername(String username);
  List<ActiveToken> findAllByUsername(String username);
  
  void deleteByUsername(String username);
  void deleteByToken(String token);

  // Add this method for active tokens (you had a PasswordResetToken query here)
  @Modifying
  @Query("DELETE FROM ActiveToken t WHERE t.expiryTime < ?1")
  int deleteByExpiryTimeBefore(java.util.Date date);
  
  @Modifying
  @Query("DELETE FROM ActiveToken t WHERE t.expiryRefreshTime < ?1")
  int deleteByExpiryRefreshTimeBefore(java.util.Date date);
  
  long countByExpiryTimeBefore(java.util.Date expiryTime);
}