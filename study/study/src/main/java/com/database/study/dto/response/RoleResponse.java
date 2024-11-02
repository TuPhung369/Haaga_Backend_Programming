package com.database.study.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RoleResponse {
  String name;
  String description;
  Set<PermissionResponse> permissions;

  public RoleResponse(String name, String description) {
    this.name = name;
    this.description = description;
  }
}
