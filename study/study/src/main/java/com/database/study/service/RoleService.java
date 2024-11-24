package com.database.study.service;

import java.util.HashSet;
import java.util.List;

import org.springframework.stereotype.Service;

import com.database.study.dto.request.RoleRequest;
import com.database.study.dto.response.RoleResponse;
import com.database.study.mapper.RoleMapper;
import com.database.study.repository.RoleRepository;
import com.database.study.repository.PermissionRepository;

import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class RoleService {

  final RoleRepository roleRepository;
  final RoleMapper roleMapper;
  final PermissionRepository permissionRepository;

  public RoleResponse createRole(RoleRequest request) {
    var role = roleMapper.toRole(request);
    var permissions = permissionRepository.findByNameIn(request.getPermissions());
    role.setPermissions(new HashSet<>(permissions));
    role = roleRepository.save(role);
    return roleMapper.toRoleResponse(role);
  }

  public List<RoleResponse> getAll() {
    return roleRepository.findAll().stream()
        .map(roleMapper::toRoleResponse)
        .toList();
  }

  public void deleteRole(String role) {
    roleRepository.deleteById(Long.parseLong(role));
  }
}