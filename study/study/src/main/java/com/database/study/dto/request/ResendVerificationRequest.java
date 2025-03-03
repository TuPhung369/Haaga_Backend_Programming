package com.database.study.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResendVerificationRequest {
    
    @NotBlank(message = "Username is required")
    private String username;
}