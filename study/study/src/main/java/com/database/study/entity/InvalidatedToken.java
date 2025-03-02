package com.database.study.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import java.util.Date;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InvalidatedToken {
  @Id
  String id;

  String sessionId;

  @Column(length = 500, nullable = false)
  String token;

  @Column(length = 500)
  String refreshToken;

  Date expiryTime;
  Date expiryRefreshTime;
  
  @Column(nullable = false)
  String username;
  String description;
}
