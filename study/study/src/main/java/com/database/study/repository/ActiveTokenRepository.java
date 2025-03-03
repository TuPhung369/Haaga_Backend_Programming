package com.database.study.repository;

import com.database.study.entity.ActiveToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.Date;
import org.springframework.stereotype.Repository;

@Repository
public interface ActiveTokenRepository extends JpaRepository<ActiveToken, String> {
  Optional<ActiveToken> findByToken(String token);

  Optional<ActiveToken> findByRefreshToken(String refreshToken);

  Optional<ActiveToken> findByUsername(String username);

  void deleteByUsername(String username);

  void deleteByToken(String token);

  void deleteAllByExpiryTimeBefore(Date date);
  
  void deleteAllByExpiryRefreshTimeBefore(Date date);
}