package com.database.study.mapper;

import com.database.study.dto.request.UserCreationRequest;
import com.database.study.entity.User;
import com.database.study.dto.response.UserResponse;
import org.mapstruct.MappingTarget;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserMapper {

  // Maps a creation request to a new user entity
  @Mapping(target = "id", ignore = true)
  User toUser(UserCreationRequest request);

  UserResponse toUserResponse(User user);

  // Updates an existing user entity with request data, ignoring the 'id' field
  @Mapping(target = "id", ignore = true)
  void updateUser(@MappingTarget User user, UserCreationRequest request);
}
