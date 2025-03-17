package com.database.study.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TotpSecurity {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  UUID id;

  @Column(nullable = false)
  @Builder.Default
  boolean enabled = false;

  @Column(length = 64)
  String secretKey;

  @Column(nullable = false)
  @Builder.Default
  boolean verified = false;

  @Column
  LocalDateTime setupDate;

  @Column
  LocalDateTime lastUsedDate;

  @Column(length = 512)
  String backupCodes;

  // References to control deletion/cascade
  @OneToOne(mappedBy = "totpSecurity")
  User user;
}