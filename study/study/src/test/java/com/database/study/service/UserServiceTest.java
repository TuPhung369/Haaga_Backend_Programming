package com.database.study.service;

import com.database.study.dto.request.UserCreationRequest;
import com.database.study.dto.request.UserUpdateRequest;
import com.database.study.dto.response.UserResponse;
import com.database.study.entity.Role;
import com.database.study.entity.User;
import com.database.study.enums.ENUMS;
import com.database.study.exception.AppException;
import com.database.study.exception.ErrorCode;
import com.database.study.mapper.UserMapper;
import com.database.study.repository.RoleRepository;
import com.database.study.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

  @Mock
  private UserRepository userRepository;

  @Mock
  private UserMapper userMapper;

  @Mock
  private PasswordEncoder passwordEncoder;

  @Mock
  private RoleRepository roleRepository;

  @InjectMocks
  private UserService userService;

  private User user;
  private UserCreationRequest userCreationRequest;
  private UserUpdateRequest userUpdateRequest;
  private UserResponse userResponse;
  private Role role;

  @BeforeEach
  void setUp() {
    user = new User();
    user.setId(UUID.randomUUID());
    user.setUsername("testuser");
    user.setPassword("password");
    user.setEmail("testuser@example.com");

    role = new Role();
    role.setName(ENUMS.Role.USER.name());

    userCreationRequest = new UserCreationRequest();
    userCreationRequest.setUsername("testuser");
    userCreationRequest.setPassword("password");
    userCreationRequest.setEmail("testuser@example.com");
    userCreationRequest.setRoles(Collections.singletonList(ENUMS.Role.USER.name()));
    
    userUpdateRequest = new UserUpdateRequest();
    userUpdateRequest.setUsername("testuser");
    userUpdateRequest.setPassword("password");
    userUpdateRequest.setEmail("testuser@example.com");
    userUpdateRequest.setRoles(Collections.singletonList(ENUMS.Role.USER.name()));

    userResponse = new UserResponse();
    userResponse.setUsername("testuser");
    userResponse.setEmail("testuser@example.com");
  }

  @Test
  void testGetUsers() {
    when(userRepository.findAll()).thenReturn(Collections.singletonList(user));
    when(userMapper.toUserResponse(any(User.class))).thenReturn(userResponse);

    List<UserResponse> result = userService.getUsers();

    assertNotNull(result);
    assertEquals(1, result.size());
    verify(userRepository, times(1)).findAll();
    verify(userMapper, times(1)).toUserResponse(any(User.class));
  }

  @Test
  void testCreateUser_UserAlreadyExists() {
    when(userRepository.existsByUsername(anyString())).thenReturn(true);

    AppException exception = assertThrows(AppException.class, () -> {
      userService.createUser(userCreationRequest);
    });

    assertEquals(ErrorCode.USER_EXISTS, exception.getErrorCode());
    verify(userRepository, times(1)).existsByUsername(anyString());
  }

  @Test
  void testCreateUser_Success() {
    when(userRepository.existsByUsername(anyString())).thenReturn(false);
    when(userMapper.toUser(any(UserCreationRequest.class))).thenReturn(user);
    when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
    when(roleRepository.findByName(anyString())).thenReturn(Optional.of(role));
    when(userRepository.save(any(User.class))).thenReturn(user);
    when(userMapper.toUserResponse(any(User.class))).thenReturn(userResponse);

    UserResponse result = userService.createUser(userCreationRequest);

    assertNotNull(result);
    assertEquals(userResponse.getUsername(), result.getUsername());
    verify(userRepository, times(1)).existsByUsername(anyString());
    verify(userMapper, times(1)).toUser(any(UserCreationRequest.class));
    verify(passwordEncoder, times(1)).encode(anyString());
    verify(roleRepository, times(1)).findByName(anyString());
    verify(userRepository, times(1)).save(any(User.class));
    verify(userMapper, times(1)).toUserResponse(any(User.class));
  }

  @Test
  void testGetMyInfo_UserNotFound() {
    SecurityContext securityContext = mock(SecurityContext.class);
    Authentication authentication = mock(Authentication.class);
    SecurityContextHolder.setContext(securityContext);
    when(securityContext.getAuthentication()).thenReturn(authentication);
    when(authentication.getName()).thenReturn("testuser");
    when(userRepository.findByUsername(anyString())).thenReturn(Optional.empty());

    AppException exception = assertThrows(AppException.class, () -> {
      userService.getMyInfo();
    });

    assertEquals(ErrorCode.USER_NOT_EXISTS, exception.getErrorCode());
    verify(userRepository, times(1)).findByUsername(anyString());
  }

  @Test
  void testGetMyInfo_Success() {
    SecurityContext securityContext = mock(SecurityContext.class);
    Authentication authentication = mock(Authentication.class);
    SecurityContextHolder.setContext(securityContext);
    when(securityContext.getAuthentication()).thenReturn(authentication);
    when(authentication.getName()).thenReturn("testuser");
    when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(user));
    when(userMapper.toUserResponse(any(User.class))).thenReturn(userResponse);

    UserResponse result = userService.getMyInfo();

    assertNotNull(result);
    assertEquals(userResponse.getUsername(), result.getUsername());
    verify(userRepository, times(1)).findByUsername(anyString());
    verify(userMapper, times(1)).toUserResponse(any(User.class));
  }

  @Test
  void testGetUserById_UserNotFound() {
    when(userRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

    AppException exception = assertThrows(AppException.class, () -> {
      userService.getUserById(UUID.randomUUID());
    });

    assertEquals(ErrorCode.USER_NOT_FOUND, exception.getErrorCode());
    verify(userRepository, times(1)).findById(any(UUID.class));
  }

  @Test
  void testGetUserById_Success() {
    when(userRepository.findById(any(UUID.class))).thenReturn(Optional.of(user));
    when(userMapper.toUserResponse(any(User.class))).thenReturn(userResponse);

    UserResponse result = userService.getUserById(UUID.randomUUID());

    assertNotNull(result);
    assertEquals(userResponse.getUsername(), result.getUsername());
    verify(userRepository, times(1)).findById(any(UUID.class));
    verify(userMapper, times(1)).toUserResponse(any(User.class));
  }

  @Test
  void testUpdateUser_UserNotFound() {
    when(userRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

    AppException exception = assertThrows(AppException.class, () -> {
      userService.updateUser(UUID.randomUUID(), userUpdateRequest);
    });

    assertEquals(ErrorCode.USER_NOT_FOUND, exception.getErrorCode());
    verify(userRepository, times(1)).findById(any(UUID.class));
  }

  @Test
  void testUpdateUser_Success() {
    when(userRepository.findById(any(UUID.class))).thenReturn(Optional.of(user));
    when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
    when(roleRepository.findByName(anyString())).thenReturn(Optional.of(role));
    when(userRepository.save(any(User.class))).thenReturn(user);
    when(userMapper.toUserResponse(any(User.class))).thenReturn(userResponse);

    UserResponse result = userService.updateUser(UUID.randomUUID(), userUpdateRequest);

    assertNotNull(result);
    assertEquals(userResponse.getUsername(), result.getUsername());
    verify(userRepository, times(1)).findById(any(UUID.class));
    verify(passwordEncoder, times(1)).encode(anyString());
    verify(roleRepository, times(1)).findByName(anyString());
    verify(userRepository, times(1)).save(any(User.class));
    verify(userMapper, times(1)).toUserResponse(any(User.class));
  }

  @Test
  void testUpdateMyInfo_UserNotFound() {
    when(userRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

    AppException exception = assertThrows(AppException.class, () -> {
      userService.updateMyInfo(UUID.randomUUID(), userUpdateRequest);
    });

    assertEquals(ErrorCode.USER_NOT_FOUND, exception.getErrorCode());
    verify(userRepository, times(1)).findById(any(UUID.class));
  }

  @Test
  void testUpdateMyInfo_Success() {
    when(userRepository.findById(any(UUID.class))).thenReturn(Optional.of(user));
    when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
    when(roleRepository.findByName(anyString())).thenReturn(Optional.of(role));
    when(userRepository.save(any(User.class))).thenReturn(user);
    when(userMapper.toUserResponse(any(User.class))).thenReturn(userResponse);

    UserResponse result = userService.updateMyInfo(UUID.randomUUID(), userUpdateRequest);

    assertNotNull(result);
    assertEquals(userResponse.getUsername(), result.getUsername());
    verify(userRepository, times(1)).findById(any(UUID.class));
    verify(passwordEncoder, times(1)).encode(anyString());
    verify(roleRepository, times(1)).findByName(anyString());
    verify(userRepository, times(1)).save(any(User.class));
    verify(userMapper, times(1)).toUserResponse(any(User.class));
  }

  @Test
  void testDeleteUser_UserNotFound() {
    when(userRepository.existsById(any(UUID.class))).thenReturn(false);

    AppException exception = assertThrows(AppException.class, () -> {
      userService.deleteUser(UUID.randomUUID());
    });

    assertEquals(ErrorCode.USER_NOT_FOUND, exception.getErrorCode());
    verify(userRepository, times(1)).existsById(any(UUID.class));
  }

  @Test
  void testDeleteUser_Success() {
    when(userRepository.existsById(any(UUID.class))).thenReturn(true);

    userService.deleteUser(UUID.randomUUID());

    verify(userRepository, times(1)).existsById(any(UUID.class));
    verify(userRepository, times(1)).deleteById(any(UUID.class));
  }
}