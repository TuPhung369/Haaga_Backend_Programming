package com.database.study.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RefreshTokenResponse {
  String token;
  String refreshToken;
  boolean authenticated;
  boolean refreshed;
}
