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
@Table(name = "totp_secrets")
public class TotpSecret {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;
    
    @Column(nullable = false)
    String username;
    
    @Column(nullable = false)
    String secretKey;
    
    @Column(nullable = false)
    String deviceName;
    
    @Column(nullable = false)
    @Builder.Default
    LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(nullable = false)
    boolean active;
    
    @Column(length = 1000)
    String backupCodes;

    @Column(nullable = false)
    @Builder.Default
    private boolean secretEncrypted = false;
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}