package com.database.study.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "block_list")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlockList {

  @Id
  @GeneratedValue(generator = "UUID")
  @UuidGenerator
  @Column(name = "id", updatable = false, nullable = false)
  private String id;

  @Column(name = "username")
  private String username;

  @Column(name = "email")
  private String email;

  @Column(name = "ip_address")
  private String ipAddress;

  @Column(name = "reason")
  private String reason;

  @Column(name = "failed_attempts")
  private int failedAttempts;

  @Column(name = "verification_type")
  private String verificationType; // LOGIN, PASSWORD_RESET, EMAIL_CHANGE, etc.

  @Column(name = "blocked_time")
  private LocalDateTime blockedTime;

  @Column(name = "expires_at")
  private LocalDateTime expiresAt; // When the block expires, null for permanent blocks
}