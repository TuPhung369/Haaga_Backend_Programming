package com.database.study.mapper;

import com.database.study.dto.response.PermissionResponse;
import com.database.study.dto.request.PermissionRequest;
import com.database.study.entity.Permission;

import org.mapstruct.Mapper;
import org.springframework.context.annotation.Lazy;

import java.util.List;
import java.util.Set;

@Lazy
@Mapper(componentModel = "spring")
public interface PermissionMapper {

  Permission toPermission(PermissionRequest request);

  PermissionResponse toPermissionResponse(Permission permission);

  // Helper methods for mapping collections
  List<PermissionResponse> toPermissionResponseList(List<Permission> permissions);

  Set<PermissionResponse> toPermissionResponseSet(Set<Permission> permissions);

}