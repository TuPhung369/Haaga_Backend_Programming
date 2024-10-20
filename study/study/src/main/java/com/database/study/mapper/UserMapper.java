package com.database.study.mapper;

import com.database.study.dto.request.UserCreationRequest;
import com.database.study.entity.User;
import com.database.study.dto.response.UserResponse;
import com.database.study.entity.Role;
import org.mapstruct.MappingTarget;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserMapper {

  default Set<Role> map(Set<String> roles) {
    if (roles == null) {
      return null;
    }
    return roles.stream().map(Role::new).collect(Collectors.toSet());
  }

  default Set<String> mapToStringSet(Set<Role> roles) {
    if (roles == null) {
      return null;
    }
    return roles.stream().map(Role::getName).collect(Collectors.toSet());
  }

  // Maps a creation request to a new user entity
  @Mapping(target = "id", ignore = true)
  @Mapping(target = "roles", source = "roles")
  User toUser(UserCreationRequest request);

  @Mapping(target = "roles", source = "roles")
  UserResponse toUserResponse(User user);

  // Updates an existing user entity with request data, ignoring the 'id' field
  @Mapping(target = "id", ignore = true)
  @Mapping(target = "roles", source = "roles")
  void updateUser(@MappingTarget User user, UserCreationRequest request);
}