package com.database.study.mapper;

import com.database.study.dto.response.PermissionResponse;
import com.database.study.dto.request.PermissionRequest;
import com.database.study.entity.Permission;

import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PermissionMapper {

  Permission toPermission(PermissionRequest request);

  PermissionResponse toPermissionResponse(Permission permission);

}