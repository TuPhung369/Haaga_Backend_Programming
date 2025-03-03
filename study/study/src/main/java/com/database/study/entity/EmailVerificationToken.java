// src/main/java/com/database/study/entity/EmailVerificationToken.java
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
@Table(name = "email_verification_tokens")
public class EmailVerificationToken {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;
    
    @Column(nullable = false)
    String token;
    
    @Column(nullable = false)
    String username;
    
    @Column(nullable = false)
    String email;
    
    @Column(nullable = false)
    LocalDateTime expiryDate;
    
    @Column(nullable = false)
    @Builder.Default
    boolean used = false;
}