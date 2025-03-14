package com.database.study.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.database.study.entity.BlockList;

@Repository
public interface BlockListRepository extends JpaRepository<BlockList, String> {

  Optional<BlockList> findByUsername(String username);

  Optional<BlockList> findByEmail(String email);

  @Query("SELECT b FROM BlockList b WHERE b.ipAddress = ?1 AND (b.expiresAt IS NULL OR b.expiresAt > ?2)")
  List<BlockList> findActiveBlocksByIpAddress(String ipAddress, LocalDateTime now);

  @Query("SELECT b FROM BlockList b WHERE b.username = ?1 AND (b.expiresAt IS NULL OR b.expiresAt > ?2)")
  List<BlockList> findActiveBlocksByUsername(String username, LocalDateTime now);

  @Query("SELECT b FROM BlockList b WHERE b.email = ?1 AND (b.expiresAt IS NULL OR b.expiresAt > ?2)")
  List<BlockList> findActiveBlocksByEmail(String email, LocalDateTime now);

  @Query("SELECT COUNT(b) > 0 FROM BlockList b WHERE " +
      "(b.username = ?1 OR b.email = ?2 OR b.ipAddress = ?3) AND " +
      "(b.expiresAt IS NULL OR b.expiresAt > ?4)")
  boolean isBlocked(String username, String email, String ipAddress, LocalDateTime now);
}