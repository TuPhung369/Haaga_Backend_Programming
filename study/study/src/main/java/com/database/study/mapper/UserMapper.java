package com.database.study.mapper;

import com.database.study.dto.request.UserCreationRequest;
import com.database.study.dto.request.UserUpdateRequest;
import com.database.study.dto.response.PermissionResponse;
import com.database.study.dto.response.RoleResponse;
import com.database.study.dto.response.UserResponse;
import com.database.study.entity.Role;
import com.database.study.entity.TotpSecurity;
import com.database.study.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import org.mapstruct.NullValuePropertyMappingStrategy;


import java.util.List;
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

  // Method to map TotpSecurity entity to TotpSecurityInfo DTO
  @Named("mapTotpSecurityToInfo")
  default UserResponse.TotpSecurityInfo mapTotpSecurityToInfo(TotpSecurity totpSecurity) {
    if (totpSecurity == null) {
      return null;
    }
    return UserResponse.TotpSecurityInfo.builder()
        .enabled(totpSecurity.isEnabled())
        .deviceName("Authenticator App") // Default device name
        .enabledDate(totpSecurity.getSetupDate() != null ? totpSecurity.getSetupDate().toLocalDate() : null)
        .deviceId(totpSecurity.getId())
        .createdAt(totpSecurity.getSetupDate())
        .build();
  }

  // Method to map TotpSecurityInfo DTO to TotpSecurity entity
  @Named("mapTotpSecurityInfoToEntity")
  default TotpSecurity mapTotpSecurityInfoToEntity(UserResponse.TotpSecurityInfo totpSecurityInfo) {
    if (totpSecurityInfo == null) {
      return null;
    }
    return TotpSecurity.builder()
        .enabled(totpSecurityInfo.isEnabled())
        .id(totpSecurityInfo.getDeviceId())
        .setupDate(totpSecurityInfo.getCreatedAt())
        .verified(true) // Default to true when coming from response
        .build();
  }

  /**
   * Convert UserCreationRequest to User entity
   * Note: This method does not set roles or totpSecurity, which should be handled separately
   */
  @Mapping(target = "roles", ignore = true) // Ignore roles; set them in the service
  @Mapping(target = "id", ignore = true) // ID is typically auto-generated
  @Mapping(target = "email", source = "email") // Map email explicitly
  @Mapping(target = "password", source = "password") // Explicitly map password
  @Mapping(target = "block", constant = "false") // Default value for isBlock
  @Mapping(target = "timeTried", constant = "0") // Default value for timeTried
  @Mapping(target = "totpSecurity", ignore = true) // Ignore totpSecurity, set manually if needed
  @Mapping(target = "avatar", ignore = true) // Ignore new fields, set them manually if needed
  @Mapping(target = "position", ignore = true)
  @Mapping(target = "department", ignore = true)
  @Mapping(target = "education", ignore = true)
  @Mapping(target = "userStatus", ignore = true)
  User toUser(UserCreationRequest request);

  @Mapping(target = "roles", source = "roles", qualifiedByName = "mapRolesToRoleResponse")
  @Mapping(target = "id", source = "id")
  @Mapping(target = "active", source = "active")
  @Mapping(target = "totpSecurity", source = "totpSecurity", qualifiedByName = "mapTotpSecurityToInfo")
  @Mapping(target = "avatar", source = "avatar")
  @Mapping(target = "position", source = "position")
  @Mapping(target = "department", source = "department")
  @Mapping(target = "education", source = "education")
  @Mapping(target = "userStatus", source = "userStatus")
  UserResponse toUserResponse(User user);
  
  // Helper method for mapping lists of users
  List<UserResponse> toUserResponseList(List<User> users);

  // New Method: Convert UserResponse back to User
  @Mapping(target = "roles", ignore = true)
  @Mapping(target = "password", source = "lastname")
  @Mapping(target = "active", source = "active")
  @Mapping(target = "block", constant = "false") // Default value for isBlock
  @Mapping(target = "timeTried", constant = "0") // Default value for timeTried
  @Mapping(target = "totpSecurity", source = "totpSecurity", qualifiedByName = "mapTotpSecurityInfoToEntity")
  @Mapping(target = "avatar", source = "avatar")
  @Mapping(target = "position", source = "position")
  @Mapping(target = "department", source = "department")
  @Mapping(target = "education", source = "education")
  @Mapping(target = "userStatus", source = "userStatus")
  User toUser(UserResponse response);

  // Convert roles to string set for mapping if needed
  @Named("rolesToStringSet")
  default Set<String> rolesToStringSet(Set<Role> roles) {
    return roles.stream()
        .map(Role::getName)
        .collect(Collectors.toSet());
  }
  
  // Helper method to set profile fields from request to user
  @Named("setProfileFields")
  default void setProfileFields(User user, UserCreationRequest request) {
    if (request.getAvatar() != null) {
      user.setAvatar(request.getAvatar());
    }
    if (request.getPosition() != null) {
      user.setPosition(request.getPosition());
    }
    if (request.getDepartment() != null) {
      user.setDepartment(request.getDepartment());
    }
    if (request.getEducation() != null) {
      user.setEducation(request.getEducation());
    }
    if (request.getUserStatus() != null) {
      user.setUserStatus(request.getUserStatus());
    } else {
      user.setUserStatus("online"); // Default value
    }
  }
  
  // Helper method to set profile fields from update request to user
  @Named("setProfileFieldsFromUpdate")
  default void setProfileFieldsFromUpdate(User user, UserUpdateRequest request) {
    if (request.getAvatar() != null) {
      user.setAvatar(request.getAvatar());
    }
    if (request.getPosition() != null) {
      user.setPosition(request.getPosition());
    }
    if (request.getDepartment() != null) {
      user.setDepartment(request.getDepartment());
    }
    if (request.getEducation() != null) {
      user.setEducation(request.getEducation());
    }
    if (request.getUserStatus() != null) {
      user.setUserStatus(request.getUserStatus());
    } else {
      // Don't change existing status if not provided
    }
  }

  /**
   * Updates an existing user entity with request data, ignoring the 'id' field
   * Note: This method does not update roles or totpSecurity, which should be handled separately
   * Profile fields (avatar, position, etc.) should be updated using the setProfileFields helper method
   */
  @Mapping(target = "id", ignore = true)
  @Mapping(target = "roles", ignore = true) // Ignore roles; set them in the service
  @Mapping(target = "block", ignore = true) // Preserve existing isBlock value
  @Mapping(target = "timeTried", ignore = true) // Preserve existing timeTried value
  @Mapping(target = "totpSecurity", ignore = true) // Preserve existing totpSecurity
  @Mapping(target = "avatar", ignore = true) // Ignore new fields, set them manually if needed
  @Mapping(target = "position", ignore = true)
  @Mapping(target = "department", ignore = true)
  @Mapping(target = "education", ignore = true)
  @Mapping(target = "userStatus", ignore = true)
  void updateUser(@MappingTarget User user, UserCreationRequest request);
  
  /**
   * Updates an existing user entity with update request data
   * Note: This method does not update roles, totpSecurity, or password, which should be handled separately
   * Profile fields (avatar, position, etc.) should be updated using the setProfileFieldsFromUpdate helper method
   */
  @Mapping(target = "id", ignore = true)
  @Mapping(target = "roles", ignore = true) // Ignore roles; set them in the service
  @Mapping(target = "block", ignore = true) // Preserve existing isBlock value
  @Mapping(target = "timeTried", ignore = true) // Preserve existing timeTried value
  @Mapping(target = "totpSecurity", ignore = true) // Preserve existing totpSecurity
  @Mapping(target = "password", ignore = true) // Password is handled separately in service
  @Mapping(target = "avatar", ignore = true) // Ignore new fields, set them manually if needed
  @Mapping(target = "position", ignore = true)
  @Mapping(target = "department", ignore = true)
  @Mapping(target = "education", ignore = true)
  @Mapping(target = "userStatus", ignore = true)
  void updateUser(@MappingTarget User user, UserUpdateRequest request);
}