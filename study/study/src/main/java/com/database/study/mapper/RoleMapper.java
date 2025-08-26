package com.database.study.mapper;

import com.database.study.dto.response.RoleResponse;
import com.database.study.dto.response.PermissionResponse;
import com.database.study.entity.Role;
import com.database.study.entity.Permission;
import com.database.study.dto.request.RoleRequest;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.context.annotation.Lazy;

import java.util.Set;

@Lazy
@Mapper(componentModel = "spring")
public interface RoleMapper {
  @Mapping(target = "permissions", ignore = true)
  Role toRole(RoleRequest request);

  @Mapping(target = "permissions", expression = "java(toPermissionResponseSet(role.getPermissions()))")
  RoleResponse toRoleResponse(Role role);

  // Helper methods for mapping sets
  Set<PermissionResponse> toPermissionResponseSet(Set<Permission> permissions);

  // Helper method for mapping individual permissions
  PermissionResponse toPermissionResponse(Permission permission);
}
