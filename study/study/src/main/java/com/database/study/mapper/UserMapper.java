package com.database.study.mapper;

import com.database.study.dto.request.UserCreationRequest;
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

  @Named("mapRoles")
  default Set<Role> map(Set<String> roles) {
    if (roles == null) {
      return null;
    }
    return roles.stream().map(Role::new).collect(Collectors.toSet());
  }

  @Named("mapToStringSet")
  default Set<String> mapToStringSet(Set<Role> roles) {
    if (roles == null) {
      return null;
    }
    return roles.stream().map(Role::getName).collect(Collectors.toSet());
  }

  // Maps a creation request to a new user entity
  @Mapping(target = "id", ignore = true)
  @Mapping(target = "roles", source = "roles", qualifiedByName = "mapRoles")
  User toUser(UserCreationRequest request);

  @Mapping(target = "roles", source = "roles", qualifiedByName = "rolesToStringSet")
  UserResponse toUserResponse(User user);

  @Named("rolesToStringSet")
  default Set<String> rolesToStringSet(Set<Role> roles) {
    return roles.stream()
        .map(Role::getName) // Extract the role name
        .collect(Collectors.toSet());
  }

  // Updates an existing user entity with request data, ignoring the 'id' field
  @Mapping(target = "id", ignore = true)
  @Mapping(target = "roles", source = "roles", qualifiedByName = "mapRoles")
  void updateUser(@MappingTarget User user, UserCreationRequest request);
}