package com.database.study.mapper;

import com.database.study.dto.request.UserCreationRequest;
import com.database.study.dto.response.PermissionResponse;
import com.database.study.dto.response.RoleResponse;
import com.database.study.dto.response.UserResponse;
import com.database.study.entity.Role;
import com.database.study.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserMapper {

  // Method to map roles from Role entity to RoleResponse DTO
  @Named("mapRolesToRoleResponse")
  default Set<RoleResponse> mapRolesToRoleResponse(Set<Role> roles) {
    if (roles == null) {
      return null;
    }
    return roles.stream()
        .map(role -> RoleResponse.builder()
            .name(role.getName())
            .description(role.getDescription())
            .color(role.getColor())
            .permissions(role.getPermissions() != null ? role.getPermissions().stream()
                .map(permission -> new PermissionResponse(permission.getName(), permission.getDescription(),
                    permission.getColor()))
                .collect(Collectors.toSet()) : null)
            .build())
        .collect(Collectors.toSet());
  }

  @Mapping(target = "roles", ignore = true) // Ignore roles; set them in the service
  @Mapping(target = "id", ignore = true) // ID is typically auto-generated
  @Mapping(target = "password", source = "password") // Explicitly map password
  User toUser(UserCreationRequest request);

  @Mapping(target = "roles", source = "roles", qualifiedByName = "mapRolesToRoleResponse")
  @Mapping(target = "id", source = "id")
  UserResponse toUserResponse(User user);

  // New Method: Convert UserResponse back to User
  @Mapping(target = "roles", ignore = true)
  @Mapping(target = "password", source = "lastname")
  User toUser(UserResponse response);

  // Convert roles to string set for mapping if needed
  @Named("rolesToStringSet")
  default Set<String> rolesToStringSet(Set<Role> roles) {
    return roles.stream()
        .map(Role::getName)
        .collect(Collectors.toSet());
  }

  // Updates an existing user entity with request data, ignoring the 'id' field
  @Mapping(target = "id", ignore = true)
  @Mapping(target = "roles", ignore = true) // Ignore roles; set them in the service
  void updateUser(@MappingTarget User user, UserCreationRequest request);
}