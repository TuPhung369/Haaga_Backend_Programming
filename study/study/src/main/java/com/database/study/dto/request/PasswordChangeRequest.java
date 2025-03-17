package com.database.study.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PasswordChangeRequest {
  private String userId;
  private String currentPassword;
  private String newPassword;
  private String verificationCode;
  private boolean useTotp;
}