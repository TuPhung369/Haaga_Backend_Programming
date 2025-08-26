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
@Table(name = "totp_reset_requests")
public class TotpResetRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(nullable = false)
    String username;

    @Column(nullable = false)
    String email;

    @Column(nullable = false)
    LocalDateTime requestTime;

    @Column(nullable = false)
    @Builder.Default
    boolean processed = false;

    String processedBy;

    LocalDateTime processedTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    RequestStatus status = RequestStatus.PENDING;

    String notes;

    public void setResolvedBy(String adminUsername) {
        this.processedBy = adminUsername;
    }

    public void setResolvedAt(LocalDateTime now) {
        this.processedTime = now;
    }

    public enum RequestStatus {
        PENDING,
        APPROVED,
        REJECTED
    }
}