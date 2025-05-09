package com.database.study.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "active_tokens")
public class ActiveToken {

    @Id
    private String id;

    @Column(columnDefinition = "LONGTEXT")
    private String token;

    @Column(columnDefinition = "LONGTEXT")
    private String refreshToken;

    private Date expiryTime;

    private Date expiryRefreshTime;

    private String username;

    private String description;
}