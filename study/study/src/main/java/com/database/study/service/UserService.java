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
      if (!userRepository.existsById(userId)) {
          throw new AppException(ErrorCode.USER_NOT_FOUND);
      }
      userRepository.deleteUserRolesByUserId(userId);
      eventRepository.deleteByUserId(userId);
      kanbanBoardRepository.deleteBoardsByUserId(userId);
      userRepository.deleteById(userId);
  }
}
