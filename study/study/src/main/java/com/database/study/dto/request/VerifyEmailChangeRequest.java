package com.database.study.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class VerifyEmailChangeRequest {
    private String userId;
    private String newEmail;
    private String verificationCode;
}