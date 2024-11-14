package com.database.study.repository;

import com.database.study.entity.InvalidatedToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.Date;
import org.springframework.stereotype.Repository;

@Repository
public interface InvalidatedTokenRepository extends JpaRepository<InvalidatedToken, String> {
  Optional<InvalidatedToken> findByToken(String token);

  Optional<InvalidatedToken> findByRefreshToken(String token);

  Optional<InvalidatedToken> findByName(String name);

  void deleteByName(String name);

  void deleteByToken(String token);

  void deleteAllByExpiryTimeBefore(Date date);
}
