package com.database.study.mapper;

import com.database.study.dto.response.RoleResponse;
import com.database.study.entity.Role;
import com.database.study.dto.request.RoleRequest;


import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RoleMapper {
  @Mapping(target = "permissions", ignore = true)
  Role toRole(RoleRequest request);
  RoleResponse toRoleResponse(Role role);
}
