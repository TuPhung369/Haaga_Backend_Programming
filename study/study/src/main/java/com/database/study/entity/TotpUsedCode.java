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
@Table(name = "totp_used_codes", indexes = {
    @Index(name = "idx_username_code_timewindow", columnList = "username,code,timeWindow", unique = true)
})
public class TotpUsedCode {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;
    
    @Column(nullable = false)
    String username;
    
    @Column(nullable = false)
    String code;
    
    @Column(nullable = false)
    long timeWindow;
    
    @Column(nullable = false)
    LocalDateTime usedAt;
}