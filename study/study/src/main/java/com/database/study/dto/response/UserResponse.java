package com.database.study.dto.response;

import java.time.LocalDate;
import java.util.UUID;
import java.util.Set;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
  UUID id;
  String email;
  String username;
  String firstname;
  String lastname;
  LocalDate dob;

  Set<RoleResponse> roles;
  boolean active;

  TotpSecurityInfo totpSecurity;
  
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class TotpSecurityInfo {
    boolean enabled;
    String deviceName;
    LocalDate enabledDate;
  }
}
