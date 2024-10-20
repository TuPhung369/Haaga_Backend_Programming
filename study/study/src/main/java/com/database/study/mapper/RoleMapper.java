package com.database.study.mapper;

import com.database.study.entity.Permission;
import org.mapstruct.Named;
import org.springframework.beans.factory.annotation.Autowired;
import com.database.study.repository.PermissionRepository;
import com.database.study.dto.response.RoleResponse;
import com.database.study.entity.Role;
import com.database.study.dto.request.RoleRequest;

import java.util.HashSet;
import java.util.Set;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public abstract class RoleMapper {

  @Autowired
  PermissionRepository permissionRepository;

  // Mapping RoleRequest to Role, ignoring users and mapping permissions manually
  @Mapping(target = "users", ignore = true) // Assuming users aren't mapped here
  @Mapping(target = "permissions", source = "permissions", qualifiedByName = "stringToPermissions")
  public abstract Role toRole(RoleRequest request);

  public abstract RoleResponse toRoleResponse(Role role);

  @Named("stringToPermissions")
  Set<Permission> stringToPermissions(Set<String> permissionNames) {
    // Use the permissionRepository to map each permission name to the corresponding
    // Permission entity
    Set<Permission> permissions = new HashSet<>();
    for (String name : permissionNames) {
      Permission permission = permissionRepository.findByName(name);
      if (permission != null) {
        permissions.add(permission);
      }
    }
    return permissions; // Return the set of Permission entities
  }
}
