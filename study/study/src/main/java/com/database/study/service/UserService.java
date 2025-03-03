package com.database.study.service;

import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import com.database.study.entity.User;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.repository.UserRepository;
import com.database.study.entity.Role;
import com.database.study.enums.ENUMS;
import com.database.study.repository.RoleRepository;
import com.database.study.repository.EventRepository;
import com.database.study.repository.KanbanBoardRepository;
import com.database.study.repository.EmailVerificationTokenRepository;
import com.database.study.repository.InvalidatedTokenRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import com.database.study.dto.request.UserCreationRequest;
import com.database.study.dto.response.UserResponse;
import com.database.study.mapper.UserMapper;

import java.util.ArrayList;
import java.util.Set;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

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
  InvalidatedTokenRepository invalidatedTokenRepository;


  // @PreAuthorize("hasAuthority('APPROVE_POST')") // using match for permission:
  // match EXACTLY the permission name or ROLE_ADMIN also)
  public List<UserResponse> getUsers() {
    return userRepository.findAll().stream()
        .map(userMapper::toUserResponse)
        .toList();
  }

  public UserResponse createUser(UserCreationRequest request) {
    if (userRepository.existsByUsername(request.getUsername())) {
      throw new AppException(ErrorCode.USER_EXISTS);
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
    return userMapper.toUserResponse(user);
  }

  @PostAuthorize("hasRole('ADMIN')")
  public UserResponse getUserById(UUID userId) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> {
          log.error("User with ID {} not found", userId);
          throw new AppException(ErrorCode.USER_NOT_FOUND);
        });
    return userMapper.toUserResponse(user);
  }

  @PreAuthorize("hasRole('ADMIN') || hasRole('MANAGER')")
  @Transactional
  public UserResponse updateUser(UUID userId, UserCreationRequest request) {
    User existingUser = userRepository.findById(userId)
        .orElseThrow(() -> {
          log.error("User with ID {} not found", userId);
          throw new AppException(ErrorCode.USER_NOT_FOUND);
        });

    userMapper.updateUser(existingUser, request);
    existingUser.setPassword(passwordEncoder.encode(request.getPassword()));

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

  public UserResponse updateMyInfo(UUID userId, UserCreationRequest request) {
    User existingUser = userRepository.findById(userId)
        .orElseThrow(() -> {
          log.error("User with ID {} not found", userId);
          throw new AppException(ErrorCode.USER_NOT_FOUND);
        });

    userMapper.updateUser(existingUser, request);
    existingUser.setPassword(passwordEncoder.encode(request.getPassword()));

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
}