package com.database.study.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.database.study.dto.request.UserCreationRequest;
import com.database.study.dto.request.UserUpdateRequest;
import com.database.study.dto.response.UserResponse;
import com.database.study.entity.ChatGroup;
import com.database.study.entity.Role;
import com.database.study.entity.User;
import com.database.study.enums.ENUMS;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.mapper.UserMapper;
import com.database.study.repository.ActiveTokenRepository;
import com.database.study.repository.ChatContactRepository;
import com.database.study.repository.ChatGroupRepository;
import com.database.study.repository.ChatMessageRepository;
import com.database.study.repository.EmailVerificationTokenRepository;
import com.database.study.repository.EventRepository;
import com.database.study.repository.KanbanBoardRepository;
import com.database.study.repository.RoleRepository;
import com.database.study.repository.TotpSecretRepository;
import com.database.study.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserService {

  UserRepository userRepository;
  UserMapper userMapper;
  PasswordEncoder passwordEncoder;
  RoleRepository roleRepository;
  EventRepository eventRepository;
  KanbanBoardRepository kanbanBoardRepository;
  EmailVerificationTokenRepository emailVerificationTokenRepository;
  ActiveTokenRepository invalidatedTokenRepository;
  TotpService totpService;
  TotpSecretRepository totpSecretRepository;
  ChatContactRepository chatContactRepository;
  ChatMessageRepository chatMessageRepository;
  ChatGroupRepository chatGroupRepository;

  // @PreAuthorize("hasAuthority('APPROVE_POST')") // using match for permission:
  // match EXACTLY the permission name or ROLE_ADMIN also)
  public List<UserResponse> getUsers() {
    return userRepository.findAll().stream()
        .map(userMapper::toUserResponse)
        .toList();
  }

  public UserResponse createUser(UserCreationRequest request) {
    String username = request.getUsername().trim();
    request.setUsername(username);
    if (userRepository.existsByUsernameIgnoreCase(username)) {
      log.warn("Attempted to create account with existing username: {}", username);
      throw new AppException(ErrorCode.USER_EXISTS)
          .addMetadata("field", "username");
    }

    User user = userMapper.toUser(request);
    user.setPassword(passwordEncoder.encode(request.getPassword()));
    user.setActive(true);

    // Set default role as USER if roles are not provided or empty
    List<String> roles = request.getRoles();
    if (roles == null || roles.isEmpty()) {
      roles = new ArrayList<>();
      roles.add(ENUMS.Role.USER.name());
    }

    // Fetch Role entities based on role names
    Set<Role> roleEntities = roles.stream()
        .map(roleName -> roleRepository.findByName(roleName)
            .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND)))
        .collect(Collectors.toSet());
    user.setRoles(roleEntities);

    user = userRepository.save(user);
    return userMapper.toUserResponse(user);
  }

  public UserResponse getMyInfo() {
    String name = SecurityContextHolder.getContext().getAuthentication().getName();
    User user = userRepository.findByUsername(name)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));

    UserResponse userResponse = userMapper.toUserResponse(user);

    // Add TOTP security information
    enrichUserResponseWithTotpInfo(userResponse);

    return userResponse;
  }

  @PostAuthorize("hasRole('ADMIN')")
  public UserResponse getUserById(UUID userId) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> {
          log.error("User with ID {} not found", userId);
          throw new AppException(ErrorCode.USER_NOT_FOUND);
        });

    UserResponse userResponse = userMapper.toUserResponse(user);

    // Add TOTP security information
    enrichUserResponseWithTotpInfo(userResponse);

    return userResponse;
  }

  @PreAuthorize("hasRole('ADMIN') || hasRole('MANAGER')")
  @Transactional
  public UserResponse updateUser(UUID userId, UserUpdateRequest request) {
    User existingUser = userRepository.findById(userId)
        .orElseThrow(() -> {
          log.error("User with ID {} not found", userId);
          throw new AppException(ErrorCode.USER_NOT_FOUND);
        });

    userMapper.updateUser(existingUser, request);

    // Only update password if a new one is provided
    if (request.isPasswordBeingUpdated()) {
      existingUser.setPassword(passwordEncoder.encode(request.getPassword()));
    }

    // Update roles
    List<String> roles = request.getRoles();
    if (roles != null && !roles.isEmpty()) {
      // Get current authenticated user's role
      String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
      User currentUser = userRepository.findByUsername(currentUsername)
          .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));

      boolean isAdmin = currentUser.getRoles().stream()
          .anyMatch(role -> role.getName().equals("ADMIN"));

      // Validate roles based on authenticated user's role
      if (!isAdmin) {
        // For MANAGER, restrict assigning ADMIN role
        if (roles.contains("ADMIN")) {
          log.warn("User with MANAGER role attempted to assign ADMIN role: {}", currentUsername);
          throw new AppException(ErrorCode.UNAUTHORIZED_ROLE_ASSIGNMENT)
              .addMetadata("field", "roles");
        }
      }

      Set<Role> roleEntities = roles.stream()
          .map(roleName -> roleRepository.findByName(roleName)
              .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND)))
          .collect(Collectors.toSet());
      existingUser.setRoles(roleEntities);
    }

    User updatedUser = userRepository.save(existingUser);
    return userMapper.toUserResponse(updatedUser);
  }

  @Transactional
  public UserResponse updateMyInfo(UUID userId, UserUpdateRequest request) {
    User existingUser = userRepository.findById(userId)
        .orElseThrow(() -> {
          log.error("User with ID {} not found", userId);
          throw new AppException(ErrorCode.USER_NOT_FOUND);
        });

    // Verify current password only if user is trying to change password
    if (request.isPasswordBeingUpdated()) {
      // Current password is required when changing password
      if (request.getCurrentPassword() == null || request.getCurrentPassword().isEmpty()) {
        log.warn("Current password is required when changing password for user: {}", existingUser.getUsername());
        throw new AppException(ErrorCode.CURRENT_PASSWORD_REQUIRED);
      }

      if (!passwordEncoder.matches(request.getCurrentPassword(), existingUser.getPassword())) {
        log.warn("Invalid current password for user: {}", existingUser.getUsername());
        throw new AppException(ErrorCode.INVALID_CREDENTIALS);
      }
    }

    userMapper.updateUser(existingUser, request);

    // Only update password if a new one is provided
    if (request.isPasswordBeingUpdated()) {
      existingUser.setPassword(passwordEncoder.encode(request.getPassword()));
    }

    // Update roles
    List<String> roles = request.getRoles();
    if (roles != null && !roles.isEmpty()) {
      Set<Role> roleEntities = roles.stream()
          .map(roleName -> roleRepository.findByName(roleName)
              .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND)))
          .collect(Collectors.toSet());
      existingUser.setRoles(roleEntities);
    }

    User updatedUser = userRepository.save(existingUser);
    return userMapper.toUserResponse(updatedUser);
  }

  @PreAuthorize("hasRole(T(com.database.study.enums.ENUMS.Role).ADMIN.name())")
  @Transactional
  public void deleteUser(UUID userId) {
    // Find user first to get username before deletion
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    String username = user.getUsername();
    log.info("Deleting user with ID: {} and username: {}", userId, username);

    try {
      // Delete all tokens related to user
      try {
        // Delete email verification tokens
        emailVerificationTokenRepository.deleteByUsername(username);
        log.info("Deleted email verification tokens for user: {}", username);
      } catch (Exception e) {
        log.error("Error deleting email verification tokens for user: {}", username, e);
      }

      try {
        // Delete invalidated tokens
        invalidatedTokenRepository.deleteByUsername(username);
        log.info("Deleted invalidated tokens for user: {}", username);
      } catch (Exception e) {
        log.error("Error deleting invalidated tokens for user: {}", username, e);
      }

      try {
        // Delete chat messages
        chatMessageRepository.deleteByUserIdAsSenderOrReceiver(userId);
        log.info("Deleted chat messages for user: {}", username);
      } catch (Exception e) {
        log.error("Error deleting chat messages for user: {}", username, e);
        throw e; // Re-throw this exception as it's critical for deletion
      }

      try {
        // Handle chat groups
        // 1. Get groups created by this user
        List<ChatGroup> createdGroups = chatGroupRepository.findGroupsCreatedByUser(userId);

        // 2. Delete messages in these groups
        for (ChatGroup group : createdGroups) {
          try {
            chatMessageRepository.deleteByGroupId(group.getId());
            log.info("Deleted messages for group: {}", group.getId());
          } catch (Exception e) {
            log.error("Error deleting messages for group: {}", group.getId(), e);
          }
        }

        // 3. Delete the groups created by this user
        for (ChatGroup group : createdGroups) {
          try {
            chatGroupRepository.delete(group);
            log.info("Deleted group: {}", group.getId());
          } catch (Exception e) {
            log.error("Error deleting group: {}", group.getId(), e);
          }
        }

        // 4. Remove user from all other groups
        List<ChatGroup> memberGroups = chatGroupRepository.findGroupsWhereUserIsMember(userId);
        User userEntity = userRepository.findById(userId).get(); // We already checked existence above

        for (ChatGroup group : memberGroups) {
          try {
            group.getMembers().remove(userEntity);
            chatGroupRepository.save(group);
            log.info("Removed user from group: {}", group.getId());
          } catch (Exception e) {
            log.error("Error removing user from group: {}", group.getId(), e);
          }
        }
        log.info("Removed user from all chat groups: {}", username);
      } catch (Exception e) {
        log.error("Error handling chat groups for user: {}", username, e);
        throw e; // Re-throw this exception as it's critical for deletion
      }

      try {
        // Delete chat contacts
        chatContactRepository.deleteByUserIdOrContactId(userId);
        log.info("Deleted chat contacts for user: {}", username);
      } catch (Exception e) {
        log.error("Error deleting chat contacts for user: {}", username, e);
        throw e; // Re-throw this exception as it's critical for deletion
      }

      // Delete user relationships
      userRepository.deleteUserRolesByUserId(userId);
      eventRepository.deleteByUserId(userId);
      kanbanBoardRepository.deleteBoardsByUserId(userId);

      // Finally delete the user
      userRepository.deleteById(userId);
      log.info("Successfully deleted user with ID: {} and username: {}", userId, username);
    } catch (Exception e) {
      log.error("Error during user deletion process for user ID: {}", userId, e);
      throw new AppException(ErrorCode.GENERAL_EXCEPTION);
    }
  }

  /**
   * Delete a user by username (alternative method)
   */
  @PreAuthorize("hasRole(T(com.database.study.enums.ENUMS.Role).ADMIN.name())")
  @Transactional
  public void deleteUserByUsername(String username) {
    User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTS));

    deleteUser(user.getId());
  }

  /**
   * Update user status (online, away, busy, offline)
   * 
   * @param userId User ID
   * @param status New status
   * @return Updated user information
   */
  @Transactional
  public UserResponse updateUserStatus(UUID userId, String status) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> {
          log.error("User with ID {} not found", userId);
          throw new AppException(ErrorCode.USER_NOT_FOUND);
        });

    // Update user status
    user.setUserStatus(status);
    User updatedUser = userRepository.save(user);

    log.info("Updated status for user {} to {}", user.getUsername(), status);
    return userMapper.toUserResponse(updatedUser);
  }

  private void enrichUserResponseWithTotpInfo(UserResponse userResponse) {
    boolean totpEnabled = totpService.isTotpEnabled(userResponse.getUsername());

    if (totpEnabled) {
      totpSecretRepository.findByUsernameAndActive(userResponse.getUsername(), true)
          .ifPresent(totpSecret -> {
            UserResponse.TotpSecurityInfo totpInfo = UserResponse.TotpSecurityInfo.builder()
                .enabled(true)
                .deviceName(totpSecret.getDeviceName())
                .enabledDate(totpSecret.getCreatedAt().toLocalDate())
                .deviceId(totpSecret.getId())
                .createdAt(totpSecret.getCreatedAt())
                .build();

            userResponse.setTotpSecurity(totpInfo);
          });
    } else {
      userResponse.setTotpSecurity(
          UserResponse.TotpSecurityInfo.builder()
              .enabled(false)
              .build());
    }
  }

}