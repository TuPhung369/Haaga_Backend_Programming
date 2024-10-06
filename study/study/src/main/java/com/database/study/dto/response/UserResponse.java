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
  String username;
  String firstname;
  String lastname;
  LocalDate dob;
  Set<String> roles;
}
