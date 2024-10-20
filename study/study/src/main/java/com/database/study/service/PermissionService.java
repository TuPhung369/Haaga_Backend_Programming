package com.database.study.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.database.study.dto.request.PermissionRequest;
import com.database.study.dto.response.PermissionResponse;
import com.database.study.entity.Permission;
import com.database.study.mapper.PermissionMapper;
import com.database.study.repository.PermissionRepository;

import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class PermissionService {
  PermissionRepository permissionRepository;
  PermissionMapper permissionMapper;

  public PermissionResponse createPermission(PermissionRequest request) {
    Permission permission = permissionMapper.toPermission(request);
    permission = permissionRepository.save(permission);
    return permissionMapper.toPermissionResponse(permission);
  }

  public List<PermissionResponse> getAll() {
    return permissionRepository.findAll().stream()
        .map(permissionMapper::toPermissionResponse)
        .toList();
  }
  
  public void deletePermission(String permission) {
    permissionRepository.deleteById(permission);
  }
}
