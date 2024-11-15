package com.database.study.dto.request;

import lombok.Data;

@Data
public class ResetPasswordRequest {
  private String username;
  private String newPassword;
}